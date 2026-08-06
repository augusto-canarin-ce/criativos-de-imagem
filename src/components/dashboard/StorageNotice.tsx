import { useState } from 'react';
import { HardDrive, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const KEY = 'criativos:storage-notice-dismissed';

// Aviso honesto na primeira execução — não escondido nas configurações. SPEC §12.
// Os projetos ficam neste navegador; limpar os dados do site apaga tudo; há backup.
export function StorageNotice() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(KEY) === '1');
  if (dismissed) return null;

  function dismiss() {
    localStorage.setItem(KEY, '1');
    setDismissed(true);
  }

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
      <HardDrive className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <p className="flex-1 text-muted-foreground">
        Seus projetos ficam salvos <strong className="text-foreground">neste navegador</strong>{' '}
        e nunca saem dele. Limpar os dados do site apaga tudo — a exportação de backup
        (em breve) leva seu trabalho para outro lugar com segurança.
      </p>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        onClick={dismiss}
        aria-label="Dispensar aviso"
      >
        <X />
      </Button>
    </div>
  );
}
