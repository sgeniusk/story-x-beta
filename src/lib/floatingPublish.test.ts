// FloatingPublishWorkspace 가 출간 실데이터를 floating 셸 안에서 렌더하고 콜백 계약을 지키는지 검증.
import { describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FloatingPublishWorkspace, type FloatingPublishWorkspaceProps } from '../components/FloatingPublishWorkspace';
import { buildCreativeBlueprint } from './projectBlueprint';
import { buildPublishingPlan } from './publishing';
import { createSeedProject, lockChapter, produceNextChapter, type SeriesProject } from './storyEngine';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function projectWithChapter(): SeriesProject {
  const seed = createSeedProject();
  return produceNextChapter(seed, {
    genre: seed.genre,
    intent: '필사관이 금지된 이름을 빌려 첫 문장을 고친다',
    pressure: '출간 직전 캐논 승인과 다음 화 질문이 동시에 흔들린다'
  }).updatedProject;
}

function baseProps(over: Partial<FloatingPublishWorkspaceProps> = {}): FloatingPublishWorkspaceProps {
  const project = projectWithChapter();
  const blueprint = buildCreativeBlueprint({ medium: 'novel', format: 'long-novel' });
  return {
    project,
    blueprint,
    plan: buildPublishingPlan(project, blueprint),
    onBackToEditor: vi.fn(),
    onOpenBible: vi.fn(),
    onReviewDraft: vi.fn(),
    onConfirmChapterLock: vi.fn(),
    ...over
  };
}

function mount(props: FloatingPublishWorkspaceProps) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => { root.render(createElement(FloatingPublishWorkspace, props)); });
  return {
    host,
    unmount: () => { act(() => root.unmount()); host.remove(); },
    click: (el: Element | null) => act(() => {
      el?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    })
  };
}

describe('FloatingPublishWorkspace', () => {
  it('출간 준비 보드에 Platform Proof, 릴리즈 체크리스트, 산출물 패키지를 렌더한다', () => {
    const { host, unmount } = mount(baseProps());
    expect(host.querySelector('.fc-app.fc-publish')).not.toBeNull();
    expect(host.querySelector('.fc-publish-board')).not.toBeNull();
    expect(host.textContent).toContain('Platform Proof');
    expect(host.textContent).toContain('첫 300자');
    expect(host.textContent).toContain('출간 전 체크리스트');
    expect(host.textContent).toContain('산출물 패키지');
    unmount();
  });

  it('잠금 버튼이 최신 회차 id 로 onConfirmChapterLock 을 호출한다', () => {
    const onConfirmChapterLock = vi.fn();
    const props = baseProps({ onConfirmChapterLock });
    const latest = props.project.chapters.at(-1)!;
    const { host, click, unmount } = mount(props);
    click(host.querySelector('.fc-publish-lock-btn'));
    expect(onConfirmChapterLock).toHaveBeenCalledWith(latest.id);
    unmount();
  });

  it('최신 회차가 이미 locked 이면 잠금 버튼을 비활성화하고 lockedChip 을 보여준다', () => {
    const unlocked = projectWithChapter();
    const latest = unlocked.chapters.at(-1)!;
    const project = lockChapter(unlocked, latest.id);
    const blueprint = buildCreativeBlueprint({ medium: 'novel', format: 'long-novel' });
    const { host, unmount } = mount(baseProps({
      project,
      blueprint,
      plan: buildPublishingPlan(project, blueprint)
    }));
    const lockButton = host.querySelector('.fc-publish-lock-btn') as HTMLButtonElement;
    expect(lockButton.disabled).toBe(true);
    expect(lockButton.textContent).toContain('출간 확정됨');
    unmount();
  });

  it('편집으로 돌아가기와 바이블 열기 콜백을 호출한다', () => {
    const onBackToEditor = vi.fn();
    const onOpenBible = vi.fn();
    const { host, click, unmount } = mount(baseProps({ onBackToEditor, onOpenBible }));
    click(host.querySelector('.fc-publish-back-btn'));
    click(host.querySelector('.fc-publish-bible-btn'));
    expect(onBackToEditor).toHaveBeenCalledTimes(1);
    expect(onOpenBible).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('연재형은 N화, 단독형은 원고 라벨을 쓰고 만화 안내 문구를 유지한다', () => {
    const serialProps = baseProps();
    const serial = mount(serialProps);
    expect(serial.host.textContent).toContain(`${serialProps.project.chapters.at(-1)!.episode}화 기준`);
    serial.unmount();

    const essayProject = projectWithChapter();
    const essayBlueprint = buildCreativeBlueprint({ medium: 'essay', format: 'personal-essay' });
    const essay = mount(baseProps({
      project: essayProject,
      blueprint: essayBlueprint,
      plan: buildPublishingPlan(essayProject, essayBlueprint)
    }));
    expect(essay.host.textContent).toContain('원고 기준');
    essay.unmount();

    const comicsProject = projectWithChapter();
    const comicsBlueprint = buildCreativeBlueprint({ medium: 'comics', format: 'serial-webtoon' });
    const comics = mount(baseProps({
      project: comicsProject,
      blueprint: comicsBlueprint,
      plan: buildPublishingPlan(comicsProject, comicsBlueprint)
    }));
    expect(comics.host.textContent).toContain('만화는 스토리보드 패키지까지 준비');
    comics.unmount();
  });

  it('DataPanel 을 사용하지 않고 floating publish 전용 클래스를 둔다', () => {
    const src = readFileSync(resolve(__dirname, '../components/FloatingPublishWorkspace.tsx'), 'utf8');
    expect(src).not.toContain('DataPanel');
    expect(src).toContain('fc-publish');
  });
});
