// 메모리 뱅크 요약 카드
import { Database } from 'lucide-react';
import type { StoryMemoryBank } from '../lib/memoryBank';

export function MemoryBankCard({ bank }: { bank: StoryMemoryBank }) {
  const privateFiles = bank.files.filter((file) => file.syncPolicy === 'private-never-sync');
  const folders = Array.from(
    new Set(
      bank.syncableFiles
        .map((file) => file.path.replace(`${bank.root}/`, '').split('/')[0])
        .filter((folder) => folder !== 'manifest.json' && folder !== 'story-core.md')
    )
  ).slice(0, 5);

  return (
    <section className="sx-panel sx-memory-bank-card" aria-label="Story X 메모리 뱅크">
      <div className="sx-panel-heading">
        <Database size={16} />
        <h2>메모리 뱅크</h2>
      </div>
      <p className="sx-memory-bank-root">{bank.root}</p>
      <dl className="sx-memory-bank-stats">
        <div>
          <dt>sync</dt>
          <dd>{bank.syncableFiles.length}</dd>
        </div>
        <div>
          <dt>private</dt>
          <dd>{privateFiles.length}</dd>
        </div>
        <div>
          <dt>files</dt>
          <dd>{bank.files.length}</dd>
        </div>
      </dl>
      <div className="sx-memory-bank-folders">
        {folders.map((folder) => (
          <span key={folder}>{folder}</span>
        ))}
      </div>
      <small>원문 자료는 private/raw-sources에 두고, 에이전트는 필요한 구조 기억만 읽습니다.</small>
    </section>
  );
}
