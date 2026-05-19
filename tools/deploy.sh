#!/usr/bin/env bash
# story-x-beta GitHub Pages 배포 — 빌드 후 dist를 gh-pages 브랜치로 푸시한다.
# 사용법: npm run deploy
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ 빌드 (base=/story-x-beta/)"
npx vite build --base=/story-x-beta/

echo "▶ gh-pages 푸시"
REMOTE="$(git remote get-url origin)"
touch dist/.nojekyll
cd dist
rm -rf .git
git init -q
git checkout -q -b gh-pages
git add -A
git -c user.name="story-x deploy" -c user.email="deploy@story-x" commit -qm "Deploy $(date '+%Y-%m-%d %H:%M')"
git push -qf "$REMOTE" gh-pages
rm -rf .git

echo "✓ 배포 완료 — https://sgeniusk.github.io/story-x-beta/ (1~2분 후 반영)"
