import type { ReactNode } from 'react';
import {
  STORYX_AI_RUNTIME,
  type StoryXAiRuntime
} from '../lib/runtimeCapabilities';

interface HostedRuntimeBoundaryProps {
  children?: ReactNode;
  runtime?: StoryXAiRuntime;
}

export function HostedRuntimeBoundary({
  children,
  runtime = STORYX_AI_RUNTIME
}: HostedRuntimeBoundaryProps) {
  if (runtime !== 'disabled') return <>{children}</>;

  return (
    <div className="sx-hosted-runtime">
      <aside className="sx-hosted-runtime__notice" role="status" aria-live="polite">
        <strong>Sites 비공개 미리보기</strong>
        <span>
          작품은 이 브라우저에만 저장됩니다. AI 생성·응결·검토는 시작하지 않으며 로컬 Story X에서 실행하세요.
        </span>
      </aside>
      {children}
    </div>
  );
}
