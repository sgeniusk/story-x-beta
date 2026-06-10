# Story X

나의 이야기를 끝까지 데려가는 AI 창작 하네스입니다. 웹소설, 에세이, 오디오북, 웹툰, 인스타툰, 단편 만화처럼 길게 이어지거나 문체와 연속성이 중요한 작품을 만들 때 캐릭터, 세계관, 실제 경험, 문체, 낭독 리듬이 무너지지 않도록 돕습니다.

## 제품 철학

Story X는 AI가 글을 대신 써주는 도구가 아니라, `글`, `그림`, `소리`라는 AI 자원을 스토리 중심으로 조립하는 제작 시스템입니다.

- 먼저 이야기의 재미와 완성도를 검증합니다.
- 그다음 글쓰기, 그림, 낭독, 음악, 영상 컷 구성을 매체에 맞게 연결합니다.
- 완성된 소설은 오디오북, 만화, 각본, 컷 영상으로 전환할 수 있어야 합니다.
- 에세이는 게시용 글로 끝나지 않고 낭독, 오디오북, 영상 에세이로 확장될 수 있어야 합니다.
- 만화는 컷별 이미지와 나중의 영상 AI 흐름까지 이어질 수 있어야 합니다.

핵심은 언제나 스토리입니다. 혼자 읽을 글이든, 팔 수 있는 콘텐츠든, Story X는 이야기의 재미와 완성도를 먼저 지킵니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 Vite가 안내하는 로컬 주소를 열면 됩니다.

## 배포

Vercel에 GitHub 저장소를 연결하면 `main` 브랜치에 push될 때마다 자동으로 배포됩니다.

- Framework: `Vite`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

이 저장소에는 같은 설정을 담은 `vercel.json`이 포함되어 있습니다.

## 구성

- `src/lib/projectBlueprint.ts`: 소설/에세이/오디오북/만화, 장편/중편/단편/개인 에세이/회고 에세이/뮤직비디오/교육영상/동요읽기/인스타툰/단편 만화/웹툰 연재 등 선택 흐름과 제작 설계 보드 모델
- `src/lib/creativeDevelopment.ts`: 소재, 스토리, 작화/문체, 캐릭터/주변 인물 입력을 에이전트 협업 패키지로 정리하는 엔진
- `src/lib/storyEngine.ts`: 시리즈 바이블, 캐논 레저, 에이전트 협업, 회차 생성 엔진
- `src/lib/storyEngine.test.ts`: 연재 번호, 메모리 앵커, 캐논 충돌 테스트
- `src/App.tsx`: 작업실 UI
- `.claude/agents/`: Claude Code 프로젝트 서브에이전트
- `.claude/skills/`: 장기 연재 제작용 스킬 문서
- `docs/agent-system.md`: 전체 아키텍처와 운영 방식
- `docs/codex-agent-manifest.md`: Codex에서 같은 에이전트 역할을 적용하기 위한 매니페스트
- `docs/agent-workflow-plan.md`: 에이전트 구성 계획과 매체별 워크플로우

## storyx CLI

`tools/storyx.mjs`는 브라우저 없이 쓸 수 있는 CLI 하네스다. `npm run storyx -- <command>` 형식으로 실행한다.

### init — 새 프로젝트 scaffold

```bash
# 기본 실행 — storyx/export/v1 스키마 JSON 생성
npm run storyx -- init --title "내 소설" --medium novel --format long-novel --out ./my-project.json

# 옵션
# --title    작품 제목 (기본: 새 작품)
# --medium   novel | essay | comics | audiobook | academic (기본: novel)
# --format   long-novel | medium-novel | … (기본: long-novel)
# --out      출력 경로 (기본: ./storyx-project.json)
# --dry-run  파일 쓰지 않고 JSON 미리보기만 출력

npm run storyx -- init --title "테스트" --dry-run
```

생성된 JSON은 브라우저에서 "가져오기"로 바로 import 할 수 있다(`storyx/export/v1` 스키마).

### serve — 개발 서버 실행

```bash
# 기본 포트 5173
npm run storyx -- serve

# 포트 지정
npm run storyx -- serve --port 4000

# 실행할 명령만 확인 (서버 시작 안 함)
npm run storyx -- serve --dry-run
```

### memory sync — export JSON → 로컬 디렉터리 동기화

export JSON을 읽어 프로젝트 메타, 캐논 사실, 인물, 열린 실타래, evolutionHistory를 사람이 읽을 수 있는 md/json 파일로 풀어 저장한다. 역방향(디렉터리→export)은 미지원.

```bash
# 기본 실행
npm run storyx -- memory sync --from ./storyx-project.json --to ./storyx-memory

# --from   export JSON 파일 경로 (필수)
# --to     출력 디렉터리 (기본: ./storyx-memory)
# --dry-run 파일 쓰지 않고 생성할 파일 목록만 출력

npm run storyx -- memory sync --from ./storyx-project.json --dry-run
```

## Claude Code 사용

Claude Code의 프로젝트 서브에이전트는 `.claude/agents/`에 둔 Markdown 파일로 공유할 수 있습니다. 이 프로젝트는 장기 연재 제작용 핵심 서사 에이전트, 에세이 인터뷰/문체 에이전트, 오디오/교육영상 에이전트, 만화 제작용 시각 에이전트를 함께 포함합니다.

예시:

```text
Use the essay-interviewer and voice-curator subagents to question the writer, build a voice bible, and prepare a personal essay draft package.
```

참고 문서: [Anthropic Claude Code Subagents](https://docs.anthropic.com/en/docs/claude-code/sub-agents)

## Codex 사용

Codex는 Claude Code의 `.claude/agents/*.md`를 같은 방식으로 자동 실행하지는 않습니다. 대신 `AGENTS.md`와 `docs/codex-agent-manifest.md`를 프로젝트 지침과 역할 매니페스트로 읽고, 쇼러너/캐릭터/세계관/장르/에세이 인터뷰/문체 큐레이터/낭독 연출/교육영상/사운드 음악/콘티/다빈치 이미지/연속성 역할을 적용하면 됩니다.
