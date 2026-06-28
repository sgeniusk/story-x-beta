// Dive X 진입 — 자유 서술로 인물·상황을 풀어 쓰면 세팅을 뽑아 바로 대화로. 제안 카드는 보조.
import { useState } from 'react';
import { requestDiveSetup, requestDiveProposals } from '../lib/diveClient';
import type { DiveProposal, DiveSetup, NoveltyLevel } from '../lib/diveProposal';

interface DiveStartProps {
  onStart: (setup: DiveSetup) => void;
  onPick: (proposal: DiveProposal) => void;
  onBack: () => void;
}

const NOVELTY_OPTIONS: Array<{ id: NoveltyLevel; label: string }> = [
  { id: 'safe', label: '안전' },
  { id: 'tilt', label: '살짝 비틈' },
  { id: 'bold', label: '과감' }
];

export function DiveStart({ onStart, onPick, onBack }: DiveStartProps) {
  const [story, setStory] = useState('');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  // 보조 — 제안 카드
  const [inspireOpen, setInspireOpen] = useState(false);
  const [novelty, setNovelty] = useState<NoveltyLevel>('tilt');
  const [proposals, setProposals] = useState<DiveProposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  async function start() {
    setStarting(true);
    setError('');
    try {
      const res = await requestDiveSetup({ story });
      if (res.setup) onStart(res.setup);
      else setError('조금만 더 적어주세요 — 누구와, 어디서, 무슨 상황인지 한두 줄이면 충분해요.');
    } catch {
      setError('시작 요청에 실패했어요.');
    } finally {
      setStarting(false);
    }
  }

  async function propose() {
    setLoadingProposals(true);
    setError('');
    try {
      const res = await requestDiveProposals({ topic: story, novelty });
      setProposals(res.proposals);
    } catch {
      setError('제안 요청에 실패했어요.');
    } finally {
      setLoadingProposals(false);
    }
  }

  return (
    <div className="dx-start">
      <button className="dx-back" onClick={onBack}>← 뒤로</button>
      <h2 className="dx-start-title">어떤 이야기로 들어갈까요?</h2>
      <label className="dx-start-label">어떤 인물과, 어떤 상황에서 시작하고 싶어요? 자유롭게 적어주세요.</label>
      <textarea
        className="dx-start-story"
        placeholder="예: 비 오는 날 편의점 야간 알바인데, 매일 우산을 사가는 단골이 사실 내가 잊은 첫사랑이라는 걸 오늘 알게 됨"
        value={story}
        onChange={(e) => setStory(e.target.value)}
      />
      <button className="dx-propose" onClick={start} disabled={starting}>
        {starting ? '시작하는 중…' : '시작하기'}
      </button>
      {error && <p className="dx-start-error">{error}</p>}

      <button className="dx-inspire-toggle" onClick={() => setInspireOpen((v) => !v)}>
        {inspireOpen ? '제안 닫기' : '막히면 제안 받기'}
      </button>
      {inspireOpen && (
        <div className="dx-inspire-panel">
          <div className="dx-novelty-dial">
            {NOVELTY_OPTIONS.map((o) => (
              <button
                key={o.id}
                className={o.id === novelty ? 'dx-novelty-on' : 'dx-novelty-off'}
                onClick={() => setNovelty(o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <button className="dx-propose" onClick={propose} disabled={loadingProposals}>
            {loadingProposals ? '제안 만드는 중…' : '제안 받기'}
          </button>
          <div className="dx-proposal-list">
            {proposals.map((p, i) => (
              <button key={i} className="dx-proposal-card" onClick={() => onPick(p)}>
                <span className="dx-twist-tag">{p.twist}</span>
                <strong className="dx-proposal-hook">{p.hook}</strong>
                <span className="dx-proposal-scene">{p.scene}</span>
                <span className="dx-proposal-cast">{p.cast.map((c) => c.name).join(' · ')}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
