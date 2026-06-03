// 에이전트 의도 카드 컴포넌트
import { ChevronDown, Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { agentPersonas } from '../lib/agentPersonas';
import type { Chapter } from '../lib/storyEngine';

export function AgentIntentCard({
  latestChapter,
  isSerial,
  draftPrompt,
  isOpen,
  onToggleOpen,
  onChangeDraftPrompt,
  draftPromptPlaceholder,
  isLatestLocked,
  generationNote,
  styleChip
}: {
  latestChapter: Chapter | null;
  isSerial: boolean;
  draftPrompt: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  onChangeDraftPrompt: (value: string) => void;
  draftPromptPlaceholder: string;
  isLatestLocked: boolean;
  generationNote: string | null;
  styleChip: ReactNode;
}) {
  const persona = agentPersonas.showrunner;
  // 연재형: 회차 단위 의도. 단독 완결형: 작품/원고 하나의 의도.
  const intentLabel = isSerial
    ? latestChapter
      ? '다음 회차 의도'
      : '이번 회차 의도'
    : latestChapter
      ? '이 원고의 의도'
      : '이번 글의 의도';
  const intentTextareaLabel = isSerial
    ? latestChapter
      ? '다음 회차에 담을 주요 내용'
      : '이번 회차에 담을 주요 내용'
    : '이 글에 담을 주요 내용';

  return (
    <section className="sx-panel ex-intent-card" aria-label={intentLabel}>
      <button
        type="button"
        className="ex-intent-toggle"
        aria-expanded={isOpen}
        onClick={onToggleOpen}
      >
        <span className="ex-intent-by">
          <span className="ex-intent-avatar" aria-hidden="true">
            {persona.title.slice(0, 1)}
          </span>
          <span className="ex-intent-by-text">
            {persona.title}가 잡은 {intentLabel}
          </span>
        </span>
        <ChevronDown
          size={14}
          className="ex-intent-chevron"
          data-open={isOpen ? 'true' : 'false'}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div className="ex-intent-body">
          <p className="ex-intent-frame">
            {persona.title}가 잡은 작업 프레이밍입니다. 작가가 아래에서 직접 고쳐 쓸 수 있어요.
          </p>
          <textarea
            className="ex-intent-textarea"
            name="draft-prompt"
            aria-label={intentTextareaLabel}
            value={draftPrompt}
            onChange={(event) => onChangeDraftPrompt(event.target.value)}
            placeholder={draftPromptPlaceholder}
            rows={4}
          />
          {isLatestLocked && latestChapter && (
            <p className="ex-intent-lock">
              <Lock size={11} aria-hidden="true" />
              <span>
                {isSerial
                  ? `${latestChapter.episode}화는 출간 확정됨. 수정 대신 다음 회차로 진행합니다.`
                  : '이 원고는 출간 확정됨. 잠금을 풀어야 다시 손볼 수 있습니다.'}
              </span>
            </p>
          )}
          {generationNote && (
            <p className="ex-intent-note" role="status">
              {generationNote}
            </p>
          )}
          {styleChip}
        </div>
      )}
    </section>
  );
}
