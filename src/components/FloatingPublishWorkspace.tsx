// 출간 모드 "떠 있는 작업실" — FloatingEditor 셸 언어를 출간 준비에 적용
import { useCallback, useState } from 'react';
import { Check, ClipboardCheck, Database, FileText, Lock, Save } from 'lucide-react';
import type { CreativeBlueprint } from '../lib/projectBlueprint';
import { getCreativeActionLabels, isSerialFormat } from '../lib/projectBlueprint';
import type { Chapter, SeriesProject } from '../lib/storyEngine';
import type { PublishingPlan } from '../lib/publishing';

export interface FloatingPublishWorkspaceProps {
  project: SeriesProject;
  blueprint: CreativeBlueprint;
  plan: PublishingPlan;
  onBackToEditor: () => void;
  onOpenBible: () => void;
  onReviewDraft: () => void;
  onConfirmChapterLock: (chapterId: string) => void;
}

type PublishPanelId = 'proof' | 'checklist' | 'package' | 'lock';

export function FloatingPublishWorkspace({
  project,
  blueprint,
  plan,
  onBackToEditor,
  onOpenBible,
  onReviewDraft,
  onConfirmChapterLock
}: FloatingPublishWorkspaceProps) {
  const [openPanel, setOpenPanel] = useState<PublishPanelId | null>(null);
  const [isFocus, setIsFocus] = useState(false);
  const latestChapter = project.chapters[project.chapters.length - 1] ?? null;
  const isLatestLocked = latestChapter?.locked === true;
  const publishIsSerial = isSerialFormat(blueprint.format);
  const publishUnitLabel = (chapter: Chapter) => (publishIsSerial ? `${chapter.episode}화` : '원고');
  const labels = getCreativeActionLabels(blueprint.medium);
  const unitLabel = latestChapter ? publishUnitLabel(latestChapter) : '초안';
  const scrimShown = openPanel !== null;

  const togglePanel = useCallback((id: PublishPanelId) => {
    setOpenPanel((cur) => (cur === id ? null : id));
  }, []);
  const closeAll = useCallback(() => setOpenPanel(null), []);

  const renderLockButton = () => latestChapter ? (
    <button
      type="button"
      className="fc-publish-lock-btn"
      disabled={isLatestLocked}
      aria-label={isLatestLocked ? `${unitLabel}는 이미 ${labels.lock}됨` : `${unitLabel} ${labels.lock}`}
      onClick={() => onConfirmChapterLock(latestChapter.id)}
    >
      <Lock size={15} />
      {isLatestLocked ? labels.lockedChip : `${unitLabel} ${labels.lock}`}
    </button>
  ) : (
    <button type="button" className="fc-publish-lock-btn" disabled>
      <Lock size={15} />
      초안 생성 필요
    </button>
  );

  return (
    <div className={`fc-app fc-publish${isFocus ? ' focus' : ''}`} id="fc-publish-app">
      <header className="topbar">
        <div className="brand">X</div>
        <div className="doc-id">
          <span className="title">{project.title}</span>
          <span className="sep">›</span>
          <span className="ep"><b>출간 · {latestChapter ? `${unitLabel} 기준` : '초안 없음'}</b></span>
        </div>
        <div className="saved"><span className="dot" /><span className="word">준비 중</span></div>
        <div className="vr" />
        <div className="modes" role="tablist">
          <button role="tab" aria-selected="false" onClick={onBackToEditor}>편집</button>
          <button role="tab" aria-selected="false" onClick={onOpenBible}>데이터</button>
          <button role="tab" aria-selected="true">출간</button>
        </div>
        <div className="vr" />
        <button className="btn-publish" onClick={onReviewDraft} title="출간 전 검토">
          <ClipboardCheck />
          <span>검토</span>
        </button>
      </header>
      <button className="exitfocus" onClick={() => setIsFocus(false)}>집중 모드 끝내기 · Esc</button>

      <div className="canvas" id="fc-publish-canvas">
        <div className="deck">
          <section className="fc-publish-board" aria-label="출간 준비">
            <header className="fc-publish-hero">
              <div className="fc-publish-hero-main">
                <p className="fc-publish-eyebrow">Publishing Studio</p>
                <h1>출간 준비</h1>
                <p>
                  완성 버튼을 누르는 화면이 아니라, 출간본을 잠그고 이후 수정이 작품 전체에 어떤 영향을 주는지
                  검토하는 단계입니다.
                  {blueprint.medium === 'comics' && ' 만화는 스토리보드 패키지까지 준비하고 완성 이미지 생성은 후속 단계로 둡니다.'}
                </p>
              </div>
              <aside className="fc-publish-status">
                <span>게시 위치</span>
                <strong>{blueprint.mediumLabel} · {blueprint.formatLabel}</strong>
                <small>{latestChapter ? `${unitLabel} 기준` : '초안 생성 후 출간 스냅샷 생성'}</small>
                {renderLockButton()}
                <button type="button" className="fc-publish-back-btn" onClick={onBackToEditor}>
                  편집으로 돌아가기
                </button>
              </aside>
            </header>

            <div className="fc-publish-grid">
              <article className="fc-publish-card fc-publish-proof">
                <span>Platform Proof</span>
                <h2>첫 300자</h2>
                <p>{plan.platformProof}</p>
                <blockquote>{plan.excerpt}</blockquote>
              </article>

              <article className="fc-publish-card fc-publish-checklist">
                <span>Release Gates</span>
                <h2>출간 전 체크리스트</h2>
                <div className="fc-publish-checklist-list">
                  {plan.checklist.map((item) => (
                    <div key={item.id} className={`fc-publish-gate is-${item.status}`}>
                      <Check size={15} />
                      <strong>{item.label}</strong>
                      <em>{item.status === 'ready' ? 'ready' : 'review'}</em>
                      <small>{item.detail}</small>
                    </div>
                  ))}
                </div>
              </article>

              <article className="fc-publish-card">
                <span>Release Snapshot</span>
                <h2>출간 스냅샷</h2>
                <ul>
                  {plan.snapshotItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="fc-publish-card">
                <span>Change Log</span>
                <h2>변경 로그 검토</h2>
                <ul>
                  {plan.changeLogReview.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <button type="button" className="fc-publish-bible-btn" onClick={onOpenBible}>
                  <Database size={15} />
                  바이블 열기
                </button>
              </article>

              <article className="fc-publish-card fc-publish-package is-wide">
                <span>Output Package</span>
                <h2>산출물 패키지</h2>
                <div>
                  {plan.packageItems.map((item) => (
                    <em key={item}>{item}</em>
                  ))}
                </div>
                <p>{plan.releaseNotice}</p>
                <button type="button" className="fc-publish-review-btn" onClick={onReviewDraft}>
                  <ClipboardCheck size={16} />
                  출간 전 검토 실행
                </button>
              </article>

              <article className={`fc-publish-card fc-publish-release-lock is-${plan.releaseLock.canLock ? 'ready' : 'blocked'} is-wide`}>
                <span>Release Lock</span>
                <h2>출간 스냅샷 잠그기</h2>
                <p>{plan.releaseLock.notice}</p>
                {plan.releaseLock.blockerIds.length > 0 && (
                  <div>
                    {plan.releaseLock.blockerIds.map((id) => (
                      <em key={id}>{id}</em>
                    ))}
                  </div>
                )}
                <button type="button" disabled={!plan.releaseLock.canLock}>
                  <Save size={16} />
                  {plan.releaseLock.label}
                </button>
              </article>
            </div>
          </section>
        </div>
      </div>

      <div className="docks" aria-label="출간 도구">
        <nav className="dock left" aria-label="출간 도구">
          <button className={`tool${openPanel === 'proof' ? ' on' : ''}`} onClick={() => togglePanel('proof')} title="첫 300자">
            <FileText />
            <span className="t">증거</span>
          </button>
          <button className={`tool${openPanel === 'checklist' ? ' on' : ''}`} onClick={() => togglePanel('checklist')} title="체크리스트">
            <Check />
            <span className="t">게이트</span>
          </button>
          <button className={`tool${openPanel === 'package' ? ' on' : ''}`} onClick={() => togglePanel('package')} title="산출물">
            <ClipboardCheck />
            <span className="t">패키지</span>
          </button>
          <button className={`tool${openPanel === 'lock' ? ' on' : ''}`} onClick={() => togglePanel('lock')} title="잠금">
            <Lock />
            <span className="t">잠금</span>
          </button>
          <div className="sep" />
          <button className="tool" onClick={onBackToEditor} title="편집으로 돌아가기">
            <FileText />
            <span className="t">편집</span>
          </button>
          <button className="tool" onClick={onOpenBible} title="바이블 열기">
            <Database />
            <span className="t">바이블</span>
          </button>
          <button className="tool" onClick={() => setIsFocus((f) => !f)} title="집중 모드">
            <Save />
            <span className="t">집중</span>
          </button>
        </nav>
      </div>

      <div className={`panel${openPanel === 'proof' ? ' show' : ''}`} id="fc-pp-proof">
        <div className="ph"><h4>Platform Proof</h4><button className="x" onClick={closeAll}>✕</button></div>
        <div className="pb fc-publish-panel-copy">
          <strong>첫 300자</strong>
          <p>{plan.platformProof}</p>
          <blockquote>{plan.excerpt}</blockquote>
        </div>
      </div>

      <div className={`panel${openPanel === 'checklist' ? ' show' : ''}`} id="fc-pp-checklist">
        <div className="ph"><h4>Release Gates</h4><button className="x" onClick={closeAll}>✕</button></div>
        <div className="pb fc-publish-panel-list">
          {plan.checklist.map((item) => (
            <div key={item.id} className={`fc-publish-panel-row is-${item.status}`}>
              <strong>{item.label}</strong>
              <span>{item.status}</span>
              <small>{item.detail}</small>
            </div>
          ))}
        </div>
      </div>

      <div className={`panel${openPanel === 'package' ? ' show' : ''}`} id="fc-pp-package">
        <div className="ph"><h4>Output Package</h4><button className="x" onClick={closeAll}>✕</button></div>
        <div className="pb fc-publish-package-mini">
          {plan.packageItems.map((item) => (
            <em key={item}>{item}</em>
          ))}
        </div>
      </div>

      <div className={`panel${openPanel === 'lock' ? ' show' : ''}`} id="fc-pp-lock">
        <div className="ph"><h4>Release Lock</h4><button className="x" onClick={closeAll}>✕</button></div>
        <div className="pb fc-publish-panel-copy">
          <p>{plan.releaseLock.notice}</p>
          {renderLockButton()}
        </div>
      </div>

      <div className={`scrim${scrimShown ? ' show' : ''}`} onClick={closeAll} />
    </div>
  );
}
