import { describe, expect, it } from 'vitest';
import {
  buildChapterTextFilename,
  prepareChapterTextExport
} from './manuscriptExport';

describe('P1-b 회차 본문 반출', () => {
  it('저장 전 live 본문의 한국어·공백·줄바꿈을 그대로 보존한다', () => {
    const body = '  비가 내렸다.\n\n문은 아직 열려 있었다.  \n';

    expect(prepareChapterTextExport(body)).toEqual({
      status: 'ready',
      text: body
    });
  });

  it('공백뿐인 본문은 성공 payload로 만들지 않는다', () => {
    expect(prepareChapterTextExport(' \n\t ')).toEqual({ status: 'empty' });
  });

  it('작품·회차를 식별하되 경로 문자가 없는 결정적 TXT 파일명을 만든다', () => {
    const filename = buildChapterTextFilename(
      '달/문서고: 최종?',
      { episode: 7, title: '문을 열까* 말까 <초고>' }
    );

    expect(filename).toBe('storyx-달-문서고-최종-7화-문을-열까-말까-초고.txt');
    expect(filename).not.toMatch(/[\\/:?*"<>|]/);
  });

  it('빈 제목은 안전한 식별자로 강등하고 긴 조각을 제한한다', () => {
    const filename = buildChapterTextFilename(
      '가'.repeat(80),
      { episode: 1, title: '   ' }
    );

    expect(filename).toMatch(/^storyx-가{48}-1화-제목-없음\.txt$/);
  });
});
