import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TOTAL_PASSOS } from '@/lib/guided/steps';

// Peças de interface do modo guiado (SPEC §18). Tudo aqui é maior do que no
// editor de propósito: alvos grandes, texto grande, uma decisão por tela.
//
// Estas peças NÃO usam o escopo `.ds-app` — ele densifica a interface para
// trabalho, e aqui vale exatamente o contrário.

export function Progresso({ passo, label }: { passo: number; label: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-mute">{label}</span>
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: TOTAL_PASSOS }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              i + 1 < passo ? 'bg-emerald' : i + 1 === passo ? 'bg-emerald' : 'bg-elevated',
              i + 1 > passo && 'opacity-70',
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** Pergunta da tela. É o único título — não competir com ela é o ponto. */
export function Pergunta({ children, dica }: { children: ReactNode; dica?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-tight tracking-tight text-ink">
        {children}
      </h1>
      {dica && <p className="mt-3 text-lg leading-relaxed text-mute">{dica}</p>}
    </div>
  );
}

/** Botão grande do fluxo. `tom="igual"` é para o par avançar/pular do passo 3,
 *  onde os dois precisam ter o mesmo peso visual (§18). */
export function BotaoGrande({
  children,
  onClick,
  tom = 'principal',
  disabled,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  tom?: 'principal' | 'igual' | 'discreto';
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-8 text-lg font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        'disabled:cursor-not-allowed disabled:opacity-40',
        tom === 'principal' && 'bg-emerald text-white hover:bg-emerald-600',
        tom === 'igual' && 'border border-hairline-strong bg-surface text-ink hover:bg-elevated',
        tom === 'discreto' && 'text-mute hover:bg-ink/5 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

export function Avancar({
  onClick,
  disabled,
  label = 'Continuar',
  motivo,
  tom = 'principal',
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  motivo?: string;
  tom?: 'principal' | 'igual';
}) {
  return (
    <div className="flex flex-col items-start gap-2">
      <BotaoGrande onClick={onClick} disabled={disabled} tom={tom}>
        {label} <ArrowRight className="size-5" />
      </BotaoGrande>
      {disabled && motivo && <span className="text-sm text-mute">{motivo}</span>}
    </div>
  );
}

export function Voltar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-base text-mute transition-colors hover:bg-ink/5 hover:text-ink"
    >
      <ArrowLeft className="size-4" /> Voltar
    </button>
  );
}

/** Aviso gentil: diz a consequência prática, nunca o número (§18). */
export function AvisoGentil({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 text-base leading-relaxed text-warning-deep">
      {children}
    </p>
  );
}

export function Feito({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 flex items-center gap-2 text-base text-emerald-deep">
      <Check className="size-4 shrink-0" /> {children}
    </p>
  );
}
