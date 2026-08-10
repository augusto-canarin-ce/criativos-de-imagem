import { useEffect, useRef, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

// DotGrid — portado do design system "Conversão Extrema" v2.1. Fundo de pontos
// sutis (na tinta do tema) que ganham tom esmeralda num spotlight radial ao
// redor do cursor.
//
// Zero requisição externa (SPEC §3): a grade é gradiente CSS, não imagem.
// O spotlight só liga em ponteiro de verdade — em toque não existe hover, e
// registrar mousemove no celular seria custo sem efeito.

interface Props {
  /** Espaçamento da grade, em px. */
  size?: number;
  /** Raio do brilho esmeralda ao redor do cursor, em px. */
  radius?: number;
  className?: string;
}

export function DotGrid({ size = 24, radius = 220, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia('(hover: hover)').matches) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    // some o brilho quando o cursor sai da janela
    const onLeave = () => {
      el.style.setProperty('--mx', '-9999px');
      el.style.setProperty('--my', '-9999px');
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  // Raio dos pontos temável (--dot-r/--dot-r-fade em styles/index.css): menor
  // no tema claro, padrão no escuro.
  const dots = (color: string, alpha: number) =>
    `radial-gradient(circle, rgb(${color} / ${alpha}) var(--dot-r, 1px), transparent var(--dot-r-fade, 1.6px))`;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{ '--mx': '-9999px', '--my': '-9999px' } as CSSProperties}
    >
      {/* Pontos base, bem sutis — usam a tinta do tema */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: dots('var(--c-ink)', 0.05),
          backgroundSize: `${size}px ${size}px`,
        }}
      />
      {/* Pontos esmeralda revelados só num raio suave ao redor do cursor */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(16,185,129,0.45) var(--dot-r, 1px), transparent var(--dot-r-fade, 1.6px))',
          backgroundSize: `${size}px ${size}px`,
          WebkitMaskImage: `radial-gradient(${radius}px circle at var(--mx) var(--my), #000 0%, transparent 65%)`,
          maskImage: `radial-gradient(${radius}px circle at var(--mx) var(--my), #000 0%, transparent 65%)`,
        }}
      />
    </div>
  );
}
