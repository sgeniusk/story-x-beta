# 온보딩 소재발굴 S1 — 선택 스텝 + StoryPreset 프리셋 갈래 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 소설류 온보딩 2단계를 소재발굴 선택 스텝(3갈래)으로 바꾸고, 인기 프리셋 갈래를 LLM 0콜로 playseed 확인 카드(상대 선택 추가)→dive 진입까지 완주 가능하게 만든다.

**Architecture:** 순수 데이터 모듈(StoryPreset 5종) + 기존 휴면 부품(PlaySeedPanel·buildPlayFirstProject·handleStartPlay) 재배선. HomeFlowStep에 'source'·'preset' 추가, 갈래 패널은 charter/playseed처럼 조건부 mount로 캐러셀 인덱스 정합 유지. 비소설 매체 무접촉.

**Tech Stack:** React + TypeScript + Vitest(renderToStaticMarkup 컴포넌트 테스트 + 소스 핀 테스트). LLM 콜 없음.

**Spec:** `docs/superpowers/specs/2026-07-12-source-discovery-preset-design.md`

---

## 배경 지식 (제로 컨텍스트 요약)

- 온보딩은 `src/App.tsx`의 `StoryXHome` 컴포넌트. 스텝은 `homeFlowStep` 상태 하나, 패널들은 `.hx-track`에 가로로 쌓여 `translateX(-${homeFlowIndex * 100}%)`로 슬라이드. **mount된 패널의 DOM 순서 인덱스 = homeFlowIndex여야 화면이 맞는다.** charter·playseed는 활성일 때만 mount되는 조건부 패널 선례.
- `HomeFlowStep` 타입은 `src/lib/projectBlueprint.ts:77`. 영속 가드 `isHomeFlowStep`은 `src/lib/storage.ts:583` — **여기 안 넣으면 새로고침 복원이 medium으로 롤백**.
- 홈 화면 CSS는 라이트 `--nx-*` 토큰(`src/styles.css`의 `.home-page .hx-*` 블록, playseed는 7668~).
- `appExperience.test.ts`는 App.tsx **소스 문자열**을 `toContain`으로 핀하는 계약 테스트. 재설계로 CTA가 바뀌면 핀을 의도적으로 갱신한다(약화 아님).
- 테스트 실행: `npx vitest run <파일>` · 전체 게이트: `bash init.sh`.
- 커밋은 **변경 파일만 명시적으로 add** (git add -A 금지 — 서브에이전트 커밋 위생).

---

### Task 1: StoryPreset 순수 데이터 모듈

**Files:**
- Create: `src/lib/storyPresets.ts`
- Test: `src/lib/storyPresets.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/storyPresets.test.ts` 전체 내용:

```ts
// 소재발굴 인기 프리셋 카탈로그 계약 — 구성 단위·플레이 시드 유효성
import { describe, expect, it } from 'vitest';
import { STORY_PRESETS } from './storyPresets';

describe('STORY_PRESETS', () => {
  it('5종 이상이고 id 가 고유하다', () => {
    expect(STORY_PRESETS.length).toBeGreaterThanOrEqual(5);
    const ids = STORY_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('카드 노출 필드(제목·훅)와 유사도 앵커 keywords 가 채워져 있다', () => {
    for (const p of STORY_PRESETS) {
      expect(p.title.trim()).not.toBe('');
      expect(p.hook.trim()).not.toBe('');
      expect(p.keywords.length).toBeGreaterThan(0);
      expect(p.keywords.every((k) => k.trim() !== '')).toBe(true);
    }
  });

  it('각 setup 은 유효한 플레이 시드다 — 인물 진하게, 첫 장면 하나', () => {
    for (const p of STORY_PRESETS) {
      expect(p.setup.scene.trim()).not.toBe('');
      expect(p.setup.myRole.trim()).not.toBe('');
      expect(p.setup.cast.length).toBeGreaterThanOrEqual(2);
      for (const c of p.setup.cast) {
        expect(c.name.trim()).not.toBe('');
        expect(c.desire.trim()).not.toBe('');
        expect(c.wound.trim()).not.toBe('');
        expect(c.voiceRules.length).toBeGreaterThan(0);
      }
    }
  });

  it('cast 에 사용자 역할(myRole)이 중복 편입되지 않는다 — cast[0]=상대역 구조 보호', () => {
    for (const p of STORY_PRESETS) {
      for (const c of p.setup.cast) {
        expect(p.setup.myRole.includes(c.name)).toBe(false);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/storyPresets.test.ts`
Expected: FAIL — `Cannot find module './storyPresets'`

- [ ] **Step 3: Write the implementation**

`src/lib/storyPresets.ts` 전체 내용 (데이터는 아래 그대로 — 재저작 금지):

