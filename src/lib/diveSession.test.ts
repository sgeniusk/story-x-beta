// Dive X 실시간 채팅 세션 · TDD 케이스 (Task 1~3)
import { describe, expect, it } from 'vitest';
import {
  createDiveSession,
  appendMessage,
  shouldSuggestCondense,
  selectCondenseSpan,
  applyCondenseResult,
  buildTranscript,
  buildRecentDialogue,
  CONDENSE_SUGGEST_TURNS,
  CONDENSE_KEEP_RECENT
} from './diveSession';

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
});
