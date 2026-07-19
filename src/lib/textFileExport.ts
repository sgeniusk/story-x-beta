/**
 * 사용자 입력을 한 개의 안전한 파일명 조각으로 바꾼다.
 * PLAY 복구본과 정식 회차 TXT가 같은 규칙을 공유하되 포맷 자체는 분리한다.
 */
export function safeTextFilenamePart(value: string, fallback = 'untitled'): string {
  const normalized = value
    .normalize('NFKC')
    .replace(/[\\/:?*"<>|\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return normalized || fallback;
}

function copyTextWithSelectionFallback(text: string): boolean {
  if (typeof document.execCommand !== 'function') return false;

  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const selection = document.getSelection();
  const previousRanges: Range[] = [];
  if (selection) {
    for (let index = 0; index < selection.rangeCount; index += 1) {
      previousRanges.push(selection.getRangeAt(index).cloneRange());
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.readOnly = true;
  textarea.tabIndex = -1;
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.inset = '0 auto auto 0';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';

  try {
    document.body.appendChild(textarea);
    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
    if (selection) {
      selection.removeAllRanges();
      previousRanges.forEach((range) => selection.addRange(range));
    }
    activeElement?.focus({ preventScroll: true });
  }
}

/**
 * 표준 Clipboard API를 우선 사용하고, 임베디드 브라우저 호환을 위해 같은 사용자 클릭 안에서
 * selection 기반 복사도 시도한다. 둘 중 하나도 성공하지 못했을 때만 실패한다.
 */
export async function writeTextToClipboard(text: string): Promise<void> {
  let navigatorSucceeded = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      navigatorSucceeded = true;
    }
  } catch {
    navigatorSucceeded = false;
  }

  const selectionSucceeded = copyTextWithSelectionFallback(text);
  if (!navigatorSucceeded && !selectionSucceeded) {
    throw new Error('clipboard unavailable');
  }
}

/** 브라우저에서 UTF-8 평문 파일 하나를 내려받고 임시 DOM·URL을 즉시 정리한다. */
export function downloadTextFile(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  let anchor: HTMLAnchorElement | null = null;

  try {
    anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor?.remove();
    URL.revokeObjectURL(url);
  }
}
