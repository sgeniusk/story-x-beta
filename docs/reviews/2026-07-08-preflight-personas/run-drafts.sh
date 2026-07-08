#!/usr/bin/env bash
# 예비비행 6-조건 초안 배치 — 로컬 codex 순차 생성. 한 조건 실패해도 다음으로 계속.
set -u
cd "$(git rev-parse --show-toplevel)"
OUT="docs/reviews/2026-07-08-preflight-personas/drafts"
LOG="docs/reviews/2026-07-08-preflight-personas/run.log"
mkdir -p "$OUT"
: > "$LOG"

run() {
  local n="$1" medium="$2" format="$3" title="$4" free="$5"
  echo "[$(printf '%s' "$n")] start medium=$medium format=$format title=$title" | tee -a "$LOG"
  node tools/storyx.mjs draft --provider codex --medium "$medium" --format "$format" \
    --title "$title" --freewrite "$free" > "$OUT/$n.json" 2>>"$LOG"
  local code=$?
  local status
  status=$(node -e "try{const d=require('./$OUT/$n.json');console.log(d.status||'?','| prose='+((d.prose||'').length)+'자','| beats='+((d.beats||[]).length),'| canon='+((d.newCanonFacts||[]).length))}catch(e){console.log('PARSE_FAIL '+e.message)}")
  echo "[$n] exit=$code $status" | tee -a "$LOG"
}

run 01-karina           novel   long-novel      "카리나와 나"         "카리나의 남자친구로 살다가 카리나가 임신을 하게 되면서 결혼까지 진행되는 이야기."
run 02-quebec-mystery   novel   long-novel      "만파식적의 그림자"   "캐나다 퀘벡의 고성에서 한국의 만파식적을 찾아, 고조선인이 캐나다인의 조상이라는 사실을 추적하는 미스터리 추리."
run 03-vibecoding-essay essay   essay-series    "월 1억의 사이드"     "바이브코딩으로 매달 1억원의 부수입을 얻는 평범한 공기업 직원의 일상 에세이."
run 04-eyebeam-webtoon  comics  serial-webtoon  "눈빛맨 등원기"       "눈빛만으로 모든 악당을 제압하는 남자 눈빛맨의 첫 유치원 등교기. 액션 코미디."
run 05-fx-column        academic academic-column "환율은 무력한가"    "환율로 인해 한국 경제가 받는 영향 — 의외로 그 영향이 무력해지고 있다는 논증 칼럼."
run 06-twist-thriller   novel   long-novel      "추적자의 얼굴"       "중간까지 주인공이 범인을 찾다가, 갑자기 주인공 자신이 범인으로서 행동하게 되는 반전 스릴러."

echo "ALL DONE" | tee -a "$LOG"
