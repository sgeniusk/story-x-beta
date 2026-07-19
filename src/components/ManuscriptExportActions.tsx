import { useEffect, useRef, useState } from 'react';
import type { Chapter } from '../lib/storyEngine';
import {
  buildChapterTextFilename,
  prepareChapterTextExport
} from '../lib/manuscriptExport';
import { downloadTextFile, writeTextToClipboard } from '../lib/textFileExport';

export interface ManuscriptExportActionsProps {
  projectTitle: string;
  chapter: Pick<Chapter, 'id' | 'episode' | 'title'>;
  /** 저장 debounce 전 화면에 보이는 최신 본문. */
  body: string;
}

interface ExportStatus {
  kind: 'success' | 'error';
  message: string;
}

export function ManuscriptExportActions({
  projectTitle,
  chapter,
  body
}: ManuscriptExportActionsProps) {
  const [status, setStatus] = useState<ExportStatus | null>(null);
  const requestVersionRef = useRef(0);
  const prepared = prepareChapterTextExport(body);
  const isEmpty = prepared.status === 'empty';

  useEffect(() => {
    requestVersionRef.current += 1;
    setStatus(null);

    return () => {
      requestVersionRef.current += 1;
    };
  }, [chapter.id, body]);

  async function copyBody(): Promise<void> {
    const current = prepareChapterTextExport(body);
    if (current.status !== 'ready') return;
    const requestVersion = ++requestVersionRef.current;

    try {
      await writeTextToClipboard(current.text);
      if (requestVersion !== requestVersionRef.current) return;
      setStatus({ kind: 'success', message: '본문을 복사했습니다' });
    } catch {
      if (requestVersion !== requestVersionRef.current) return;
      setStatus({ kind: 'error', message: '복사하지 못했습니다. TXT로 내려받아 주세요.' });
    }
  }

  function downloadBody(): void {
    const current = prepareChapterTextExport(body);
    if (current.status !== 'ready') return;
    requestVersionRef.current += 1;

    try {
      downloadTextFile(current.text, buildChapterTextFilename(projectTitle, chapter));
      setStatus({ kind: 'success', message: 'TXT 다운로드를 시작했습니다' });
    } catch {
      setStatus({ kind: 'error', message: 'TXT를 내려받지 못했습니다. 잠시 뒤 다시 시도해 주세요.' });
    }
  }

  const emptyReason = isEmpty ? '내보낼 본문 없음' : undefined;

  return (
    <div className="mx-export-actions" role="group" aria-label="현재 회차 반출">
      <button
        type="button"
        className="mx-export-button"
        data-action="copy-manuscript"
        disabled={isEmpty}
        title={emptyReason ?? '현재 회차 본문만 클립보드에 복사'}
        onClick={() => { void copyBody(); }}
      >
        본문 복사
      </button>
      <button
        type="button"
        className="mx-export-button"
        data-action="download-manuscript"
        disabled={isEmpty}
        title={emptyReason ?? '현재 회차 본문을 TXT로 내려받기'}
        onClick={downloadBody}
      >
        TXT
      </button>
      {isEmpty ? (
        <span className="mx-export-status is-empty">내보낼 본문 없음</span>
      ) : status ? (
        <span
          className={`mx-export-status is-${status.kind}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {status.message}
        </span>
      ) : null}
    </div>
  );
}
