import {
  ArrowLeft,
  BookOpen,
  Check,
  ClipboardCheck,
  Columns3,
  Database,
  Edit3,
  FileText,
  GitBranch,
  Grid3X3,
  History,
  Layers3,
  Library,
  ListChecks,
  LockKeyhole,
  PenLine,
  ShieldAlert,
  Sparkles,
  Table2,
  X
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  buildStoryEditorWorkspace,
  createSeedProject,
  produceNextChapter,
  type CodexEntryKind,
  type EditorViewModeId,
  type StoryEditorWorkspace
} from './lib/storyEngine';

interface StoryXTestPageProps {
  onBack: () => void;
}

type CodexFilter = CodexEntryKind | 'all';

const modeIcons: Record<EditorViewModeId, ReactNode> = {
  binder: <Library size={16} />,
  corkboard: <Grid3X3 size={16} />,
  outliner: <Table2 size={16} />,
  scrivenings: <Columns3 size={16} />
};

const codexFilters: Array<{ id: CodexFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'character', label: 'Character' },
  { id: 'world-rule', label: 'World' },
  { id: 'plot-thread', label: 'Thread' },
  { id: 'canon', label: 'Canon' }
];

export function StoryXTestPage({ onBack }: StoryXTestPageProps) {
  const [activeMode, setActiveMode] = useState<EditorViewModeId>('corkboard');
  const [codexFilter, setCodexFilter] = useState<CodexFilter>('all');
  const [profileOpen, setProfileOpen] = useState(false);

  const workspace = useMemo(() => {
    const seed = createSeedProject();
    const result = produceNextChapter(seed, {
      genre: 'romance-fantasy',
      intent: '주인공이 금지된 탑에서 첫 단서를 발견한다',
      pressure: '낮은 감정선에서 시작해 마지막에 큰 반전을 둔다'
    });

    return buildStoryEditorWorkspace(result.updatedProject, {
      draftClaims: ['달의 탑은 아무나 들어갈 수 있는 관광지다.']
    });
  }, []);

  const readiness = workspace.continuitySummary.status === 'blocked' ? 68 : 92;

  return (
    <div className="storyx-page p-story">
      <header className="storyx-topbar">
        <button type="button" className="storyx-icon-text" onClick={onBack}>
          <ArrowLeft size={17} />
          앱으로
        </button>

        <div className="storyx-brand" aria-label="Story X">
          <span className="storyx-brand-mark">
            <Sparkles size={17} />
          </span>
          <strong>Story X</strong>
        </div>

        <div className="storyx-profile">
          <span className="storyx-mono">desk 01</span>
          <button type="button" className="storyx-avatar-button" onClick={() => setProfileOpen(true)}>
            <PixelAvatar />
          </button>
        </div>
      </header>

      <main className="storyx-desk-shell">
        <aside className="storyx-desk-rail">
          <ProjectCard workspace={workspace} readiness={readiness} />
          <BinderPanel workspace={workspace} />
        </aside>

        <section className="storyx-desk-main">
          <header className="storyx-desk-head">
            <div>
              <p className="storyx-eyebrow">production desk</p>
              <h1>{workspace.compilePreview.title.replace(' compile preview', '')}</h1>
            </div>
            <div className={`storyx-continuity-chip is-${workspace.continuitySummary.status}`}>
              {workspace.continuitySummary.status === 'blocked' ? <ShieldAlert size={16} /> : <Check size={16} />}
              <span>{workspace.continuitySummary.status}</span>
              <strong>{workspace.continuitySummary.blocked}</strong>
            </div>
          </header>

          <ViewModeTabs workspace={workspace} activeMode={activeMode} onSelectMode={setActiveMode} />
          <DeskMode workspace={workspace} activeMode={activeMode} />
          <SnapshotStrip workspace={workspace} />
        </section>

        <aside className="storyx-desk-side">
          <CodexPanel workspace={workspace} filter={codexFilter} onFilterChange={setCodexFilter} />
          <ContinuityReview workspace={workspace} />
        </aside>
      </main>

      {profileOpen && <ProfileModal weightedProgress={readiness} onClose={() => setProfileOpen(false)} />}
    </div>
  );
}