```ts
// 온보딩 소재발굴 인기 프리셋 — 구성 단위 카탈로그(제목·훅·유사도 키워드·플레이 시드). 헌장·결말·회차 구조는 담지 않는다(설정 깊이 상한).
import type { DiveSetup } from './diveProposal';

export interface StoryPreset {
  id: string;
  title: string; // 구성 이름 — 카드 제목
  hook: string; // 한 줄 훅 — 카드 본문
  keywords: string[]; // 유사도 앵커 — S3 적응형 인터뷰의 비교 제안용
  setup: DiveSetup; // 플레이 시드 — 인물 진하게(desire·wound·voiceRules), 세계/플롯 얕게
}

export const STORY_PRESETS: StoryPreset[] = [
  {
    id: 'preset-loop-regression',
    title: '루프 회귀물',
    hook: '죽던 날의 기억을 안고, 모든 것이 시작된 아침으로 돌아왔다.',
    keywords: ['회귀', '루프', '시간', '두 번째 삶', '복수', '되돌리기'],
    setup: {
      scene:
        '눈을 뜨니 3년 전 입사 첫날 아침. 오늘 밤 회사 옥상에서 죽는 선배를, 나만 기억하고 있다.',
      cast: [
        {
          name: '한서진',
          role: '오늘 밤 죽게 될 선배',
          desire: '아무 일 없다는 듯 오늘 하루를 무사히 넘기고 싶다',
          wound: '회사의 비리를 폭로하려다 묻힌 적이 있다',
          voiceRules: ['농담으로 진심을 가린다', '중요한 얘기일수록 말끝을 흐린다', '후배에게는 반말']
        },
        {
          name: '차도현',
          role: '모든 걸 아는 듯한 전략실장',
          desire: '회귀자의 존재를 확인하고 이용하고 싶다',
          wound: '한 번의 선택으로 사람을 잃은 과거',
          voiceRules: ['짧고 단정적으로', '질문에 질문으로 답한다', '존댓말이지만 차갑다']
        }
      ],
      myRole: '회귀 전 기억을 가진 신입 — 오늘 밤의 죽음을 막아야 한다.'
    }
  },
  {
    id: 'preset-rich-ledger',
    title: '부자 되는 이야기',
    hook: '유품으로 받은 낡은 수첩엔 앞으로 10년의 세상이 적혀 있었다.',
    keywords: ['재벌', '주식', '돈', '성공', '수완', '역전'],
    setup: {
      scene:
        '장례식이 끝난 밤, 할아버지의 수첩 첫 장을 넘긴다. 내일 급등할 종목과 낯선 경고 한 줄 — "강 회장을 조심해라."',
      cast: [
        {
          name: '강만호',
          role: '수첩의 존재를 아는 재벌 회장',
          desire: '수첩을 손에 넣어 제국을 완성하고 싶다',
          wound: '수첩의 원래 주인에게 평생 단 한 번 패배한 기억',
          voiceRules: ['느리고 낮게, 위협은 웃으며', '돈 얘기는 숫자로만', '상대를 자네라 부른다']
        },
        {
          name: '윤세라',
          role: '수완 좋은 승부사 애널리스트',
          desire: '판을 읽는 진짜 실력자 곁에서 크게 이기고 싶다',
          wound: '한 번의 오판으로 모든 고객을 잃었다',
          voiceRules: ['빠르고 정확하게', '확신 없는 말은 하지 않는다', '이득 앞에서 솔직하다']
        }
      ],
      myRole: '수첩을 물려받은 상속자 — 10년치 미래로 밑바닥에서 판을 뒤집는다.'
    }
  },
  {
    id: 'preset-rofan-possession',
    title: '악역 영애 빙의',
    hook: '눈을 뜨니 어젯밤 완독한 소설 속, 3권에서 처형당하는 악역 영애였다.',
    keywords: ['빙의', '악역', '영애', '로판', '황궁', '처형 회피'],
    setup: {
      scene:
        '거울 속엔 소설 속 악역 영애의 얼굴. 오늘은 하필 그녀가 황태자의 약혼녀 자리에서 밀려나기 시작하는 무도회 날이다.',
      cast: [
        {
          name: '카일런',
          role: '원작에서 그녀를 처형하는 황태자',
          desire: '갑자기 달라진 약혼녀의 속셈을 파헤치고 싶다',
          wound: '어릴 적 신뢰한 사람에게 배신당해 아무도 믿지 않는다',
          voiceRules: ['정중하지만 뼈가 있다', '감정을 드러내는 대신 관찰한다', '이름 대신 영애라 부른다']
        },
        {
          name: '리에타',
          role: '원작 주인공인 순진한 시녀',
          desire: '갑자기 다정해진 아가씨의 진심을 알고 싶다',
          wound: '신분 때문에 삼켜온 말들',
          voiceRules: ['조심스럽고 공손하게', '기쁘면 말이 빨라진다', '아가씨라 부른다']
        }
      ],
      myRole: '악역 영애에 빙의한 독자 — 원작 전개를 알지만, 처형 엔딩만은 바꿔야 한다.'
    }
  },
  {
    id: 'preset-hunter-gate',
    title: '헌터 각성물',
    hook: '만년 최하급 헌터의 눈앞에, 남들에겐 보이지 않는 상태창이 떴다.',
    keywords: ['헌터', '게이트', '각성', '시스템', '레벨업', '던전'],
    setup: {
      scene:
        '폐쇄 직전의 D급 게이트 앞. 오늘도 짐꾼으로 들어가려는 순간, 눈앞에 반투명한 글자가 떠올랐다 — "숨겨진 퀘스트가 도착했습니다."',
      cast: [
        {
          name: '백은호',
          role: '냉정한 S급 길드장',
          desire: '급성장하는 무명 헌터의 정체를 확인해 영입하고 싶다',
          wound: '팀원을 전멸시킨 레이드의 유일한 생존자',
          voiceRules: ['필요한 말만 한다', '실력은 의심하고 결과만 믿는다', '이름을 확인하고 나서야 부른다']
        },
        {
          name: '진아린',
          role: '눈썰미 좋은 각성 감정사',
          desire: '측정 불가로 뜨는 이 헌터의 비밀을 세상보다 먼저 알고 싶다',
          wound: '오판 하나로 헌터 한 명을 죽게 만든 기억',
          voiceRules: ['호기심을 숨기지 않는다', '전문용어를 섞어 빠르게', '위험 앞에서만 진지해진다']
        }
      ],
      myRole: '숨겨진 시스템을 각성한 최하급 헌터 — 남들 모르게 강해진다.'
    }
  },
  {
    id: 'preset-academy-sword',
    title: '아카데미 검술물',
    hook: '입학시험 꼴찌로 들어온 검술 아카데미 — 내 몸엔 전대 검성의 기억이 잠들어 있다.',
    keywords: ['아카데미', '검술', '천재', '성장', '입학', '숨긴 실력'],
    setup: {
      scene:
        '아카데미 입학식 날, 꼴찌 입학생에게 쏟아지는 비웃음. 그때 수석 입학생이 다가와 결투를 신청한다.',
      cast: [
        {
          name: '레이나르',
          role: '오만한 수석 입학생',
          desire: '자신을 긴장시킨 유일한 상대의 바닥을 확인하고 싶다',
          wound: '가문의 기대에 짓눌려 패배가 허락되지 않는다',
          voiceRules: ['도발은 우아하게', '인정은 어렵게, 한 번 인정하면 끝까지', '검 얘기엔 존칭을 잊는다']
        },
        {
          name: '모르간',
          role: '은퇴한 검성 출신 교관',
          desire: '꼴찌 입학생의 검에서 본 옛 친구의 그림자를 확인하고 싶다',
          wound: '검성의 자리를 스스로 내려놓게 만든 사건',
          voiceRules: ['빙 둘러 시험하듯 묻는다', '칭찬은 반 박자 늦게', '학생을 자네라 부른다']
        }
      ],
      myRole: '전대 검성의 기억이 깨어나는 꼴찌 입학생 — 실력을 숨긴 채 성장한다.'
    }
  }
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/storyPresets.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/storyPresets.ts src/lib/storyPresets.test.ts
git commit -m "feat(onboarding): StoryPreset 구성 단위 카탈로그 5종 — 소재발굴 프리셋 갈래 데이터"
```

