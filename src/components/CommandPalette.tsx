// ⌘K 명령 팔레트 — 검색 가능한 데스크 명령 목록을 모달로 띄우고 실행한다
import type { FormEvent } from 'react';
import { X } from 'lucide-react';

export interface DeskCommand {
  id: string;
  label: string;
  section: string;
  description: string;
  shortcut?: string;
  disabled?: boolean;
  run: () => void;
}

export function CommandPalette({
  query,
  commands,
  onQueryChange,
  onClose,
  onRunCommand
}: {
  query: string;
  commands: DeskCommand[];
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onRunCommand: (command: DeskCommand) => void;
}) {
  const firstRunnableCommand = commands.find((command) => !command.disabled);

  function submitFirstCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (firstRunnableCommand) {
      onRunCommand(firstRunnableCommand);
    }
  }

  return (
    <div className="sx-command-palette-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="sx-command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="명령 팔레트"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span className="sx-eyebrow">Command Center</span>
            <h2>무엇을 할까요?</h2>
          </div>
          <button type="button" aria-label="명령 팔레트 닫기" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <form onSubmit={submitFirstCommand}>
          <label>
            <span>명령 또는 화면 검색</span>
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="예: 승인 대기, 출간, 집중 모드"
              autoFocus
            />
          </label>
        </form>
        <div className="sx-command-list" role="listbox" aria-label="실행 가능한 명령">
          {commands.length === 0 ? (
            <p>검색 결과가 없습니다.</p>
          ) : (
            commands.map((command) => (
              <button
                key={command.id}
                type="button"
                disabled={command.disabled}
                onClick={() => onRunCommand(command)}
                role="option"
              >
                <span>{command.section}</span>
                <strong>{command.label}</strong>
                <small>{command.description}</small>
                {command.shortcut && <em>{command.shortcut}</em>}
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
