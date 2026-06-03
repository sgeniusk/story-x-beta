// 캐논 항목 상태 배지
import type { CanonEntity } from '../lib/storyEngine';

const canonStatusLabels: Record<CanonEntity['status'], string> = {
  ok: '정합',
  conflict: '충돌',
  unverified: '미확인'
};

export function CanonStatusBadge({ status }: { status: CanonEntity['status'] }) {
  if (status === 'ok') {
    return null;
  }

  return (
    <span className={`ex-canon-badge ex-canon-badge--${status}`}>
      <i aria-hidden="true" />
      {canonStatusLabels[status]}
    </span>
  );
}