---

### Task 2: buildPlayFirstProject 상대 선택(partnerIndex)

**Files:**
- Modify: `src/lib/playEntry.ts:80-100`
- Test: `src/lib/playEntry.test.ts` (기존 파일에 추가)

- [ ] **Step 1: Write the failing test**

`src/lib/playEntry.test.ts`의 `buildPlayFirstProject` describe 블록 안에 추가 (기존 테스트 형식과 동일하게 — 파일을 먼저 읽고 기존 setup 픽스처 스타일을 따를 것):

```ts
it('partnerIndex 지정 시 해당 인물이 세션 상대(primaryCharacterId)가 된다', () => {
  const setup: DiveSetup = {
    scene: '골목 어귀',
    cast: [
      { name: '가온', role: '주연', desire: 'd', wound: 'w', voiceRules: ['r'] },
      { name: '나루', role: '조연', desire: 'd2', wound: 'w2', voiceRules: ['r2'] }
    ],
    myRole: '지나가던 행인'
  };
  const built = buildPlayFirstProject(setup, { medium: 'novel', format: 'long-novel' }, 1);
  expect(built).not.toBeNull();
  const partner = built!.project.characters.find((c) => c.id === built!.diveState.session.characterId);
  expect(partner?.name).toBe('나루');
});

it('partnerIndex 가 범위를 벗어나면 cast[0] 으로 폴백한다', () => {
  const setup: DiveSetup = {
    scene: '골목 어귀',
    cast: [{ name: '가온', role: '주연', desire: 'd', wound: 'w', voiceRules: ['r'] }],
    myRole: '지나가던 행인'
  };
  const built = buildPlayFirstProject(setup, { medium: 'novel', format: 'long-novel' }, 5);
  expect(built).not.toBeNull();
  const partner = built!.project.characters.find((c) => c.id === built!.diveState.session.characterId);
  expect(partner?.name).toBe('가온');
});
```

주의 — `DiveSetup` import가 테스트 파일에 이미 있는지 확인하고 없으면 추가. `DiveState.session.characterId`는 `createDiveSession`이 채우는 필드(diveSession.ts 참조).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/playEntry.test.ts`
Expected: FAIL — partnerIndex 인자 미지원(2개 신규 테스트만 실패, 기존 테스트는 통과 유지)

- [ ] **Step 3: Write the implementation**

`src/lib/playEntry.ts`의 `buildPlayFirstProject`를 다음으로 교체 (JSDoc 유지, 시그니처에 3번째 파라미터 추가):

```ts
/**
 * PLAY-first 온보딩 글루 — 제안/프리셋 setup 에서 최소 프로젝트(회차 0)와
 * 첫 장면이 주입된 DiveState 를 만든다. 옛 seedAndEnter(6a95a52) 규칙 계승.
 * 설정 깊이 상한 — 헌장·결말·회차 구조는 만들지 않는다(스펙 결정 5).
 * partnerIndex — playseed 카드에서 고른 대화 상대(기본 cast[0], 범위 밖은 폴백).
 */
export function buildPlayFirstProject(
  setup: DiveSetup,
  meta: { medium?: CreativeMedium; format?: CreativeFormat },
  partnerIndex = 0
): { project: SeriesProject; diveState: DiveState } | null {
  const { scene, characters } = seedFromProposal(setup);
  const primary = characters[partnerIndex] ?? characters[0];
  if (!primary) return null;
  const title = (setup.myRole.trim() || setup.scene.trim()).slice(0, 20) || PLAY_FIRST_FALLBACK_TITLE;
  const project: SeriesProject = {
    ...createEmptyProject({ title, medium: meta.medium, format: meta.format }),
    characters
  };
  const session = createDiveSession(primary.id, project.id);
  return {
    project,
    diveState: {
      schema: 'storyx/dive/v1',
      session: scene ? { ...session, scene } : session,
      project
    }
  };
}
```

(`primaryCharacterId` 구조분해는 더 이상 안 쓰므로 제거 — `seedFromProposal` 자체는 무변경.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/playEntry.test.ts`
Expected: PASS (기존 + 신규 2)

- [ ] **Step 5: Commit**

```bash
git add src/lib/playEntry.ts src/lib/playEntry.test.ts
git commit -m "feat(play-entry): buildPlayFirstProject 에 대화 상대 선택(partnerIndex) — 기본 cast[0] 폴백"
```

---

### Task 3: HomeFlowStep 'source'/'preset' + playSetup shape 가드

**Files:**
- Modify: `src/lib/projectBlueprint.ts:77` (HomeFlowStep 유니온)
- Modify: `src/lib/storage.ts:583-592` (isHomeFlowStep) · `src/lib/storage.ts:421` (playSetup blind-cast)
- Test: `src/lib/storage.test.ts` (기존 파일에 추가)

- [ ] **Step 1: Write the failing test**

