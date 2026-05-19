// storyx 로컬 브리지(/api/review-data)에 캐논 분야별 데이터 검토를 요청하는 클라이언트.
// 한 분야(인물/장소/사물/사건/시간선)의 작품 내 정합과 보강 제안을 정합/제안 노트로 받아온다.

// 데이터 검토 노트 한 건 — 정합(consistency check) 또는 제안(strengthening idea).
export type DataReviewNoteKind = '정합' | '제안';

export interface DataReviewNote {
  kind: DataReviewNoteKind;
  title: string;
  body: string;
}

export interface DataReviewInput {
  /** 검토 분야 라벨 — 인물/장소/사물/사건/시간선 */
  category: string;
  /** 직렬화된 분야 엔티티 데이터 */
  target: string;
  medium: string;
  context: string;
}

export interface DataReviewResult {
  ok: boolean;
  summary?: string;
  notes?: DataReviewNote[];
  reason?: string;
}

function normalizeNotes(value: unknown): DataReviewNote[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      kind: item.kind === '제안' ? ('제안' as const) : ('정합' as const),
      title: typeof item.title === 'string' ? item.title : '',
      body: typeof item.body === 'string' ? item.body : ''
    }))
    .filter((note) => note.title.trim().length > 0 || note.body.trim().length > 0);
}

// 캐논 분야 하나에 대한 데이터 검토를 요청한다. 브리지 미연결·실패 시 ok:false로 떨어지고 호출 측이 deterministic 결과로 폴백한다.
export async function requestDataReview(input: DataReviewInput): Promise<DataReviewResult> {
  try {
    const response = await fetch('/api/review-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: input.category,
        target: input.target,
        medium: input.medium,
        context: input.context
      })
    });

    if (!response.ok) {
      return { ok: false, reason: `브리지 응답 오류 (${response.status})` };
    }

    const data = (await response.json()) as Record<string, unknown>;
    if (data.status === 'failed') {
      return { ok: false, reason: typeof data.warning === 'string' ? data.warning : 'provider 호출 실패' };
    }

    const notes = normalizeNotes(data.notes);
    if (notes.length === 0) {
      return { ok: false, reason: '검토 결과가 비어 있습니다.' };
    }

    return {
      ok: true,
      summary: typeof data.summary === 'string' ? data.summary : '',
      notes
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : '브리지에 연결할 수 없습니다.';
    return { ok: false, reason };
  }
}
