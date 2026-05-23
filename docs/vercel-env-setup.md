# Vercel Functions 환경 변수 가이드

M5 마이그레이션 후, `api/*.ts` 5 라우트가 LLM 응답을 만들어 낸다. 키가 없으면 mock 폴백으로 떨어지므로 안전하지만, 실제 응답을 받으려면 둘 중 하나의 키가 필요하다.

## 변수 두 가지 — 둘 중 하나만

```bash
# (권장) Vercel AI Gateway — 모델 라우팅·관찰·폴백·zero-data-retention
AI_GATEWAY_API_KEY=...

# (직접) Anthropic 직결 — AI Gateway 없을 때 fallback 으로 @ai-sdk/anthropic 사용
ANTHROPIC_API_KEY=sk-ant-...
```

두 변수 모두 비어 있으면 `runLlmJson` 이 `status: 'mock'` 으로 응답하고, 클라이언트는 매체별 폴백 흐름으로 돌아간다.

## 로컬 dev

`.env.local` (gitignore 대상) 에 `ANTHROPIC_API_KEY=...` 또는 `AI_GATEWAY_API_KEY=...` 한 줄.

다만 로컬 dev 에서는 `vite.config.ts` 의 `storyxBridge` 미들웨어가 `/api/*` 를 가로채 `tools/storyx.mjs` 를 호출한다. 즉 로컬은 여전히 `claude` CLI 인증(`claude login`) 또는 `ANTHROPIC_API_KEY` 환경변수를 사용. Vercel Functions 는 production 빌드/배포본에서만 동작한다.

## Vercel 배포본

Vercel dashboard → Project Settings → Environment Variables 에 추가.

```
AI_GATEWAY_API_KEY = <Vercel AI Gateway 토큰>
# 또는
ANTHROPIC_API_KEY = sk-ant-...
```

추가 후 새 deployment 가 자동으로 새 env 를 적용. 기존 deployment 에 영향 없음.

## AI Gateway 권장 이유

- 모델 폴백 — anthropic 응답 실패 시 자동으로 OpenAI/Google 등 대체
- 관찰 — 토큰 사용량·지연·실패율 자동 기록
- Zero data retention — 모델 프로바이더에 데이터 보존 없음
- `'provider/model'` 문자열만으로 라우팅 (`anthropic/claude-3-5-sonnet-20241022`)

이미 `vercel-ai-gateway` 가 set 돼 있는 프로젝트라면 별도 비용 추가 없이 그대로 사용 가능.

## 페르소나 번들 (`vercel.json` 의 `includeFiles`)

`api/review-agent.ts` 는 `.claude/agents/<id>.md` 페르소나 본문을 LLM 정체성으로 주입한다. `vercel.json` 의 `functions.api/review-agent.ts.includeFiles: ".claude/agents/**"` 가 이 파일들을 serverless 번들에 포함시킨다.

새 에이전트 .md 를 추가하면 — `tools/storyx.mjs` 의 `agentFileMap` + `src/lib/server/promptBuilders.ts` 의 `AGENT_FILE_MAP` 양쪽에 등록. 이 두 매핑이 어긋나면 로컬 CLI 와 Vercel Function 에서 같은 페르소나가 다르게 로드된다.

## 확인 — 배포 후 한 줄 검증

```bash
curl -X POST https://<your-project>.vercel.app/api/interview \
  -H 'Content-Type: application/json' \
  -d '{"medium":"essay","format":"single-essay","freewrite":"테스트"}'
```

응답에 `"provider": "ai-gateway"` 또는 `"anthropic"` 이 보이고 questions 가 채워져 있으면 정상. `"provider": "mock"` 이면 env 가 빈 상태.
