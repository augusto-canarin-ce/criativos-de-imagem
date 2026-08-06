// Datas legíveis em português do Brasil. SPEC §13: interface em pt-BR.

const relativeFmt = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
const absoluteFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

/** "há 2 dias", "agora mesmo", ou data absoluta se passar de uma semana. */
export function relativeTime(timestamp: number, now: number = Date.now()): string {
  const diffMs = timestamp - now;
  const diffSec = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSec);

  if (absSec < 60) return 'agora mesmo';
  if (absSec < 3600) return relativeFmt.format(Math.round(diffSec / 60), 'minute');
  if (absSec < 86400) return relativeFmt.format(Math.round(diffSec / 3600), 'hour');
  if (absSec < 604800) return relativeFmt.format(Math.round(diffSec / 86400), 'day');
  return absoluteFmt.format(timestamp);
}
