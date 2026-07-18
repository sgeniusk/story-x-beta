// Dive X 실시간 채팅 세션 · TDD 케이스 (Task 1~3)
import { describe, expect, it } from 'vitest';
import {
  createDiveSession,
  appendMessage,
  shouldSuggestCondense,
  selectCondenseSpan,
  captureCondenseSourceSpan,
  parseCondenseSourceSpan,
  resolveCondenseSourceBoundary,
  applyCondenseResult,
  applyCondenseCheckpoint,
  buildTranscript,
  buildCondenseTranscript,
  buildRecentDialogue,
  parseSceneSegments,
  buildVsCandidatesInput,
  buildPlayDirectionSeed,
  CONDENSE_SUGGEST_TURNS,
  CONDENSE_KEEP_RECENT
} from './diveSession';
import { createEmptyProject } from './storyEngine';

describe('diveSession', () => {
  // Task 1
  it('createDiveSession은 빈 버퍼로 캐릭터·연대기를 묶는다', () => {
    const s = createDiveSession('char-1', 'proj-1');
    expect(s.characterId).toBe('char-1');
    expect(s.projectId).toBe('proj-1');
    expect(s.chatBuffer).toEqual([]);
    expect(s.lastCondensedTurn).toBe(0);
    expect(s.pendingCondenseSuggested).toBe(false);
  });

  it('appendMessage는 순차 turn과 id를 부여한다', () => {
    let s = createDiveSession('c', 'p');
    s = appendMessage(s, 'user', '안녕');
    s = appendMessage(s, 'character', '...왔어?');
    expect(s.chatBuffer.map((m) => m.turn)).toEqual([1, 2]);
    expect(s.chatBuffer.map((m) => m.role)).toEqual(['user', 'character']);
    expect(s.chatBuffer[0].text).toBe('안녕');
    expect(s.chatBuffer[0].id).toMatch(/^msg-/);
  });

  // Task 2
  it('shouldSuggestCondense는 버퍼가 임계값 이상일 때만 true', () => {
    let s = createDiveSession('c', 'p');
    expect(shouldSuggestCondense(s)).toBe(false);
    for (let i = 0; i < CONDENSE_SUGGEST_TURNS; i += 1) {
      s = appendMessage(s, i % 2 === 0 ? 'user' : 'character', `t${i}`);
    }
    expect(shouldSuggestCondense(s)).toBe(true);
  });

  it('selectCondenseSpan은 소비 watermark 이하 연결 문맥만 남기고 최신 턴까지 응결 대상으로 삼는다', () => {
    let s = createDiveSession('c', 'p');
    for (let i = 0; i < 6; i += 1) s = appendMessage(s, 'user', `t${i}`);
    s = { ...s, lastCondensedTurn: 2 };
    const { condense, keep } = selectCondenseSpan(s);
    expect(keep).toHaveLength(CONDENSE_KEEP_RECENT);
    expect(condense).toHaveLength(4);
    expect(keep.map((message) => message.turn)).toEqual([1, 2]);
    expect(condense.map((message) => message.turn)).toEqual([3, 4, 5, 6]);
  });

  it('applyCondenseResult는 이번 source 최신 두 턴만 연결 문맥으로 남기고 끝까지 소비한다', () => {
    let s = createDiveSession('c', 'p');
    for (let i = 0; i < 6; i += 1) s = appendMessage(s, 'user', `t${i}`);
    s = { ...s, pendingCondenseSuggested: true };
    const after = applyCondenseResult(s);
    expect(after.chatBuffer).toHaveLength(CONDENSE_KEEP_RECENT);
    expect(after.chatBuffer.map((message) => message.turn)).toEqual([5, 6]);
    expect(after.lastCondensedTurn).toBe(6);
    expect(after.pendingCondenseSuggested).toBe(false);
    expect(appendMessage(after, 'user', 'next').chatBuffer.at(-1)?.turn).toBe(7);
  });

  it('부분 성공 checkpoint 재개는 당시 응결 경계까지만 제거하고 이후 PLAY 대화를 보존한다', () => {
    let s = createDiveSession('c', 'p');
    for (let index = 0; index < 8; index += 1) {
      s = appendMessage(s, index % 2 === 0 ? 'user' : 'character', `t${index + 1}`);
    }

    const after = applyCondenseCheckpoint(s, 4);

    expect(after.chatBuffer.map((message) => message.turn)).toEqual([5, 6, 7, 8]);
    expect(after.lastCondensedTurn).toBe(4);
    expect(after.pendingCondenseSuggested).toBe(false);
  });

  it('응결 source span은 이미 소비된 경계 뒤 최신 두 턴까지 이번 transcript에 고정한다', () => {
    let s = createDiveSession('c', 'p');
    for (let index = 0; index < 6; index += 1) {
      s = appendMessage(s, index % 2 === 0 ? 'user' : 'character', `t${index + 1}`);
    }

    const span = captureCondenseSourceSpan(s);
    const transcript = buildCondenseTranscript(s, span);

    expect(span).toEqual({
      afterTurn: 0,
      throughTurn: 6,
      messageIds: ['msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5', 'msg-6'],
      continuityMessageIds: ['msg-5', 'msg-6']
    });
    expect(transcript).toContain('나: t5');
    expect(transcript).toContain('상대: t6');
  });

  it('승인 뒤 source tail은 recent dialogue에 남지만 다음 condense transcript에서는 제외한다', () => {
    let s = createDiveSession('c', 'p');
    for (let index = 0; index < 6; index += 1) {
      s = appendMessage(s, index % 2 === 0 ? 'user' : 'character', `t${index + 1}`);
    }

    const span = captureCondenseSourceSpan(s);
    const after = applyCondenseCheckpoint(s, span);

    expect(after.chatBuffer.map((message) => message.turn)).toEqual([5, 6]);
    expect(after.lastCondensedTurn).toBe(6);
    expect(buildRecentDialogue(after)).toBe('나: t5\n상대: t6');
    expect(buildCondenseTranscript(after)).toBe('');
  });

  it('응결 생성 뒤 추가된 턴은 exact source span 승인 뒤 보존되어 다음 transcript가 된다', () => {
    let s = createDiveSession('c', 'p');
    for (let index = 0; index < 6; index += 1) {
      s = appendMessage(s, index % 2 === 0 ? 'user' : 'character', `t${index + 1}`);
    }
    const span = captureCondenseSourceSpan(s);
    s = appendMessage(s, 'user', '생성 중 추가한 질문');
    s = appendMessage(s, 'character', '생성 중 추가된 대답');

    const after = applyCondenseCheckpoint(s, span);

    expect(after.chatBuffer.map((message) => message.turn)).toEqual([5, 6, 7, 8]);
    expect(after.lastCondensedTurn).toBe(6);
    expect(buildCondenseTranscript(after)).toBe(
      '나: 생성 중 추가한 질문\n상대: 생성 중 추가된 대답'
    );
  });

  it('exact source span과 legacy 숫자 checkpoint는 각각의 경계를 넘지 않고 재적용해도 멱등이다', () => {
    let exactSession = createDiveSession('c', 'p');
    for (let index = 0; index < 8; index += 1) {
      exactSession = appendMessage(
        exactSession,
        index % 2 === 0 ? 'user' : 'character',
        `t${index + 1}`
      );
    }
    const exactSpan = {
      afterTurn: 0,
      throughTurn: 6,
      messageIds: ['msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5', 'msg-6'],
      continuityMessageIds: ['msg-5', 'msg-6']
    };

    const exactOnce = applyCondenseCheckpoint(exactSession, exactSpan);
    const exactTwice = applyCondenseCheckpoint(exactOnce, exactSpan);
    expect(exactTwice).toEqual(exactOnce);
    expect(exactTwice.chatBuffer.map((message) => message.turn)).toEqual([5, 6, 7, 8]);

    const legacyOnce = applyCondenseCheckpoint(exactSession, 4);
    const legacyTwice = applyCondenseCheckpoint(legacyOnce, 4);
    expect(legacyTwice).toEqual(legacyOnce);
    expect(legacyTwice.chatBuffer.map((message) => message.turn)).toEqual([5, 6, 7, 8]);
    expect(legacyTwice.lastCondensedTurn).toBe(4);
  });

  it('source span parser는 continuity가 실제 마지막 두 ID가 아니거나 turn 구간 수와 다르면 강등한다', () => {
    expect(parseCondenseSourceSpan({
      afterTurn: 0,
      throughTurn: 4,
      messageIds: ['m1', 'm2', 'm3', 'm4'],
      continuityMessageIds: ['m1', 'm2']
    })).toBeUndefined();
    expect(parseCondenseSourceSpan({
      afterTurn: 0,
      throughTurn: 99,
      messageIds: ['m1', 'm2'],
      continuityMessageIds: ['m1', 'm2']
    })).toBeUndefined();
  });

  it('receipt source 경계는 현재 세션 turn·ID와 일치하는 root/recovery만 쓰고 없으면 0으로 보존한다', () => {
    let session = createDiveSession('c', 'p');
    for (let index = 0; index < 8; index += 1) {
      session = appendMessage(session, index % 2 === 0 ? 'user' : 'character', `t${index + 1}`);
    }
    const damagedRoot = {
      afterTurn: 0,
      throughTurn: 8,
      messageIds: Array.from({ length: 8 }, (_, index) => `damaged-${index + 1}`),
      continuityMessageIds: ['damaged-7', 'damaged-8']
    };
    const recoverySpan = {
      afterTurn: 0,
      throughTurn: 6,
      messageIds: ['msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5', 'msg-6'],
      continuityMessageIds: ['msg-5', 'msg-6']
    };

    expect(resolveCondenseSourceBoundary(session, damagedRoot, recoverySpan, 4)).toEqual(recoverySpan);
    expect(resolveCondenseSourceBoundary(session, damagedRoot, undefined, undefined)).toBe(0);
    expect(resolveCondenseSourceBoundary(session, damagedRoot, undefined, 4)).toBe(4);

    const continuityOnly = {
      ...session,
      chatBuffer: session.chatBuffer.slice(2, 4),
      lastCondensedTurn: 4
    };
    const missingBoundary = resolveCondenseSourceBoundary(
      continuityOnly,
      undefined,
      undefined,
      undefined
    );
    expect(missingBoundary).toBe(0);
    expect(applyCondenseCheckpoint(continuityOnly, missingBoundary).chatBuffer.map((message) => message.turn))
      .toEqual([3, 4]);
  });

  // Task 3
  it('buildTranscript는 화자 라벨이 붙은 줄글로 직렬화', () => {
    let s = createDiveSession('c', 'p');
    s = appendMessage(s, 'user', '안녕');
    s = appendMessage(s, 'character', '왔구나.');
    expect(buildTranscript(s.chatBuffer)).toBe('나: 안녕\n상대: 왔구나.');
  });

  it('buildRecentDialogue는 버퍼의 최근 N턴만 포맷', () => {
    let s = createDiveSession('c', 'p');
    for (let i = 0; i < 8; i += 1) s = appendMessage(s, i % 2 === 0 ? 'user' : 'character', `t${i}`);
    const recent = buildRecentDialogue(s, 4);
    expect(recent.split('\n')).toHaveLength(4);
    expect(recent).toContain('t7');
    expect(recent).not.toContain('t3');
  });

  // Task 1: DiveSession.scene + parseSceneSegments
  it('createDiveSession은 scene을 비워 둔다(하위호환)', () => {
    expect(createDiveSession('c', 'p').scene).toBeUndefined();
  });

  it('createDiveSession은 arc를 비워 둔다', () => {
    expect(createDiveSession('c', 'p').arc).toBeUndefined();
  });

  it('parseSceneSegments는 평문 줄을 내레이션으로', () => {
    const segs = parseSceneSegments('도윤네 집은 불이 꺼져 있다.');
    expect(segs).toEqual([{ kind: 'narration', text: '도윤네 집은 불이 꺼져 있다.' }]);
  });

  it('parseSceneSegments는 "이름: 대사" 줄을 화자 대사로', () => {
    const segs = parseSceneSegments('도윤 母: 누구세요?');
    expect(segs).toEqual([{ kind: 'dialogue', speaker: '도윤 母', text: '누구세요?' }]);
  });

  it('parseSceneSegments는 서술+대사 혼합을 줄 단위로 분해하고 빈 줄을 버린다', () => {
    const segs = parseSceneSegments('현관이 열려 있다.\n\n도윤 母: 누구세요? *문틈으로 본다*');
    expect(segs).toHaveLength(2);
    expect(segs[0]).toEqual({ kind: 'narration', text: '현관이 열려 있다.' });
    expect(segs[1]).toEqual({ kind: 'dialogue', speaker: '도윤 母', text: '누구세요? *문틈으로 본다*' });
  });

  it('parseSceneSegments는 콜론 앞이 길거나(>20) 별표면 화자로 오인하지 않는다', () => {
    const long = '그러니까 내가 하고 싶은 말은 사실 이거였는데: 외계인이야';
    expect(parseSceneSegments(long)[0].kind).toBe('narration');
    expect(parseSceneSegments('*그가 웃는다: 짧게*')[0].kind).toBe('narration');
  });

  it('appendMessage — verdict를 메시지에 부착한다 (MVP-1)', () => {
    let s = createDiveSession('c', 'p');
    s = appendMessage(s, 'user', '안녕');
    s = appendMessage(s, 'character', '사실 서준은 죽었어.', {
      conflicts: [{ factId: 'a1', band: 'anchor', factStatement: '서준은 살아 있다', snippet: '사실 서준은 죽었어.' }],
      surpriseCandidates: [],
      blocksCanonization: true
    });
    expect(s.chatBuffer[1].verdict?.blocksCanonization).toBe(true);
  });

  it('buildCondenseTranscript — 캐논화 차단 턴을 응결에서 제외한다', () => {
    let s = createDiveSession('c', 'p');
    s = appendMessage(s, 'user', '무슨 일이야');
    s = appendMessage(s, 'character', '사실 서준은 죽었어.', {
      conflicts: [{ factId: 'a1', band: 'anchor', factStatement: '서준은 살아 있다', snippet: '사실 서준은 죽었어.' }],
      surpriseCandidates: [], blocksCanonization: true
    });
    s = appendMessage(s, 'user', '정말?');
    s = appendMessage(s, 'character', '응, 오래된 이야기야.');
    const transcript = buildCondenseTranscript(s);
    expect(transcript).not.toContain('사실 서준은 죽었어.');
    expect(transcript).toContain('무슨 일이야');
  });
});

