// 스튜디오 설정 토큰 정적 데이터.

export const STUDIO_ACCENT_VALUES = {
  lime: { value: '#e4f222', label: '라임' },
  aether: { value: '#5e6ad2', label: '바이올렛' },
  emerald: { value: '#27a644', label: '에메랄드' },
  coral: { value: '#eb5757', label: '코랄' },
  amber: { value: '#d4a94d', label: '앰버' }
} as const;
export type StudioAccent = keyof typeof STUDIO_ACCENT_VALUES;

// 캔버스 = 스튜디오 창의 배경 톤 패밀리.
// shell: 바깥 페이지 / card: 좌·우 레일 카드 / page: 원고 영역 / paper2: 카드 안 셀·인풋
export const STUDIO_CANVAS_VALUES = {
  pitch: {
    shell: '#08090a',
    card: '#0f1011',
    page: '#161718',
    paper2: '#161718',
    surface: '#23252a',
    label: '피치 블랙'
  },
  graphite: {
    shell: '#0f1011',
    card: '#161718',
    page: '#1c1d1e',
    paper2: '#1c1d1e',
    surface: '#2a2c2e',
    label: '그래파이트'
  },
  indigo: {
    shell: '#14142a',
    card: '#18182f',
    page: '#1d1d2a',
    paper2: '#222230',
    surface: '#2a2a3d',
    label: '인디고 슬레이트'
  }
} as const;
export type StudioCanvas = keyof typeof STUDIO_CANVAS_VALUES;
