// 열린 질문 목록 카드
import { ListChecks } from 'lucide-react';

export function OpenThreadsCard({ threads }: { threads: string[] }) {
  return (
    <section className="sx-panel sx-open-threads-card" aria-label="열린 질문">
      <div className="sx-panel-heading">
        <ListChecks size={16} />
        <h2>열린 질문</h2>
      </div>
      {threads.length > 0 ? (
        <ul className="sx-thread-list">
          {threads.map((thread) => (
            <li key={thread}>{thread}</li>
          ))}
        </ul>
      ) : (
        <p className="sx-thread-empty">
          아직 열린 질문이 없습니다. 작품이 아직 답하지 않은 질문이 생기면, 연속성을 위해 이곳에 모입니다.
        </p>
      )}
    </section>
  );
}
