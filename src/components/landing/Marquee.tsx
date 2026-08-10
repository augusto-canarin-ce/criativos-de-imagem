import { Children, type ReactNode, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

// Marquee — portado do design system "Conversão Extrema" v2.1. Carrossel
// horizontal em loop contínuo, sem JS de scroll: o conteúdo é duplicado e a
// animação corre até -50%, onde a segunda cópia está exatamente sobre a
// primeira. Pausa quando o mouse entra; com prefers-reduced-motion não anima
// (regra em styles/index.css).
//
// A cópia duplicada é aria-hidden: quem usa leitor de tela ouve a lista uma vez.

interface Props {
  children: ReactNode;
  /** Duração de uma volta, em segundos (quanto maior, mais lento). */
  duration?: number;
  gapClass?: string;
  fade?: boolean;
  className?: string;
}

export function Marquee({
  children,
  duration = 30,
  gapClass = 'mr-10',
  fade = true,
  className,
}: Props) {
  const items = Children.toArray(children);

  const row = (dup: 'a' | 'b') =>
    items.map((child, i) => (
      <div
        key={`${dup}-${i}`}
        className={cn('shrink-0', gapClass)}
        aria-hidden={dup === 'b' ? 'true' : undefined}
      >
        {child}
      </div>
    ));

  return (
    <div
      className={cn('group relative w-full overflow-hidden', className)}
      style={
        fade
          ? {
              maskImage:
                'linear-gradient(to right, transparent, black 4rem, black calc(100% - 4rem), transparent)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent, black 4rem, black calc(100% - 4rem), transparent)',
            }
          : undefined
      }
    >
      <div
        className="flex w-max animate-marquee items-stretch group-hover:[animation-play-state:paused]"
        style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
      >
        {row('a')}
        {row('b')}
      </div>
    </div>
  );
}
