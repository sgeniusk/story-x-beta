import { CSSProperties } from 'react';

/**
 * 단순 pixel-art 식 아바타. CSS gradient 만으로 그린다 — 외부 이미지 없음.
 * tint 는 CSS var --av-bg 로 흘려보낸다. 다른 컴포넌트가 이 컴포넌트를
 * 다양한 크기로 쓰므로 className 만 받고 크기는 받는 쪽에서 결정한다.
 */
interface Props {
  tint: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

export function PixelAvatar({ tint, className = '', style, title }: Props) {
  return (
    <span
      className={`sx-px-av ${className}`}
      style={{ ['--av-bg' as string]: tint, ...style }}
      title={title}
      aria-label={title}
    />
  );
}
