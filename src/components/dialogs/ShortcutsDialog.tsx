import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SHORTCUTS, type ShortcutDef } from '@/config/shortcuts';
import { cn } from '@/lib/utils';

// Modal de atalhos com `?` (§14). Renderiza de config/shortcuts.ts — a MESMA
// tabela que o código de atalhos usa, então o modal nunca diverge do que
// funciona. Atalhos de fases futuras aparecem marcados como "em breve" em vez de
// mentir que existem.

const GROUP_LABELS: Record<ShortcutDef['group'], string> = {
  ferramentas: 'Ferramentas',
  edição: 'Edição',
  pilha: 'Ordem das camadas',
  mover: 'Mover',
  visualização: 'Visualização',
  app: 'Aplicativo',
};

const ACTIVE_THROUGH_PHASE = 7;

function Keys({ keys }: { keys: string }) {
  return (
    <span className="flex flex-wrap justify-end gap-1">
      {keys.split(' / ').map((combo) => (
        <kbd
          key={combo}
          className="rounded border border-hairline-strong/60 bg-elevated px-1.5 py-0.5 font-mono text-[11px] text-ink"
        >
          {combo}
        </kbd>
      ))}
    </span>
  );
}

export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const groups = [...new Set(SHORTCUTS.map((s) => s.group))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atalhos</DialogTitle>
          <DialogDescription>
            No Windows e no Linux, troque <kbd className="font-mono">Cmd</kbd> por{' '}
            <kbd className="font-mono">Ctrl</kbd>.
          </DialogDescription>
        </DialogHeader>

        {groups.map((group) => (
          <div key={group} className="border-t border-hairline pt-3">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-mute">
              {GROUP_LABELS[group]}
            </h3>
            <ul className="space-y-1.5">
              {SHORTCUTS.filter((s) => s.group === group).map((s) => {
                const pending = s.phase > ACTIVE_THROUGH_PHASE;
                return (
                  <li key={s.keys} className="flex items-center justify-between gap-4">
                    <span className={cn('text-sm', pending ? 'text-faint' : 'text-body')}>
                      {s.label}
                      {pending && <span className="ml-2 text-[10px] uppercase">em breve</span>}
                    </span>
                    <Keys keys={s.keys} />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <p className="border-t border-hairline pt-3 text-xs text-mute">
          No redimensionamento: <kbd className="font-mono">Shift</kbd> trava a proporção,{' '}
          <kbd className="font-mono">Option</kbd> redimensiona a partir do centro, e os dois
          juntos fazem as duas coisas. <kbd className="font-mono">Option</kbd> durante o
          arraste desliga o encaixe.
        </p>
      </DialogContent>
    </Dialog>
  );
}
