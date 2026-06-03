// 출간 준비 목차 카드
import { FileText } from 'lucide-react';
import type { PublishingPlan } from '../lib/publishing';

export function PublishingIndexCard({ plan }: { plan: PublishingPlan }) {
  return (
    <section className="sx-panel sx-publishing-index-card" aria-label="출간 준비 목차">
      <div className="sx-panel-heading">
        <FileText size={16} />
        <h2>출간 준비</h2>
      </div>
      <strong>{plan.title}</strong>
      <p>{plan.releaseNotice}</p>
      <div>
        {plan.snapshotItems.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <small>출간 후 수정은 변경 로그 검토를 거쳐 다음 전개와 캐논에 반영합니다.</small>
    </section>
  );
}
