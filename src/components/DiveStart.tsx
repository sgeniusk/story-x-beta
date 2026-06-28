// Dive X 진입 — 소재 한 줄 + 신기성 다이얼로 장면 전제 후보를 추천받아 고른다
import { useState } from 'react';
import { requestDiveProposals } from '../lib/diveClient';
import type { DiveProposal, NoveltyLevel } from '../lib/diveProposal';

interface DiveStartProps {
  onPick: (proposal: DiveProposal) => void;
  onBack: () => void;
}

const NOVELTY_OPTIONS: Array<{ id: NoveltyLevel; label: string }> = [
  { id: 'safe', label: '안전' },
  { id: 'tilt', label: '살짝 비틈' },
  { id: 'bold', label: '과감' }
];

export function DiveStart({ onPick, onBack }: DiveStartProps) {
  const [topic, setTopic] = useState('');
  const [novelty, setNovelty] = useState<NoveltyLevel>('tilt');
  const [proposals, setProposals] = useState<DiveProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function propose() {
    setLoading(true);
    setError('');
    try {
      const res = await requestDiveProposals({ topic, novelty });
      setProposals(res.proposals);
      if (res.proposals.length === 0) setError('제안을 만들지 못했어요. 소재를 바꿔 다시 시도해 보세요.');
    } catch {
      setError('제안 요청에 실패했어요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dx-start">
      <button className="dx-back" onClick={onBack}>← 뒤로</button>
      <h2 className="dx-start-title">어떤 이야기로 들어갈까요?</h2>
      <label className="dx-start-label">소재 한 줄</label>
      <textarea
        className="dx-start-input"
        placeholder="예: 소꿉친구 / 폐가 / 마지막 기차"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />
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
      <button className="dx-propose" onClick={propose} disabled={loading}>
        {loading ? '제안 만드는 중…' : '제안 받기'}
      </button>
      {error && <p className="dx-start-error">{error}</p>}
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
  );
}
