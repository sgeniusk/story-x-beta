// 잠긴 작품 헌장(4줄 척추·결말·대가·화수)을 재열람·개정하는 데이터 모드 카드 (베타테스트 #7)
import { useEffect, useState } from 'react';
import type { ContractAmendmentPatch, StoryContract, StorySpine } from '../lib/storyEngine';

const EMPTY_SPINE: StorySpine = { desire: '', advance: '', obstacle: '', resolution: '' };

const SPINE_LINES: Array<{ key: keyof StorySpine; label: string }> = [
  { key: 'desire', label: '1줄 — 욕망' },
  { key: 'advance', label: '2줄 — 전진' },
  { key: 'obstacle', label: '3줄 — 시련' },
  { key: 'resolution', label: '4줄 — 변화(결말의 답)' }
];

export function CharterAmendCard({
  contract,
  onAmend
}: {
  contract: StoryContract;
  onAmend: (patch: ContractAmendmentPatch, reason: string) => void;
}) {
  const [spine, setSpine] = useState<StorySpine>(contract.spine ?? EMPTY_SPINE);
  const [endingStatement, setEndingStatement] = useState(contract.endingStatement);
  const [protagonistCost, setProtagonistCost] = useState(contract.protagonistCost);
  const [plannedEpisodes, setPlannedEpisodes] = useState(contract.plannedEpisodes);
  const [reason, setReason] = useState('');

  // 외부에서 헌장이 바뀌면(되돌리기·다른 개정 반영) 폼을 최신 헌장으로 다시 시드한다.
  useEffect(() => {
    setSpine(contract.spine ?? EMPTY_SPINE);
    setEndingStatement(contract.endingStatement);
    setProtagonistCost(contract.protagonistCost);
    setPlannedEpisodes(contract.plannedEpisodes);
  }, [contract]);

  const dirty =
    JSON.stringify(spine) !== JSON.stringify(contract.spine ?? EMPTY_SPINE) ||
    endingStatement !== contract.endingStatement ||
    protagonistCost !== contract.protagonistCost ||
    plannedEpisodes !== contract.plannedEpisodes;

  function submit() {
    if (!dirty) return;
    // 실제로 바뀐 필드만 patch 에 담아 개정 이력이 무엇을 고쳤는지 정확히 남게 한다.
    const baseSpine = contract.spine ?? EMPTY_SPINE;
    const spinePatch: Partial<StorySpine> = {};
    (Object.keys(spine) as Array<keyof StorySpine>).forEach((key) => {
      if (spine[key] !== baseSpine[key]) spinePatch[key] = spine[key];
    });
    const patch: ContractAmendmentPatch = {};
    if (Object.keys(spinePatch).length > 0) patch.spine = spinePatch;
    if (endingStatement !== contract.endingStatement) patch.endingStatement = endingStatement;
    if (protagonistCost !== contract.protagonistCost) patch.protagonistCost = protagonistCost;
    if (plannedEpisodes !== contract.plannedEpisodes) patch.plannedEpisodes = plannedEpisodes;
    onAmend(patch, reason.trim() || '헌장 개정');
    setReason('');
  }

  return (
    <article className="sx-bible-card is-wide sx-charter-amend">
      <span>작품 헌장 · 4줄 척추</span>
      <h3>
        {contract.lengthClass === 'short' ? '단편' : '장편'} {contract.plannedEpisodes}화
        <em className={`sx-charter-lock${contract.spineLocked ? ' is-locked' : ''}`}>
          {contract.spineLocked ? '잠김' : '미잠금'}
        </em>
      </h3>
      <p className="sx-charter-amend-help">
        잠근 결말과 4줄 척추를 여기서 고칩니다. 개정은 다음 회차 생성·검토의 기준이 되고, 한 줄을 비우면 잠금이 풀려
        본문 생성이 다시 막힙니다. 변경 로그에서 되돌릴 수 있습니다.
      </p>
      {SPINE_LINES.map(({ key, label }) => (
        <label key={key}>
          <small>{label}</small>
          <textarea
            value={spine[key]}
            onChange={(event) => setSpine((current) => ({ ...current, [key]: event.target.value }))}
            rows={2}
          />
        </label>
      ))}
      <label>
        <small>결말 문장 — 질문에 대한 답</small>
        <textarea value={endingStatement} onChange={(event) => setEndingStatement(event.target.value)} rows={2} />
      </label>
      <label>
        <small>주인공의 대가</small>
        <textarea value={protagonistCost} onChange={(event) => setProtagonistCost(event.target.value)} rows={2} />
      </label>
      <label className="sx-charter-amend-episodes">
        <small>확정 회차 수</small>
        <input
          type="number"
          value={plannedEpisodes}
          onChange={(event) => setPlannedEpisodes(Math.max(1, Math.floor(Number(event.target.value) || 0)))}
        />
      </label>
      <label>
        <small>개정 사유 (선택)</small>
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="예: 시즌 연장 · 트위스트 수락 · 결말 정렬"
        />
      </label>
      <button type="button" className="sx-charter-amend-apply" onClick={submit} disabled={!dirty}>
        이 개정 반영
      </button>
      {contract.amendments.length > 0 && (
        <div className="sx-charter-amend-log">
          <small>개정 이력 {contract.amendments.length}건</small>
          <ul>
            {contract.amendments
              .slice(-5)
              .reverse()
              .map((amendment, index) => (
                <li key={`${amendment.at}-${index}`}>
                  <b>{amendment.change}</b>
                  {amendment.reason ? ` · ${amendment.reason}` : ''}
                </li>
              ))}
          </ul>
        </div>
      )}
    </article>
  );
}
