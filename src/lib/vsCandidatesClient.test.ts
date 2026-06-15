import { describe, it, expect } from 'vitest';
import { normalizeVsCandidates } from './episodeBriefing';

// vsCandidatesClient 는 normalizeVsCandidates(episodeBriefing)를 재사용한다 — 정규화 계약을 클라이언트 경로에서 한 번 더 핀.
describe('vsCandidatesClient 정규화 계약', () => {
  it('provider candidates 를 rarity 라벨까지 변환한다', () => {
    const out = normalizeVsCandidates({ candidates: [{ direction: '배신', probability: 0.1 }] }, []);
    expect(out).toEqual([{ direction: '배신', probability: 0.1, rarity: 'radical' }]);
  });
  it('빈 응답은 빈 배열', () => {
    expect(normalizeVsCandidates({ candidates: [] }, [])).toEqual([]);
  });
});
