import { useEffect, useState, type ReactNode } from 'react';

export const STORY_X_WRITER_LOCK = 'story-x/local-single-writer';

interface StoryXLockManager {
  request(
    name: string,
    options: { mode: 'exclusive'; signal: AbortSignal },
    callback: () => Promise<void>
  ): Promise<void>;
}

function getLockManager(): StoryXLockManager | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as Navigator & { locks?: StoryXLockManager }).locks ?? null;
}

export function SingleWriterGate({ children }: { children?: ReactNode }) {
  const [status, setStatus] = useState<'waiting' | 'writer' | 'unsupported' | 'failed'>(() => (
    getLockManager() ? 'waiting' : 'unsupported'
  ));

  useEffect(() => {
    const locks = getLockManager();
    if (!locks) {
      setStatus('unsupported');
      return undefined;
    }

    let cancelled = false;
    let release: (() => void) | null = null;
    const controller = new AbortController();
    setStatus('waiting');

    void locks.request(
      STORY_X_WRITER_LOCK,
      { mode: 'exclusive', signal: controller.signal },
      async () => {
        if (cancelled) return;
        setStatus('writer');
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      }
    ).catch((error: unknown) => {
      if (cancelled || (error instanceof DOMException && error.name === 'AbortError')) return;
      setStatus('failed');
    });

    return () => {
      cancelled = true;
      controller.abort();
      release?.();
    };
  }, []);

  if (status === 'writer') return <>{children}</>;

  if (status === 'unsupported') {
    return (
      <main className="dx-empty" role="alert">
        <h2>안전한 로컬 편집 잠금을 지원하지 않습니다</h2>
        <p>작품 유실을 막기 위해 편집기를 열지 않았습니다. Web Locks를 지원하는 최신 브라우저에서 Story X를 열어 주세요.</p>
      </main>
    );
  }

  if (status === 'failed') {
    return (
      <main className="dx-empty" role="alert">
        <h2>로컬 편집 잠금을 열지 못했습니다</h2>
        <p>작품을 안전하게 지키기 위해 편집기를 열지 않았습니다. 이 탭을 새로고침해 다시 시도해 주세요.</p>
      </main>
    );
  }

  return (
    <main className="dx-empty" role="status" aria-live="polite">
      <h2>다른 탭의 Story X를 기다리는 중</h2>
      <p>같은 로컬 작품을 두 탭에서 동시에 저장하지 않도록 대기합니다. 편집 중인 탭을 닫으면 이 탭이 자동으로 이어받습니다.</p>
    </main>
  );
}
