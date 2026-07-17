// Dive X 실시간 채팅 세션 · TDD 케이스 (Task 1~3)
import { describe, expect, it } from 'vitest';
import {
  createDiveSession,
  appendMessage,
  shouldSuggestCondense,
  selectCondenseSpan,
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

  it('selectCondenseSpan은 최근 KEEP_RECENT개를 남기고 나머지를 응결 대상으로', () => {
    let s = createDiveSession('c', 'p');
    for (let i = 0; i < 6; i += 1) s = appendMessage(s, 'user', `t${i}`);
    const { condense, keep } = selectCondenseSpan(s);
    expect(keep).toHaveLength(CONDENSE_KEEP_RECENT);
    expect(condense).toHaveLength(6 - CONDENSE_KEEP_RECENT);
    expect(condense[0].text).toBe('t0');
    expect(keep[keep.length - 1].text).toBe('t5');
  });

  it('applyCondenseResult는 버퍼를 keep 구간으로 줄이고 lastCondensedTurn을 갱신', () => {
    let s = createDiveSession('c', 'p');
    for (let i = 0; i < 6; i += 1) s = appendMessage(s, 'user', `t${i}`);
    s = { ...s, pendingCondenseSuggested: true };
    const after = applyCondenseResult(s);
    expect(after.chatBuffer).toHaveLength(CONDENSE_KEEP_RECENT);
    expect(after.lastCondensedTurn).toBe(6 - CONDENSE_KEEP_RECENT);
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
