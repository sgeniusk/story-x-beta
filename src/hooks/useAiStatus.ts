// 글로벌 aiStatus 모듈을 구독하는 React hook
import { useEffect, useState } from 'react';
import { getAiStatus, subscribeAiStatus, type AiCallStatus } from '../lib/aiStatus';

export function useAiStatus(): AiCallStatus | null {
  const [status, setStatus] = useState<AiCallStatus | null>(getAiStatus());
  useEffect(() => subscribeAiStatus(setStatus), []);
  return status;
}