`src/lib/storage.test.ts`의 온보딩 draft 관련 describe에 추가 (기존 테스트가 draft 픽스처를 만드는 방식을 먼저 읽고 동일 스타일로):

```ts
it("homeFlowStep 'source'·'preset' 이 복원에서 살아남는다 (medium 롤백 방지)", () => {
  const base = /* 기존 테스트의 유효 draft 픽스처를 재사용 */;
  for (const step of ['source', 'preset'] as const) {
    const parsed = parseOnboardingDraft(JSON.stringify({ ...base, homeFlowStep: step }));
    expect(parsed?.homeFlowStep).toBe(step);
  }
});

it('손상된 playSetup shape 은 null 로 강등된다 (blind-cast 가드)', () => {
  const base = /* 기존 유효 draft 픽스처 */;
  const broken = [
    {},                                             // 필드 전무
    { scene: '장면', myRole: '' },                  // cast 없음
    { scene: '장면', cast: 'not-array', myRole: '' }, // cast 비배열
    { scene: '장면', cast: [], myRole: '' },        // cast 빈 배열
    { scene: '장면', cast: [{ role: 'r' }], myRole: '' }, // cast 인물에 name 없음
    { scene: 7, cast: [{ name: 'a' }], myRole: '' } // scene 비문자열
  ];
  for (const bad of broken) {
    const parsed = parseOnboardingDraft(JSON.stringify({ ...base, playSetup: bad }));
    expect(parsed?.playSetup).toBeNull();
  }
});

it('정상 playSetup 은 라운드트립을 유지하고 누락 옵션 필드는 백필된다', () => {
  const base = /* 기존 유효 draft 픽스처 */;
  const setup = { scene: '장면', cast: [{ name: '가온' }], myRole: '행인' };
  const parsed = parseOnboardingDraft(JSON.stringify({ ...base, playSetup: setup }));
  expect(parsed?.playSetup).toEqual({
    scene: '장면',
    cast: [{ name: '가온', role: '', desire: '', wound: '', voiceRules: [] }],
    myRole: '행인'
  });
});
```

