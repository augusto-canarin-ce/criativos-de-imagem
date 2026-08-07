import { useId, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BUILTIN_FORMATS, DEFAULT_FORMAT } from '@/config/formats';
import type { FormatId } from '@/lib/model/types';
import { createAndSaveProject } from '@/lib/db/projects';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}

export function NewProjectDialog({ open, onOpenChange, onCreated }: Props) {
  const nameId = useId();
  const [name, setName] = useState('');
  const [baseFormat, setBaseFormat] = useState<FormatId>(DEFAULT_FORMAT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName('');
    setBaseFormat(DEFAULT_FORMAT);
    setError(null);
    setBusy(false);
  }

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      const project = await createAndSaveProject({ name, baseFormat });
      reset();
      onOpenChange(false);
      onCreated(project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o projeto.');
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleCreate();
          }}
          className="grid gap-4"
        >
          <DialogHeader>
            <DialogTitle>Novo projeto</DialogTitle>
            <DialogDescription>
              Escolha um nome e o formato onde você vai desenhar primeiro. Os outros dois
              se adaptam a partir dele.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <label htmlFor={nameId} className="text-sm font-medium">
              Nome
            </label>
            <Input
              id={nameId}
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Black Friday — frete grátis"
            />
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium">Formato base</span>
            <div className="grid grid-cols-3 gap-2">
              {BUILTIN_FORMATS.map((f) => {
                const active = f.id === baseFormat;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setBaseFormat(f.id)}
                    aria-pressed={active}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-md border p-3 text-center transition-colors',
                      active
                        ? 'border-emerald bg-emerald-soft'
                        : 'border-hairline hover:bg-ink/10',
                    )}
                  >
                    <span
                      className="rounded-sm border border-hairline bg-elevated"
                      style={{
                        width: 28,
                        height: (28 * f.height) / f.width,
                      }}
                    />
                    <span className="text-xs font-medium leading-tight">{f.label}</span>
                    <span className="text-[10px] text-mute">{f.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-danger-deep">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Criando…' : 'Criar projeto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