function ProjectCard({ workspace, readiness }: { workspace: StoryEditorWorkspace; readiness: number }) {
  return (
    <section className="storyx-journey-card storyx-project-card">
      <div className="storyx-journey-glow p-glow" />
      <p className="storyx-kicker">Project state</p>
      <h2 className="p-text">{workspace.continuitySummary.status === 'blocked' ? '검토 필요' : '제작 가능'}</h2>
      <div className="storyx-card-line" />
      <div className="storyx-journey-progress">
        <strong className="p-text">{readiness}%</strong>
        <span>draft ready</span>
      </div>
      <div className="storyx-progress-track" aria-hidden="true">
        <span style={{ width: `${readiness}%` }} />
      </div>
      <dl className="storyx-desk-metrics">
        <div>
          <dt>sections</dt>
          <dd>{workspace.compilePreview.sectionCount}</dd>
        </div>
        <div>
          <dt>codex</dt>
          <dd>{workspace.codexEntries.length}</dd>
        </div>
        <div>
          <dt>snaps</dt>
          <dd>{workspace.snapshots.length}</dd>
        </div>
      </dl>
    </section>
  );
}

function BinderPanel({ workspace }: { workspace: StoryEditorWorkspace }) {
  return (
    <section className="storyx-desk-card">
      <header>
        <BookOpen size={17} />
        <h2>Binder</h2>
      </header>
      <div className="storyx-binder-list">
        {workspace.binderItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`storyx-binder-row depth-${item.depth} kind-${item.kind}`}
          >
            <span>{getBinderIcon(item.kind)}</span>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function ViewModeTabs({
  workspace,
  activeMode,
  onSelectMode
}: {
  workspace: StoryEditorWorkspace;
  activeMode: EditorViewModeId;
  onSelectMode: (mode: EditorViewModeId) => void;
}) {
  return (
    <section className="storyx-view-tabs" aria-label="editor views">
      {workspace.viewModes.map((mode) => (
        <button
          key={mode.id}
          type="button"
          className={activeMode === mode.id ? 'is-active' : ''}
          onClick={() => onSelectMode(mode.id)}
          title={mode.description}
        >
          {modeIcons[mode.id]}
          <span>{mode.label}</span>
        </button>
      ))}
    </section>
  );
}

function DeskMode({ workspace, activeMode }: { workspace: StoryEditorWorkspace; activeMode: EditorViewModeId }) {
  if (activeMode === 'binder') {
    return <BinderBoard workspace={workspace} />;
  }

  if (activeMode === 'outliner') {
    return <OutlinerTable workspace={workspace} />;
  }

  if (activeMode === 'scrivenings') {
    return <ScriveningsPreview workspace={workspace} />;
  }

  return <CorkboardGrid workspace={workspace} />;
}

function BinderBoard({ workspace }: { workspace: StoryEditorWorkspace }) {
  return (
    <section className="storyx-mode-panel">
      <div className="storyx-folder-grid">
        {workspace.binderItems.map((item) => (
          <article key={item.id} className={`storyx-folder-card kind-${item.kind}`}>
            <span>{getBinderIcon(item.kind)}</span>
            <h2>{item.title}</h2>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CorkboardGrid({ workspace }: { workspace: StoryEditorWorkspace }) {
  return (
    <section className="storyx-mode-panel">
      <div className="storyx-corkboard-grid">
        {workspace.corkboardCards.map((card) => (
          <article key={card.chapterId} className="storyx-index-card">
            <div className="storyx-card-pin" />
            <header>
              <span>{card.status}</span>
              <strong>{card.pov}</strong>
            </header>
            <h2>{card.title}</h2>
            <p>{card.synopsis}</p>
            <div className="storyx-card-tags">
              {card.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <footer>
              <span>{card.linkedCodexIds.length} codex</span>
              <span>{card.canonCandidateIds.length} canon</span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

function OutlinerTable({ workspace }: { workspace: StoryEditorWorkspace }) {
  return (
    <section className="storyx-mode-panel">
      <div className="storyx-outliner-table">
        <div className="storyx-outliner-head">
          <span>EP</span>
          <span>Title</span>
          <span>POV</span>
          <span>Words</span>
          <span>Codex</span>
          <span>Canon</span>
          <span>State</span>
        </div>
        {workspace.outlinerRows.map((row) => (
          <div key={row.chapterId} className={`storyx-outliner-row is-${row.continuityState}`}>
            <span>{String(row.episode).padStart(2, '0')}</span>
            <strong>{row.title}</strong>
            <span>{row.pov}</span>
            <span>{row.wordCount}</span>
            <span>{row.linkedCodexCount}</span>
            <span>{row.canonCandidateCount}</span>
            <em>{row.continuityState}</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScriveningsPreview({ workspace }: { workspace: StoryEditorWorkspace }) {
  return (
    <section className="storyx-mode-panel storyx-scrivenings-panel">
      <header>
        <p className="storyx-kicker">{workspace.compilePreview.sectionCount} sections</p>
        <h2>{workspace.compilePreview.title}</h2>
        <span>{workspace.compilePreview.wordCount} words</span>
      </header>
      <pre>{workspace.compilePreview.text}</pre>
    </section>
  );
}

function SnapshotStrip({ workspace }: { workspace: StoryEditorWorkspace }) {
  return (
    <section className="storyx-snapshot-strip">
      <header>
        <History size={17} />
        <h2>Snapshots</h2>
      </header>
      <div>
        {workspace.snapshots.map((snapshot) => (
          <article key={snapshot.id}>
            <span>{snapshot.reason}</span>
            <strong>{snapshot.title}</strong>
            <p>{snapshot.text.slice(0, 110)}...</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CodexPanel({
  workspace,
  filter,
  onFilterChange
}: {
  workspace: StoryEditorWorkspace;
  filter: CodexFilter;
  onFilterChange: (filter: CodexFilter) => void;
}) {
  const entries = filter === 'all' ? workspace.codexEntries : workspace.codexEntries.filter((entry) => entry.kind === filter);

  return (
    <section className="storyx-desk-card storyx-codex-panel">
      <header>
        <Database size={17} />
        <h2>Codex</h2>
      </header>
      <div className="storyx-filter-row">
        {codexFilters.map((item) => (
          <button
            key={item.id}
            type="button"
            className={filter === item.id ? 'is-active' : ''}
            onClick={() => onFilterChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="storyx-codex-list">
        {entries.map((entry) => (
          <article key={entry.id}>
            <span>{entry.kind}</span>
            <h3>{entry.title}</h3>
            <p>{entry.summary}</p>
            <dl>
              {entry.fields.slice(0, 3).map((field) => (
                <div key={field.label}>
                  <dt>{field.label}</dt>
                  <dd>{field.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function ContinuityReview({ workspace }: { workspace: StoryEditorWorkspace }) {
  return (
    <section className="storyx-desk-card storyx-review-panel">
      <header>
        <GitBranch size={17} />
        <h2>Continuity</h2>
      </header>
      <div className="storyx-review-summary">
        <div>
          <span>blocked</span>
          <strong>{workspace.continuitySummary.blocked}</strong>
        </div>
        <div>
          <span>warnings</span>
          <strong>{workspace.continuitySummary.warnings}</strong>
        </div>
      </div>
      <div className="storyx-issue-list">
        {workspace.continuityIssues.map((issue) => (
          <article key={`${issue.source}-${issue.claim}`} className={`is-${issue.severity}`}>
            <span>{issue.source}</span>
            <strong>{issue.claim}</strong>
            <p>{issue.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function getBinderIcon(kind: string) {
  if (kind === 'project') {
    return <Layers3 size={15} />;
  }

  if (kind === 'chapter') {
    return <PenLine size={15} />;
  }

  if (kind === 'codex-entry') {
    return <LockKeyhole size={15} />;
  }

  return <FileText size={15} />;
}

function PixelAvatar() {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label="프로필">
      <rect x="8" y="12" width="16" height="12" rx="3" />
      <rect x="5" y="10" width="7" height="8" rx="2" />
      <rect x="20" y="10" width="7" height="8" rx="2" />
      <rect x="11" y="16" width="3" height="3" />
      <rect x="18" y="16" width="3" height="3" />
      <rect x="13" y="21" width="6" height="2" />
      <rect x="10" y="24" width="12" height="3" className="storyx-avatar-collar" />
    </svg>
  );
}

function ProfileModal({ weightedProgress, onClose }: { weightedProgress: number; onClose: () => void }) {
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="storyx-modal-layer" onMouseDown={onClose}>
      <section className="storyx-profile-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="storyx-modal-close" aria-label="프로필 닫기" onClick={onClose}>
          <X size={18} />
        </button>
        <div className="storyx-profile-head">
          <div className="storyx-avatar-large">
            <PixelAvatar />
          </div>
          <div>
            <p className="storyx-kicker">Story X profile</p>
            <h2>writer@storyx</h2>
          </div>
        </div>
        <strong className="storyx-profile-percent p-text">{weightedProgress}%</strong>
        <div className="storyx-progress-track">
          <span style={{ width: `${weightedProgress}%` }} />
        </div>
        <div className="storyx-profile-badges">
          <span>Binder</span>
          <span>Codex</span>
          <span>Continuity</span>
        </div>
        <label className="storyx-handle-field">
          <span>
            <Edit3 size={14} />
            핸들
          </span>
          <input defaultValue="@storyx-builder" />
        </label>
        <button type="button" className="storyx-reset-button">
          <ClipboardCheck size={16} />
          검토 로그
        </button>
      </section>
    </div>,
    document.body
  );
}
