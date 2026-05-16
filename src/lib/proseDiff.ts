// AI 초안과 사용자가 직접 고친 원고를 단락 단위로 비교해 변경 블록을 만든다.
// "AI가 내 글을 덮어쓰지 않는다" 원칙을 눈으로 확인시키는 직접 편집 diff의 핵심이다.

export type ProseDiffKind = 'same' | 'added' | 'removed';

export interface ProseDiffBlock {
  kind: ProseDiffKind;
  text: string;
}

export interface ProseDiffSummary {
  blocks: ProseDiffBlock[];
  addedBlocks: number;
  removedBlocks: number;
  changed: boolean;
}

function splitBlocks(text: string): string[] {
  return text
    .split(/\n+/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
}

// 원본(AI 초안)과 편집본을 단락 LCS로 비교한다
export function diffProseBlocks(original: string, edited: string): ProseDiffSummary {
  const before = splitBlocks(typeof original === 'string' ? original : '');
  const after = splitBlocks(typeof edited === 'string' ? edited : '');
  const rows = before.length;
  const cols = after.length;

  const lcs: number[][] = Array.from({ length: rows + 1 }, () => new Array<number>(cols + 1).fill(0));
  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = cols - 1; j >= 0; j -= 1) {
      lcs[i][j] =
        before[i] === after[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const blocks: ProseDiffBlock[] = [];
  let i = 0;
  let j = 0;
  while (i < rows && j < cols) {
    if (before[i] === after[j]) {
      blocks.push({ kind: 'same', text: before[i] });
      i += 1;
      j += 1;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      blocks.push({ kind: 'removed', text: before[i] });
      i += 1;
    } else {
      blocks.push({ kind: 'added', text: after[j] });
      j += 1;
    }
  }
  while (i < rows) {
    blocks.push({ kind: 'removed', text: before[i] });
    i += 1;
  }
  while (j < cols) {
    blocks.push({ kind: 'added', text: after[j] });
    j += 1;
  }

  const addedBlocks = blocks.filter((block) => block.kind === 'added').length;
  const removedBlocks = blocks.filter((block) => block.kind === 'removed').length;

  return {
    blocks,
    addedBlocks,
    removedBlocks,
    changed: addedBlocks + removedBlocks > 0
  };
}