describe('buildPlayDirectionSeed — VS 후보를 PLAY 연출 지시로 감쌈', () => {
  it('괄호 연출문으로 감싸고 앞뒤 공백을 제거한다 (⏭전개과 같은 계열)', () => {
    expect(buildPlayDirectionSeed('  도윤이 먼저 진실을 꺼낸다 ')).toBe('(전개 — 도윤이 먼저 진실을 꺼낸다)');
  });
});

describe('buildVsCandidatesInput — PLAY 런타임 상태 → VsCandidatesInput', () => {
  it('scene+최근 대화로 recentSummary, canon·미회수 약속·medium 을 채우고 format 미설정은 빈 문자열', () => {
    const base = createEmptyProject({ title: 't', medium: 'novel' });
    const project = {
      ...base,
      canonFacts: [{ id: 'c1', episode: 1, owner: 'character' as const, statement: '도윤은 왼손잡이다' }],
      chapters: [
        {
          id: 'episode-1', episode: 1, title: '1화', hook: '', outline: [],
          beats: [], prose: '', memoryAnchors: [], newCanonFacts: [],
          rewardArc: [{ promise: '배신자의 정체', payoff: '' }]
        }
      ]
    };
    let session = createDiveSession('seed', project.id);
    session = { ...session, scene: '현관 앞', chatBuffer: [{ id: 'm1', role: 'user' as const, text: '안녕', turn: 1 }] };
    const input = buildVsCandidatesInput(session, project);
    expect(input.recentSummary).toContain('현관 앞');
    expect(input.recentSummary).toContain('안녕');
    expect(input.canonStatements).toEqual(['도윤은 왼손잡이다']);
    expect(input.unpaidPromises).toEqual(['배신자의 정체']);
    expect(input.medium).toBe('novel');
    expect(input.format).toBe('');
  });
});