(기존 정상 playSetup 라운드트립 테스트가 storage.test.ts:192 근처에 있다 — 깨지지 않는지 함께 확인.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/storage.test.ts`
Expected: FAIL — 'source' 복원이 'medium' 롤백 + 손상 shape 이 그대로 통과

- [ ] **Step 3: Write the implementation**

① `src/lib/projectBlueprint.ts:77` — 유니온에 두 값 추가:

```ts
export type HomeFlowStep = 'medium' | 'source' | 'freewrite' | 'preset' | 'playseed' | 'intake' | 'charter' | 'building';
```

② `src/lib/storage.ts` `isHomeFlowStep`에 두 값 추가:

```ts
function isHomeFlowStep(value: unknown): value is HomeFlowStep {
  return (
    value === 'medium' ||
    value === 'source' ||
    value === 'freewrite' ||
    value === 'preset' ||
    value === 'playseed' ||
    value === 'intake' ||
    value === 'charter' ||
    value === 'building'
  );
}
```

③ `src/lib/storage.ts` — `parseOnboardingDraft` 위쪽에 shape 가드 헬퍼 추가하고 `:421`의 blind-cast 를 교체:

```ts
// playSetup 복원 shape 가드 — 손상 저장본이 DiveSetup 으로 blind-cast 되어 playseed 카드가 크래시하는 것을 막는다.
function parseDiveSetup(value: unknown): DiveSetup | null {
  if (!isRecord(value)) return null;
  if (typeof value.scene !== 'string' || typeof value.myRole !== 'string') return null;
  if (!Array.isArray(value.cast) || value.cast.length === 0) return null;
  const cast: DiveSetup['cast'] = [];
  for (const entry of value.cast) {
    if (!isRecord(entry) || typeof entry.name !== 'string' || entry.name.trim() === '') return null;
    cast.push({
      name: entry.name,
      role: typeof entry.role === 'string' ? entry.role : '',
      desire: typeof entry.desire === 'string' ? entry.desire : '',
      wound: typeof entry.wound === 'string' ? entry.wound : '',
      voiceRules: Array.isArray(entry.voiceRules)
        ? entry.voiceRules.filter((v): v is string => typeof v === 'string')
        : []
    });
  }
  return { scene: value.scene, cast, myRole: value.myRole };
}
```

`parseOnboardingDraft` 반환 객체의 마지막 필드 교체:

```ts
    playSetup: parseDiveSetup(parsed.playSetup)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/storage.test.ts`
Expected: PASS (기존 + 신규 3)

- [ ] **Step 5: Run typecheck (HomeFlowStep 확장 여파 확인)**

Run: `npx tsc --noEmit`
Expected: PASS — HomeFlowStep 은 유니온 확장이라 기존 소비처(switch 없음, 비교만) 무영향

- [ ] **Step 6: Commit**

```bash
git add src/lib/projectBlueprint.ts src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat(storage): HomeFlowStep source/preset 복원 + playSetup shape 가드 (blind-cast 백로그 해소)"
```

---

### Task 4: PlaySeedPanel 대화 상대 선택

**Files:**
- Modify: `src/components/PlaySeedPanel.tsx`
- Test: `src/components/playSeedPanel.test.ts` (기존 파일 갱신)

- [ ] **Step 1: Write the failing test**

`src/components/playSeedPanel.test.ts`에 추가 (기존 테스트의 renderToStaticMarkup + props 픽스처 스타일을 먼저 읽고 따를 것 — 기존 픽스처에 `partnerIndex: 0`, `onPickPartner: () => {}`를 추가해 기존 테스트도 컴파일되게 갱신):

```ts
it('cast 가 여럿이면 대화 상대 선택 버튼이 렌더되고 partnerIndex 가 selected 로 표시된다', () => {
  const html = renderToStaticMarkup(
    createElement(PlaySeedPanel, {
      setup: {
        scene: '장면',
        cast: [
          { name: '가온', role: '주연', desire: 'd', wound: 'w', voiceRules: [] },
          { name: '나루', role: '조연', desire: 'd2', wound: 'w2', voiceRules: [] }
        ],
        myRole: '행인'
      },
      loading: false,
      error: '',
      presets: [],
      partnerIndex: 1,
      onPickPartner: () => {},
      onPickPreset: () => {},
      onConfirm: () => {},
      onBack: () => {}
    })
  );
  expect(html).toContain('대화 상대');
  expect(html).toContain('hx-playseed-partner');
  // 선택 상태 — 나루(index 1) 버튼에만 is-selected
  const naru = html.slice(html.indexOf('나루') - 200, html.indexOf('나루'));
  expect(naru).toContain('is-selected');
  const gaon = html.slice(html.indexOf('가온') - 200, html.indexOf('가온'));
  expect(gaon).not.toContain('is-selected');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/playSeedPanel.test.ts`
Expected: FAIL — partnerIndex prop 미존재(타입 에러) 또는 hx-playseed-partner 미렌더

- [ ] **Step 3: Write the implementation**

`src/components/PlaySeedPanel.tsx` 수정 — props 두 개 추가, cast `<ul>` 목록을 선택 버튼 그룹으로 교체:

```tsx
interface PlaySeedPanelProps {
  setup: DiveSetup | null;
  loading: boolean;
  error: string;
  presets: DiveSeedCharacter[];
  onPickPreset: (index: number) => void;
  onConfirm: () => void;
  onBack: () => void;
  // 대화 상대 선택 — cast 중 세션 상대역(기본 cast[0]). 프레젠테이션 전용, 상태는 App 이 쥔다.
  partnerIndex: number;
  onPickPartner: (index: number) => void;
  // LLM 대기 안내 — 경과 시간·새로고침 금지 문구(App 이 조립). loading 중에만 렌더한다.
  loadingNote?: string;
}
```

함수 시그니처에 `partnerIndex, onPickPartner` 추가. 확인 카드의 `<ul className="hx-playseed-cast">…</ul>` 블록을 다음으로 교체:

```tsx
          <div className="hx-playseed-field">
            <span className="hx-playseed-label">대화 상대</span>
            <div className="hx-playseed-cast" role="group" aria-label="대화 상대 선택">
              {setup.cast.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  className={`hx-playseed-partner ${i === partnerIndex ? 'is-selected' : ''}`}
                  aria-pressed={i === partnerIndex}
                  onClick={() => onPickPartner(i)}
                >
                  <strong>{c.name}</strong> · {c.role}
                  {c.desire ? <em> — {c.desire}</em> : null}
                </button>
              ))}
            </div>
          </div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/playSeedPanel.test.ts`
Expected: PASS (기존 6 + 신규 1). App.tsx 는 아직 새 props 를 안 넘겨 tsc 가 깨진 상태 — Task 5 에서 배선하므로 **이 시점엔 vitest 만 확인**(tsc 는 Task 5 종료 시).

- [ ] **Step 5: Commit**

```bash
git add src/components/PlaySeedPanel.tsx src/components/playSeedPanel.test.ts
git commit -m "feat(playseed): 확인 카드에 대화 상대 선택 — cast 버튼 그룹, 프레젠테이션 전용 유지"
```

---

### Task 5: App.tsx 소재발굴 배선 + 핀 갱신 + CSS

**Files:**
- Modify: `src/App.tsx` (StoryXHome — 소재발굴 선택 패널·프리셋 패널·인디케이터/인덱스·CTA·playseed 배선)
- Modify: `src/appExperience.test.ts:177-196` (파킹 핀 → 소재발굴 핀)
- Modify: `src/styles.css` (`.hx-source-*`·`.hx-preset-*`·`.hx-playseed-partner`)

- [ ] **Step 1: Write the failing test (핀 갱신)**

`src/appExperience.test.ts`의 `describe('PLAY-first 온보딩 (playseed 파킹 상태)', …)` 블록(:177-196)을 다음으로 교체. `blueprintSource` 읽기는 기존 블록이 이미 하고 있으니 유지:

```ts
describe('온보딩 소재발굴 (S1 — 선택 스텝 + 프리셋 갈래)', () => {
  it('소설류 2단계는 소재발굴 3갈래 카드다 — 자유 서술·함께 구상(준비 중)·인기 프리셋', () => {
    expect(blueprintSource).toContain("'source'");
    expect(blueprintSource).toContain("'preset'");
    expect(app).toContain('소재발굴');
    expect(app).toContain('함께 구상');
    expect(app).toContain('인기 프리셋');
    expect(app).toContain('준비 중'); // 함께 구상은 S2 까지 비활성 노출
    expect(app).toContain('소재발굴로 계속'); // 소설류 매체 패널 CTA
    expect(app).toContain('자유 서술로 계속'); // 비소설 CTA 보존
    expect(app).toContain('인터뷰로 계속'); // 자유 서술 갈래 CTA 보존
  });

  it('프리셋 갈래는 LLM 0콜로 playseed 확인 카드에 도달한다', () => {
    expect(app).toContain('STORY_PRESETS');
    expect(app).toContain('pickStoryPreset');
    expect(app).toContain("homeFlowStep === 'preset'");
  });

  it("HomeFlowStep 에 'playseed' 가 있고 PlaySeedPanel 이 배선된다", () => {
    expect(blueprintSource).toContain("'playseed'");
    expect(app).toContain('PlaySeedPanel');
    expect(app).toContain("homeFlowStep === 'playseed'");
    expect(app).toContain('partnerIndex'); // 상대 선택 배선
  });

  // (기존) 플레이 승인 순서 핀 — saveProject → setWorkTitle → saveDiveState → clearOnboardingDraft → setStage('dive')
  // 이 it 블록은 기존 :190-196 그대로 유지한다.
});
```

주의 — 기존 블록의 `expect(app).not.toContain('플레이로 시작')` 파킹 단언과 `expect(app).toContain('소재발굴 재설계')` 주석 단언은 **삭제**(파킹 해제가 이 슬라이스의 목적). `handleStartPlay` 순서 핀 it 은 그대로 유지.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/appExperience.test.ts`
Expected: FAIL — '소재발굴'·STORY_PRESETS 등 미존재

- [ ] **Step 3: App.tsx 구현**

모두 `StoryXHome` 컴포넌트 안. 참조 라인은 현 main 기준 — 실제 편집 시 주변 코드를 읽고 위치를 확정한다.

**(a) import 추가** — 파일 상단 lib import 군에:

```ts
import { STORY_PRESETS, type StoryPreset } from './lib/storyPresets';
```

**(b) 소재발굴 플래그 + 상대 선택 상태** — `usesCharter` 선언(:1171) 근처에:

```ts
  // 소재발굴(S1) — 소설류만 2단계를 3갈래 선택으로 연다. 비소설은 기존 freewrite 직행 무접촉.
  const usesSourceDiscovery = blueprint.medium === 'novel';
```

playSetup 상태 군(:1239 근처)에:

```ts
  // playseed 대화 상대 선택 — cast 인덱스(기본 0). setup 이 바뀌면 0 으로 리셋한다.
  const [playPartnerIndex, setPlayPartnerIndex] = useState(0);
```

**(c) 프리셋 선택 핸들러** — `confirmPlaySeed`(:1371) 앞에:

```ts
  // 인기 프리셋 갈래 — LLM 0콜. 프리셋 setup 을 그대로 playseed 확인 카드에 싣는다.
  function pickStoryPreset(preset: StoryPreset) {
    setPlaySetup(preset.setup);
    setPlayPartnerIndex(0);
    setPlaySeedError('');
    setHomeFlowStep('playseed');
  }
```

`confirmPlaySeed`의 `buildPlayFirstProject` 호출에 3번째 인자:

```ts
    const built = buildPlayFirstProject(playSetup, { medium: blueprint.medium, format: blueprint.format }, playPartnerIndex);
```

**(d) 인디케이터·인덱스** — `homeFlowSteps`(:1500-1516) 블록 전체를 다음으로 교체:

```ts
  const homeFlowSteps: Array<{ id: HomeFlowStep; label: string; caption: string }> = [
    { id: 'medium', label: '매체 선택', caption: '무엇을 만들지 정합니다.' },
    // 소재발굴(S1) — 소설류는 2단계가 3갈래 선택. 갈래 패널(freewrite/preset)은 이 항목의 하위로 취급한다.
    usesSourceDiscovery
      ? { id: 'source' as HomeFlowStep, label: '소재발굴', caption: '소재를 찾는 방법을 고릅니다.' }
      : { id: 'freewrite' as HomeFlowStep, label: '자유 서술', caption: '쓰고 싶은 이야기를 흘려 적습니다.' },
    { id: 'intake', label: '작가 인터뷰', caption: '에이전트가 맞춤 질문을 합니다.' },
    // 작품 헌장 — 연재 서사만 거치는 단계(A-3). 단편 단독·에세이·학술은 건너뛴다.
    ...(usesCharter
      ? [{ id: 'charter' as HomeFlowStep, label: '작품 헌장', caption: '결말부터 4줄로 잡습니다.' }]
      : [])
  ];
  // building 패널 앞에는 charter 를 뺀 단계만 실제 mount 된다(charter 는 homeFlowStep==='charter'일 때만 렌더).
  const buildingPanelIndex = homeFlowSteps.filter((s) => s.id !== 'charter').length;
  // 소재발굴 갈래 패널(freewrite/preset) — 소설류에선 source 다음 슬롯에 조건부 mount 되어 DOM 인덱스를 공유한다.
  const isSourceBranch = usesSourceDiscovery && (homeFlowStep === 'freewrite' || homeFlowStep === 'preset');
  const sourceBranchIndex = homeFlowSteps.findIndex((step) => step.id === 'source') + 1;
  // playseed 는 인디케이터 배열에 없다(전용 경로로만 진입) — charter 처럼 활성일 때만 mount 되고,
  // charter conditional 뒤 · building 앞에 위치하므로 DOM 상 슬라이드 인덱스는 buildingPanelIndex 와 같다.
  const homeFlowIndex =
    homeFlowStep === 'building' || homeFlowStep === 'playseed'
      ? buildingPanelIndex
      : isSourceBranch
        ? sourceBranchIndex
        : homeFlowSteps.findIndex((step) => step.id === homeFlowStep);
  // 인디케이터 하이라이트·클릭 게이트는 갈래 패널을 source 항목으로 접는다(전진 스킵 방지 — intake 직행 금지).
  const indicatorId: HomeFlowStep = isSourceBranch ? 'source' : homeFlowStep;
  const indicatorIndex =
    homeFlowStep === 'building' || homeFlowStep === 'playseed'
      ? buildingPanelIndex
      : homeFlowSteps.findIndex((step) => step.id === indicatorId);
```

**(e) 인디케이터 렌더**(:1528-1545) — `homeFlowIndex` 대신 `indicatorIndex`/`indicatorId` 사용:

```tsx
          {homeFlowSteps.map((step, index) => {
            const stepIndex = indicatorIndex < 0 ? 0 : indicatorIndex;
            const isActive = step.id === indicatorId;
            const isDone = index < stepIndex;
            return ( /* 기존 버튼 JSX 그대로 — onClick={() => index <= stepIndex && setHomeFlowStep(step.id)} */ );
          })}
```

`.hx-track`의 `translateX(-${homeFlowIndex * 100}%)`는 그대로(핀).

**(f) 매체 패널 CTA·다음 단계 카드**(:1598-1614) — aside 를 조건부로:

```tsx
          <aside className="hx-aside">
            <div className="hx-aside-card">
              <div className="hx-aside-label">다음 단계</div>
              <div className="hx-aside-title">{usesSourceDiscovery ? '소재발굴' : '자유 서술'}</div>
              <p>
                {usesSourceDiscovery
                  ? '자유 서술·함께 구상·인기 프리셋 중에서 소재를 찾는 방법을 고릅니다.'
                  : '쓰고 싶은 이야기를 자유롭게 흘려 적습니다. 구조나 인물 이름은 신경 쓰지 않아도 됩니다.'}
              </p>
            </div>
            {/* 선택됨 카드 기존 그대로 */}
            <button
              type="button"
              className="hx-btn hx-btn-block"
              onClick={() => setHomeFlowStep(usesSourceDiscovery ? 'source' : 'freewrite')}
            >
              {usesSourceDiscovery ? '소재발굴로 계속' : '자유 서술로 계속'}
            </button>
          </aside>
```

**(g) 소재발굴 선택 패널** — 매체 패널 `</section>` 직후·자유 서술 패널 직전에 삽입:

```tsx
        {usesSourceDiscovery && (
          <section className="hx-panel" aria-label="소재발굴 갈래 선택">
            <div className="hx-main">
              <p className="hx-eyebrow">02 · 소재발굴</p>
              <h1 className="hx-h1">이야기의 소재를 어떻게 찾을까요?</h1>
              <p className="hx-lead">세 가지 방법 중 하나를 고르세요. 어느 쪽이든 플레이하며 완성해나갈 수 있습니다.</p>
              <div className="hx-source-grid">
                <button type="button" className="hx-source-card" onClick={() => setHomeFlowStep('freewrite')}>
                  <strong>자유 서술</strong>
                  <p>쓰고 싶은 이야기를 흘려 적으면 작가진이 맞춤 인터뷰를 준비합니다.</p>
                </button>
                <button type="button" className="hx-source-card is-soon" disabled>
                  <strong>함께 구상</strong>
                  <span className="hx-source-soon">준비 중</span>
                  <p>작가진과 채팅하며 소재를 캐냅니다. 곧 열립니다.</p>
                </button>
                <button type="button" className="hx-source-card" onClick={() => setHomeFlowStep('preset')}>
                  <strong>인기 프리셋</strong>
                  <p>인기 구성으로 바로 시작합니다. 고르면 그대로 플레이가 열립니다.</p>
                </button>
              </div>
              <div className="hx-aside-actions">
                <button type="button" className="hx-btn-ghost" onClick={() => setHomeFlowStep('medium')}>이전</button>
              </div>
            </div>
          </section>
        )}
```

**(h) 자유 서술 패널 조건부 mount + 이전 버튼** — 기존 자유 서술 `<section>`(:1617)을 조건으로 감싼다:

```tsx
        {(!usesSourceDiscovery || homeFlowStep === 'freewrite') && (
          <section className="hx-panel" aria-label="자유 서술 단계">
            {/* 기존 내용 전부 그대로 — 이전 버튼만 아래처럼 */}
          </section>
        )}
```

이전 버튼(:1664):

```tsx
              <button type="button" className="hx-btn-ghost" onClick={() => setHomeFlowStep(usesSourceDiscovery ? 'source' : 'medium')}>
                이전
              </button>
```

파킹 주석(:1667)은 삭제하고 「인터뷰로 계속」 CTA 는 그대로 유지.

**(i) 프리셋 갈래 패널** — 자유 서술 패널 직후·인터뷰 패널 직전에 삽입:

```tsx
        {usesSourceDiscovery && homeFlowStep === 'preset' && (
          <section className="hx-panel" aria-label="인기 프리셋 선택">
            <div className="hx-main">
              <p className="hx-eyebrow">02 · 인기 프리셋</p>
              <h1 className="hx-h1">인기 구성으로 바로 시작하세요.</h1>
              <p className="hx-lead">고르면 인물과 첫 장면이 채워진 채 플레이가 열립니다. 설정은 플레이하며 얼마든지 달라질 수 있어요.</p>
              <div className="hx-preset-grid">
                {STORY_PRESETS.map((preset) => (
                  <button key={preset.id} type="button" className="hx-preset-card" onClick={() => pickStoryPreset(preset)}>
                    <strong>{preset.title}</strong>
                    <p>{preset.hook}</p>
                  </button>
                ))}
              </div>
              <div className="hx-aside-actions">
                <button type="button" className="hx-btn-ghost" onClick={() => setHomeFlowStep('source')}>이전</button>
              </div>
            </div>
          </section>
        )}
```

**(j) playseed 패널 배선 갱신**(:2088-2108) — 상대 선택 props + onBack 을 프리셋 갈래로:

```tsx
              <PlaySeedPanel
                setup={playSetup}
                loading={playSeedLoading}
                error={playSeedError}
                loadingNote={`${formatElapsed(playSeedElapsed)} 경과 · 보통 1~2분 걸려요. 새로고침하지 마세요.`}
                presets={DIVE_SEED_CHARACTERS}
                partnerIndex={playPartnerIndex}
                onPickPartner={setPlayPartnerIndex}
                onPickPreset={(i) => {
                  setPlaySetup(presetToDiveSetup(DIVE_SEED_CHARACTERS[i]));
                  setPlayPartnerIndex(0);
                  setPlaySeedError('');
                }}
                onConfirm={confirmPlaySeed}
                onBack={() => setHomeFlowStep(usesSourceDiscovery ? 'preset' : 'freewrite')}
              />
```

- [ ] **Step 4: CSS 추가** — `src/styles.css`의 `.hx-playseed` 블록(7668~) 근처에 (라이트 `--nx-*` 토큰, `.hx-medium-card` 결):

```css
/* 소재발굴 갈래 카드 (S1) */
.home-page .hx-source-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 22px;
}
.home-page .hx-source-card {
  position: relative;
  padding: 20px;
  border: 1.5px solid var(--nx-hairline-strong);
  border-radius: var(--nx-r-lg);
  background: var(--nx-canvas);
  text-align: left;
  cursor: pointer;
  box-shadow: var(--nx-sh-subtle);
  transition: border-color 140ms, background 140ms, box-shadow 140ms;
}
.home-page .hx-source-card:hover:not(:disabled) {
  border-color: rgba(100, 72, 211, 0.38);
  box-shadow: var(--nx-sh-card);
}
.home-page .hx-source-card:disabled {
  cursor: default;
  opacity: 0.55;
}
.home-page .hx-source-card strong {
  display: block;
  font-size: 15px;
  margin-bottom: 6px;
}
.home-page .hx-source-card p {
  margin: 0;
  font-size: 12.5px;
  color: var(--nx-ink-mute);
  line-height: 1.55;
}
.home-page .hx-source-soon {
  position: absolute;
  top: 14px;
  right: 14px;
  font-size: 10.5px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--nx-hairline-strong);
  color: var(--nx-ink-mute);
}
/* 인기 프리셋 카드 (S1) */
.home-page .hx-preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
  margin-top: 22px;
  margin-bottom: 18px;
}
.home-page .hx-preset-card {
  padding: 18px;
  border: 1.5px solid var(--nx-hairline-strong);
  border-radius: var(--nx-r-lg);
  background: var(--nx-canvas);
  text-align: left;
  cursor: pointer;
  box-shadow: var(--nx-sh-subtle);
  transition: border-color 140ms, background 140ms, box-shadow 140ms;
}
.home-page .hx-preset-card:hover {
  border-color: rgba(100, 72, 211, 0.38);
  box-shadow: var(--nx-sh-card);
}
.home-page .hx-preset-card strong {
  display: block;
  font-size: 14px;
  margin-bottom: 6px;
}
.home-page .hx-preset-card p {
  margin: 0;
  font-size: 12.5px;
  color: var(--nx-ink-mute);
  line-height: 1.55;
}
/* playseed 대화 상대 선택 (S1) */
.home-page .hx-playseed-partner {
  display: block;
  width: 100%;
  padding: 10px 12px;
  margin-top: 8px;
  border: 1.5px solid var(--nx-hairline-strong);
  border-radius: var(--nx-r-lg);
  background: var(--nx-canvas);
  text-align: left;
  cursor: pointer;
  font-size: 12.5px;
  transition: border-color 140ms, background 140ms;
}
.home-page .hx-playseed-partner.is-selected {
  border-color: var(--nx-primary);
  background: var(--nx-tint-lavender);
}
.home-page .hx-playseed-partner em {
  color: var(--nx-ink-mute);
  font-style: normal;
}
```

주의 — `--nx-r-lg`·`--nx-sh-subtle`·`--nx-tint-lavender`·`--nx-ink-mute` 등 토큰명은 `.hx-medium-card`(7488~) 블록에서 실물을 확인하고 동일하게 사용(추측 금지, 없는 토큰이면 이웃이 쓰는 실제 토큰으로 교체).

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/appExperience.test.ts src/components/playSeedPanel.test.ts && npx tsc --noEmit`
Expected: PASS — 핀 신규 통과 + 타입 클린(Task 4 의 미배선 tsc 부채 해소)

- [ ] **Step 6: Run full gate**

Run: `bash init.sh`
Expected: 전체 녹색

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/appExperience.test.ts src/styles.css
git commit -m "feat(onboarding): 소설류 소재발굴 선택 스텝 + 인기 프리셋 갈래 — playseed 재배선·상대 선택 (S1)"
```

---

### Task 6: 라이브 검증 (편집장 직접 — preview MCP)

**Files:** 없음 (코드 변경 0 — 발견 시 별도 수정)

- [ ] **Step 1:** `preview_start(name="story-x")` (포트 5175) → 브라우저에서 localStorage 완전 초기화 후 fresh reload.
- [ ] **Step 2:** 랜딩 → 창작 시작 → 매체 소설 선택 → 「소재발굴로 계속」 → 3장 카드 렌더(함께 구상 비활성 「준비 중」) 확인.
- [ ] **Step 3:** 인기 프리셋 → 프리셋 5장 카드 → 하나 선택 → playseed 확인 카드(첫 장면·내 역할·대화 상대 버튼 그룹, 기본 첫 번째 선택) → 상대를 두 번째 인물로 바꿔 선택 → 「이대로 시작」 → dive 진입 확인(세션 상대가 고른 인물).
- [ ] **Step 4:** dive 에서 1턴 대화(실 codex ~30-50초) — 상대역 코헤런트 응답 확인.
- [ ] **Step 5:** 새로고침 복원 — preset 패널에서 새로고침 → preset 스텝 복원, playseed 에서 새로고침 → playseed 복원(playSetup 캐시). 
- [ ] **Step 6:** 자유 서술 갈래 회귀 — 소재발굴 → 자유 서술 → 「인터뷰로 계속」 정상. 이전 버튼이 소재발굴로 복귀.
- [ ] **Step 7:** 비소설 회귀 — 매체 에세이 선택 → 「자유 서술로 계속」(소재발굴 스텝 없음) → 기존 경로 그대로.
- [ ] **Step 8:** 전 구간 콘솔 에러 0 (`read_console_messages` onlyErrors).
- 검증 팁 — React 클릭은 `dispatchEvent(bubbles:true)`, 같은 tick DOM 읽기는 stale(별도 호출 재확인).

---

## Self-Review 결과

- 스펙 커버리지 — StoryPreset 5종(T1)·partnerIndex(T2)·isHomeFlowStep+shape 가드(T3)·상대 선택 UI(T4)·선택 스텝/프리셋 패널/핀 갱신/CSS(T5)·라이브(T6). 스펙의 "cast에 myRole 미포함" 테스트는 T1에 포함.
- 타입 일관성 — `StoryPreset`(T1) ↔ `pickStoryPreset(preset: StoryPreset)`(T5) · `partnerIndex`(T2 함수·T4 props·T5 배선) 이름 일치.
- 갈래 패널 인덱스 — 조건부 mount 로 DOM 인덱스=homeFlowIndex 정합(소설: medium0·source1·갈래2·intake3(갈래 unmount 시 2)·charter3·playseed/building=buildingPanelIndex 3). 인디케이터는 indicatorId 로 갈래를 source 에 접어 forward-skip(인터뷰 직행) 방지.
