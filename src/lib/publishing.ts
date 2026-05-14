import type { CreativeBlueprint } from './projectBlueprint';
import type { SeriesProject } from './storyEngine';

export type PublishingMode = 'serial-episode' | 'essay-piece' | 'storyboard-package' | 'future-package';
export type PublishingChecklistStatus = 'ready' | 'review';

export interface PublishingChecklistItem {
  id: string;
  label: string;
  status: PublishingChecklistStatus;
  detail: string;
}

export interface PublishingPlan {
  mode: PublishingMode;
  title: string;
  platformProof: string;
  releaseNotice: string;
  excerpt: string;
  checklist: PublishingChecklistItem[];
  snapshotItems: string[];
  changeLogReview: string[];
  packageItems: string[];
}

export function buildPublishingPlan(project: SeriesProject, blueprint: CreativeBlueprint): PublishingPlan {
  const latestChapter = project.chapters[project.chapters.length - 1] ?? null;
  const proofText = (latestChapter?.prose ?? project.logline).replace(/\s+/g, ' ').trim();
  const excerpt = proofText.length > 300 ? `${proofText.slice(0, 300)}...` : proofText;
  const releaseTarget = latestChapter ? `${latestChapter.episode}화 · ${latestChapter.title}` : '초안 없음';

  if (blueprint.medium === 'essay') {
    return {
      mode: 'essay-piece',
      title: `${blueprint.formatLabel} 출간 준비`,
      platformProof: `첫 300자 미리보기: ${excerpt}`,
      releaseNotice: '에세이는 출간 전에 실제 인물 보호, 개인정보, 문체 일관성을 먼저 확인합니다.',
      excerpt,
      checklist: [
        {
          id: 'privacy',
          label: '개인정보/실제 인물 거리',
          status: 'review',
          detail: '이름, 장소, 직업, 관계처럼 독자가 특정할 수 있는 단서를 확인합니다.'
        },
        {
          id: 'voice',
          label: '문체 일관성',
          status: 'ready',
          detail: '문체 바이블과 어긋나는 번역투, 과장, AI식 표현을 줄입니다.'
        },
        {
          id: 'reader-promise',
          label: '독자 약속',
          status: 'ready',
          detail: '개인 경험이 독자에게 어떤 질문이나 여운으로 도착하는지 점검합니다.'
        }
      ],
      snapshotItems: ['출간본 스냅샷', '문체 샘플', '익명화 메모'],
      changeLogReview: ['변경 로그 검토', '실제 인물 보호 영향 범위', '문체 리팩터 영향 범위'],
      packageItems: ['본문 원고', '소개 문구', '낭독 전환 후보']
    };
  }

  if (blueprint.medium === 'comics') {
    return {
      mode: 'storyboard-package',
      title: `${blueprint.formatLabel} 스토리보드 출간 준비`,
      platformProof: `첫 3컷 스토리보드: ${latestChapter?.outline.slice(0, 3).join(' / ') ?? '초안 생성 후 구성됩니다.'}`,
      releaseNotice: '현재 알파에서는 만화 출간을 콘티와 스토리보드 패키지까지 준비합니다. 이미지 생성은 후속 단계입니다.',
      excerpt,
      checklist: [
        {
          id: 'cut-function',
          label: '컷 기능',
          status: 'ready',
          detail: '각 컷이 선택, 갈등, 관계 변화, 복선 회수 중 무엇을 맡는지 확인합니다.'
        },
        {
          id: 'bubble-density',
          label: '말풍선 밀도',
          status: 'review',
          detail: '모바일 화면에서 대사량과 읽는 순서가 컷을 덮지 않는지 봅니다.'
        },
        {
          id: 'visual-bible',
          label: '시각 바이블 후보',
          status: 'review',
          detail: '완성 이미지가 아니라 캐릭터/배경/무드의 기준 후보만 저장합니다.'
        }
      ],
      snapshotItems: ['스토리보드 스냅샷', '컷 기능표', '말풍선 검토 메모'],
      changeLogReview: ['변경 로그 검토', '캐릭터 외형 후보 영향 범위', '컷 순서 영향 범위'],
      packageItems: ['첫 3컷 스토리보드', '말풍선 밀도표', '컷별 연출 메모', '이미지 프롬프트 후속 후보']
    };
  }

  if (blueprint.medium === 'audiobook') {
    return {
      mode: 'future-package',
      title: `${blueprint.formatLabel} 오디오 패키지 준비`,
      platformProof: `첫 30초 낭독 증거: ${excerpt}`,
      releaseNotice: '오디오북과 영상 생성은 후속 확장 단계이며, 지금은 낭독 톤과 자막 흐름을 설계합니다.',
      excerpt,
      checklist: [
        {
          id: 'narration',
          label: '낭독 리듬',
          status: 'review',
          detail: '목소리 톤, 쉼, 강조, 청취 피로를 확인합니다.'
        }
      ],
      snapshotItems: ['낭독 스냅샷', '자막 흐름', '음악 큐'],
      changeLogReview: ['변경 로그 검토', '문체/낭독 영향 범위'],
      packageItems: ['내레이션 원고', '첫 30초 증거', '음악 큐 후보']
    };
  }

  return {
    mode: 'serial-episode',
    title: `${releaseTarget} 출간 준비`,
    platformProof: `첫 300자 미리보기: ${excerpt}`,
    releaseNotice: '출간 뒤 수정은 변경 로그로 남기고, 캐논 리팩터가 기존 회차와 다음 전개에 미치는 영향을 검토합니다.',
    excerpt,
    checklist: [
      {
        id: 'proof',
        label: '첫 300자',
        status: 'ready',
        detail: '플랫폼 목록에서 독자가 클릭할 수 있는 시작 문장을 확인합니다.'
      },
      {
        id: 'canon',
        label: '캐논 충돌',
        status: 'review',
        detail: '출간본 기준으로 인물, 세계 규칙, 타임라인 충돌을 다시 봅니다.'
      },
      {
        id: 'next-hook',
        label: '다음 화 질문',
        status: 'ready',
        detail: '이번 회차의 마지막 질문이 다음 회차 제작 브리프로 이어지는지 확인합니다.'
      }
    ],
    snapshotItems: ['회차 출간 스냅샷', '첫 300자', '새 캐논 후보', '다음 화 질문'],
    changeLogReview: ['변경 로그 검토', '캐논 리팩터 영향 범위', '기존 회차 충돌', '앞으로 전개 조언'],
    packageItems: ['본문 원고', '플랫폼 소개 문구', '웹툰/동화책 전환 후보', '오디오북 제안']
  };
}
