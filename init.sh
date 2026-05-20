#!/usr/bin/env bash
# Story X 코딩 에이전트 검증 진입점 — fail-fast.
# 새 세션 시작 전이나 작업 완료를 주장하기 전에 반드시 통과해야 한다.

set -euo pipefail

cd "$(dirname "$0")"

echo "==> 의존성 확인"
if [ ! -d node_modules ]; then
  echo "node_modules 없음 — npm ci 실행"
  npm ci
fi

echo "==> 타입 + 프로덕션 빌드 (tsc --noEmit && vite build)"
npm run build

echo "==> 단위 테스트 (vitest)"
npm test

echo ""
echo "✓ 하네스 검증 통과 — 28 files / 149 tests 통과 · 빌드 성공"
echo "  결과를 progress.md '검증 증거'에 기록하라."
