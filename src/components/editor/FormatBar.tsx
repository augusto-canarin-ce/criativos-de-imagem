import { useState } from 'react';
import { Columns3, MoreHorizontal, Unlink, Link2, Crown } from 'lucide-react';
import {
  useEditor,
  selectProject,
  selectOverrideCount,
} from '@/lib/store/editor';
import { FORMAT_IDS, getFormat } from '@/config/formats';
import { describeRebase } from '@/lib/layout/rebase';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Barra de formatos (SPEC §13): abas 4:5 / 1:1 / 9:16, chip de base, estado de
// overrides do formato ativo com reconexão, desconectar/reconectar o formato e
// "Usar este formato como base…" com a confirmação que lista o efeito exato (§7).

type PendingAction = { kind: 'rebase' } | { kind: 'reattach' } | null;

export function FormatBar() {
  const project = useEditor(selectProject);
  const activeFormat = useEditor((s) => s.activeFormat);
  const setActiveFormat = useEditor((s) => s.setActiveFormat);
  const viewMode = useEditor((s) => s.viewMode);
  const setViewMode = useEditor((s) => s.setViewMode);
  const overrideCount = useEditor(selectOverrideCount);
  const revertAllOverrides = useEditor((s) => s.revertAllOverrides);
  const setDetached = useEditor((s) => s.setDetached);
  const setBaseFormat = useEditor((s) => s.setBaseFormat);
  const [pending, setPending] = useState<PendingAction>(null);

  if (!project) return null;
  const isBase = activeFormat === project.baseFormat;
  const activeLayout = project.layouts[activeFormat];
  const baseLabel = project.baseFormat;

  return (
    <div className="flex items-center gap-1 border-b border-hairline bg-surface px-2 py-1">
      {FORMAT_IDS.map((id) => {
        const format = getFormat(id);
        const active = id === activeFormat;
        const detached = project.layouts[id].detached;
        return (
          <button
            key={id}
            onClick={() => setActiveFormat(id)}
            aria-pressed={active}
            title={`${format.label} · ${format.width}×${format.height}`}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors',
              active ? 'bg-emerald-soft text-emerald-deep' : 'text-mute hover:bg-ink/10',
            )}
          >
            <span className="font-medium">{id}</span>
            {id === project.baseFormat && (
              <Crown className="size-3" aria-label="Formato base" />
            )}
            {detached && <Unlink className="size-3" aria-label="Desconectado" />}
          </button>
        );
      })}

      {/* Estado do formato ativo (derivado): overrides e reconexão. SPEC §7. */}
      {!isBase && overrideCount > 0 && (
        <div className="ml-2 flex items-center gap-1 text-xs text-mute">
          <span>
            {overrideCount === 1
              ? '1 camada editada neste formato'
              : `${overrideCount} camadas editadas neste formato`}
          </span>
          <button
            className="rounded px-1.5 py-0.5 text-emerald-deep hover:bg-emerald-soft"
            onClick={revertAllOverrides}
            title={`Reconectar todas ao ${baseLabel}`}
          >
            Reconectar todas
          </button>
        </div>
      )}

      {!isBase && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="ml-1 grid size-7 place-items-center rounded-md text-mute hover:bg-ink/10"
              aria-label="Ações do formato"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {activeLayout.detached ? (
              <DropdownMenuItem onSelect={() => setPending({ kind: 'reattach' })}>
                <Link2 /> Voltar a seguir o {baseLabel}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => setDetached(activeFormat, true)}>
                <Unlink /> Desconectar do formato base
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setPending({ kind: 'rebase' })}>
              <Crown /> Usar este formato como base…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <button
        onClick={() => setViewMode(viewMode === 'compare' ? 'single' : 'compare')}
        aria-pressed={viewMode === 'compare'}
        title="Comparar os três formatos"
        className={cn(
          'ml-auto flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors',
          viewMode === 'compare'
            ? 'bg-emerald-soft text-emerald-deep'
            : 'text-mute hover:bg-ink/10',
        )}
      >
        <Columns3 className="size-3.5" /> Comparar
      </button>

      {/* Confirmação de troca de base — texto exato dos efeitos (§7). */}
      <AlertDialog open={pending?.kind === 'rebase'} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usar {activeFormat} como base</AlertDialogTitle>
            <AlertDialogDescription>{describeRebase(project, activeFormat)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setBaseFormat(activeFormat);
                setPending(null);
              }}
            >
              Trocar a base
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação de reconexão de formato desconectado. */}
      <AlertDialog
        open={pending?.kind === 'reattach'}
        onOpenChange={(o) => !o && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Voltar a seguir o {baseLabel}</AlertDialogTitle>
            <AlertDialogDescription>
              O {activeFormat} será re-adaptado a partir do {baseLabel} e as diferenças
              feitas enquanto esteve desconectado serão perdidas. Dá para desfazer com
              um único Cmd+Z.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDetached(activeFormat, false);
                setPending(null);
              }}
            >
              Reconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
