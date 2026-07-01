// 응결 정밀 검토(LLM) 결과 — 정본 모순 경고 카드. 순수 표현.
import type { ConsolidationFinding } from '../lib/diveClient';

interface ConsolidationFindingsProps {
  findings: ConsolidationFinding[] | null;
}

export function ConsolidationFindings({ findings }: ConsolidationFindingsProps) {
  if (findings === null) return null;
  if (findings.length === 0) return <div className="dx-findings dx-findings-clear">✓ 정본 모순 없음</div>;
  return (
    <div className="dx-findings">
      {findings.map((f, i) => (
        <div key={i} className={`dx-finding dx-finding-${f.severity}`}>
          <span className="dx-finding-sev">{f.severity === 'high' ? '🔴' : '🟡'}</span>
          <span className="dx-finding-claim">{f.claim}</span>
          {f.conflictsWith && <span className="dx-finding-vs">↔ {f.conflictsWith}</span>}
          {f.evidence && <span className="dx-finding-ev">{f.evidence}</span>}
        </div>
      ))}
    </div>
  );
}
