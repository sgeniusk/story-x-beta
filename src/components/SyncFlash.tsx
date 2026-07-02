// 융합 셸 — ⟳최신화 직후 본편 반영량을 잠깐 알리는 토스트. 순수 표현(사라짐 타이머는 App).
import type { PendingSync } from '../lib/syncConsole';

interface SyncFlashProps {
  flash: PendingSync | null;
}

export function SyncFlash({ flash }: SyncFlashProps) {
  if (!flash || flash.total <= 0) return null;
  const parts: string[] = [];
  if (flash.chapters > 0) parts.push(`${flash.chapters}회차`);
  if (flash.canon > 0) parts.push(`${flash.canon}캐논`);
  return (
    <div className="sync-flash" role="status">
      ✓ 본편에 반영 — {parts.join(' · ')}
    </div>
  );
}
