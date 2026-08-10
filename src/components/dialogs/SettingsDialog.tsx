import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FORMAT_IDS, getFormat } from '@/config/formats';
import { SAFE_AREA_PROFILES } from '@/config/safeAreas';
import { useSettings } from '@/lib/store/settings';
import { usePreferences, applyTheme } from '@/lib/store/preferences';
import { applyExportPattern } from '@/lib/export/naming';
import { cn } from '@/lib/utils';

// Configurações (§15 Fase 7). Inclui as SAFE ZONES editáveis, que a §7 pede
// explicitamente: "a Meta muda a interface dos apps com frequência; tratar esses
// números como verdade eterna envelhece mal".

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: Props) {
  const theme = usePreferences((s) => s.theme);
  const setTheme = usePreferences((s) => s.setTheme);
  const settings = useSettings();
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    void navigator.storage?.estimate?.().then((e) => {
      if (e.usage != null && e.quota != null) setStorage({ usage: e.usage, quota: e.quota });
    });
  }, [open]);

  const usedPct = storage && storage.quota > 0 ? (storage.usage / storage.quota) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>
            Guardadas neste navegador. Nada aqui sai do seu computador.
          </DialogDescription>
        </DialogHeader>

        <Section title="Tema">
          <div className="flex gap-2">
            {(
              [
                ['dark', 'Escuro'],
                ['light', 'Claro'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm transition-colors',
                  theme === id
                    ? 'border-emerald bg-emerald-soft text-emerald-deep'
                    : 'border-hairline-strong/60 text-mute hover:bg-ink/10',
                )}
                onClick={() => {
                  setTheme(id);
                  applyTheme(id);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-mute">
            O escuro é o padrão de propósito: matiz na interface contamina a percepção das
            cores do criativo.
          </p>
        </Section>

        <Section title="Áreas seguras">
          <p className="mb-2 text-xs leading-relaxed text-mute">
            Margem que a interface da Meta costuma cobrir. Ajuste se a Meta mudar — o
            editor, os avisos e a adaptação entre formatos passam a usar os seus valores.
          </p>
          {FORMAT_IDS.map((id) => {
            const format = getFormat(id);
            const current = settings.safeAreas[id] ?? format.safeArea;
            const custom = !!settings.safeAreas[id];
            return (
              <div key={id} className="mb-2 rounded-md border border-hairline p-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium">
                    {format.label} <span className="text-mute">({id})</span>
                  </span>
                  {custom && (
                    <button
                      className="flex items-center gap-1 text-[11px] text-mute hover:text-ink"
                      onClick={() => settings.setSafeArea(id, null)}
                    >
                      <RotateCcw className="size-3" /> Voltar ao padrão
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                    <label key={side} className="block">
                      <span className="text-[10px] uppercase text-mute">
                        {{ top: 'Topo', right: 'Dir.', bottom: 'Base', left: 'Esq.' }[side]}
                      </span>
                      <Input
                        type="number"
                        className="h-8 text-xs"
                        value={current[side]}
                        onChange={(e) =>
                          settings.setSafeArea(id, {
                            ...current,
                            [side]: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
          {SAFE_AREA_PROFILES.map((p) => (
            <button
              key={p.id}
              className="text-xs text-emerald-deep hover:underline"
              onClick={settings.applyReelsProfile}
              title="A interface do Reels cobre mais da base e da lateral direita"
            >
              Aplicar {p.label.split('—')[1]?.trim() ?? p.label} no 9:16
            </button>
          ))}
        </Section>

        <Section title="Exportação">
          <label className="block">
            <span className="text-xs text-mute">Nome do arquivo</span>
            <Input
              value={settings.exportPattern}
              onChange={(e) => settings.setExportPattern(e.target.value)}
              className="h-8 font-mono text-xs"
            />
          </label>
          <p className="mt-1 text-[11px] text-mute">
            Marcadores: <code className="text-ink">{'{projeto}'}</code>{' '}
            <code className="text-ink">{'{formato}'}</code>{' '}
            <code className="text-ink">{'{n}'}</code> — sai como{' '}
            <span className="text-ink">
              {applyExportPattern(settings.exportPattern, 'Black Friday', '4:5', 1)}.jpg
            </span>
          </p>
          <label className="mt-3 block">
            <span className="text-xs text-mute">Qualidade JPG padrão: {settings.jpgQuality}</span>
            <input
              type="range"
              min={50}
              max={100}
              value={settings.jpgQuality}
              onChange={(e) => settings.setJpgQuality(Number(e.target.value))}
              className="h-1 w-full cursor-pointer accent-[var(--color-emerald-500)]"
            />
          </label>
        </Section>

        <Section title="Armazenamento">
          {storage ? (
            <>
              <div className="h-2 w-full overflow-hidden rounded-full bg-elevated">
                <div
                  className={cn('h-full rounded-full', usedPct > 80 ? 'bg-warning' : 'bg-emerald')}
                  style={{ width: `${Math.min(100, Math.max(1, usedPct))}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-mute">
                {formatBytes(storage.usage)} de {formatBytes(storage.quota)} usados neste
                navegador ({usedPct.toFixed(1)}%).
              </p>
            </>
          ) : (
            <p className="text-xs text-mute">Este navegador não informa o espaço usado.</p>
          )}
          <p className="mt-2 text-xs leading-relaxed text-mute">
            Projetos e imagens ficam no armazenamento deste navegador. Limpar os dados do
            site apaga tudo — use “Exportar todos” na tela de projetos para guardar uma
            cópia fora daqui.
          </p>
        </Section>

        <div className="flex justify-end border-t border-hairline pt-3">
          <Button variant="ghost" size="sm" onClick={settings.resetAll}>
            <RotateCcw /> Restaurar padrões
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-hairline pt-3">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-mute">{title}</h3>
      {children}
    </div>
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
