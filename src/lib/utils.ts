import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Helper padrão do shadcn/ui: combina classes condicionais e resolve conflitos
 *  do Tailwind (a última classe vence). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
