import * as React from 'react';
import { cn } from '@/lib/utils';

// Input com a forma dirigida pelo contexto (--ds-input-*): pílula em superfície
// aberta, canto discreto e 36px dentro de `.ds-app` — quem calibra é o escopo,
// não o componente.

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex w-full border border-hairline-strong/60 bg-surface text-sm text-ink transition-colors',
          'h-[var(--ds-input-height)] rounded-[var(--ds-input-radius)] px-[var(--ds-input-px)] py-1',
          'placeholder:text-faint',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40 focus-visible:border-emerald/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
