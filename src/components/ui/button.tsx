import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Button no vocabulário do DS: pílula, primário "inverse" (fundo escuro no tema
// claro, claro no escuro), acento esmeralda só no foco e no CTA. A variante `cta`
// é a versão contida do shiny — reservada ao ponto de conversão da tela
// ("Exportar os 3"): um por tela, princípio de hierarquia por exceção.
//
// A variante `shiny` é o botão original do design system, com borda esmeralda
// giratória e pontilhado. Ela é da LANDING, não do editor: numa página de
// produto o botão é o assunto; numa tela de trabalho ele competiria com o
// criativo. Ela injeta dois <span> próprios, então não combina com `asChild` —
// use um <button> de verdade.

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium leading-none tracking-tight select-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-inverse text-on-inverse hover:opacity-90',
        cta: 'ds-cta',
        shiny: 'shiny-cta transform-gpu hover:-translate-y-0.5',
        destructive: 'bg-danger text-white hover:bg-danger/90',
        outline: 'ring-1 ring-inset ring-hairline-strong bg-transparent text-ink hover:bg-elevated',
        secondary: 'bg-elevated text-ink hover:bg-elevated/70',
        ghost: 'text-ink hover:bg-ink/10',
        link: 'text-emerald-deep underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-5 text-sm',
        sm: 'h-8 px-4 text-xs',
        lg: 'h-10 px-6 text-sm',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    // O shiny precisa de duas camadas: os pontos no fundo e o conteúdo por cima
    // do gradiente cônico. Com `asChild` quem manda no DOM é o filho, então a
    // embalagem não se aplica.
    const content =
      variant === 'shiny' && !asChild ? (
        <>
          <span className="shiny-dots" aria-hidden="true" />
          <span className="shiny-cta-content">{children}</span>
        </>
      ) : (
        children
      );
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {content}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
