import { useCallback, useEffect, useMemo, useState } from 'react';
import type Konva from 'konva';
import { Download, Package, TriangleAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEditor, selectProject } from '@/lib/store/editor';
import { FORMAT_IDS, getFormat, formatDimensions } from '@/config/formats';
import type { FormatId } from '@/lib/model/types';
import { ExportStage } from '@/components/canvas/ExportStage';
import { preloadProjectImages } from '@/lib/render/imageCache';
import { waitForProjectFonts, isFontLoaded } from '@/lib/render/fontsReady';
import { encodeJpg, encodePng } from '@/lib/export/encode';
import { exportFileName } from '@/lib/export/naming';
import { downloadBlob, downloadZip } from '@/lib/export/zip';
import {
  assetMetaFrom,
  contrastWarnings,
  staticChecklist,
  type ChecklistWarning,
} from '@/lib/export/checklist';
import { collectProjectAssets } from '@/lib/export/projectFile';
import { SliderField } from '@/components/inspector/controls';
import { cn } from '@/lib/utils';

// Diálogo de exportação (§11). Fluxo: preload de imagens + fontes prontas →
// monta os três ExportStages ocultos → cada um pronto vira canvas em tamanho
// real → checklist (estático + contraste sobre os pixels) → PNG/JPG individual
// ou ZIP dos três. Avisos NUNCA bloqueiam.

type Phase = 'preparing' | 'ready' | 'exporting' | 'error';

export function ExportDialog() {
  const open = useEditor((s) => s.exportOpen);
  const setOpen = useEditor((s) => s.setExportOpen);
  const project = useEditor(selectProject);

  const [phase, setPhase] = useState<Phase>('preparing');
  const [error, setError] = useState<string | null>(null);
  const [canvases, setCanvases] = useState<Partial<Record<FormatId, HTMLCanvasElement>>>({});
  const [warnings, setWarnings] = useState<ChecklistWarning[]>([]);
  const [type, setType] = useState<'jpg' | 'png'>('jpg');
  const [advanced, setAdvanced] = useState(false);
  const [quality, setQuality] = useState(92);

  // Congela o projeto no momento da abertura — edições durante o diálogo não
  // rasgam o export no meio.
  const [frozen, setFrozen] = useState(project);
  useEffect(() => {
    if (open && project) {
      setFrozen(project);
      setCanvases({});
      setWarnings([]);
      setError(null);
      setPhase('preparing');
      void (async () => {
        try {
          await preloadProjectImages(project);
          const fonts = await waitForProjectFonts(project);
          if (fonts.some((f) => !f.loaded)) {
            // vira aviso no checklist; não bloqueia (§11)
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Falha ao preparar o export.');
          setPhase('error');
        }
      })();
    }
  }, [open, project]);

  const onStageReady = useCallback((formatId: FormatId, stage: Konva.Stage) => {
    const canvas = stage.toCanvas({ pixelRatio: 1 });
    setCanvases((prev) => ({ ...prev, [formatId]: canvas }));
  }, []);

  // Todos os canvases prontos → checklist completo (estático + contraste real).
  useEffect(() => {
    if (!open || !frozen) return;
    if (FORMAT_IDS.some((id) => !canvases[id])) return;
    void (async () => {
      const assets = await collectProjectAssets(frozen);
      const statics = staticChecklist(frozen.layouts, assetMetaFrom(assets), isFontLoaded);
      const contrast = FORMAT_IDS.flatMap((id) =>
        contrastWarnings(canvases[id]!, frozen.layouts[id], id),
      );
      setWarnings([...statics, ...contrast]);
      setPhase('ready');
    })();
  }, [open, frozen, canvases]);

  const encode = useCallback(
    async (canvas: HTMLCanvasElement) => {
      if (type === 'png') return encodePng(canvas);
      return encodeJpg(canvas, advanced ? quality / 100 : undefined);
    },
    [type, advanced, quality],
  );

  async function exportOne(formatId: FormatId) {
    const canvas = canvases[formatId];
    if (!canvas || !frozen) return;
    setPhase('exporting');
    try {
      const blob = await encode(canvas);
      downloadBlob(blob, exportFileName(frozen.name, formatId, type));
      setPhase('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao exportar.');
      setPhase('error');
    }
  }

  async function exportAll() {
    if (!frozen) return;
    setPhase('exporting');
    try {
      const entries = [];
      for (const id of FORMAT_IDS) {
        entries.push({ formatId: id, blob: await encode(canvases[id]!) });
      }
      await downloadZip(frozen.name, entries, type);
      setPhase('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar o ZIP.');
      setPhase('error');
    }
  }

  const previews = useMemo(
    () =>
      FORMAT_IDS.map((id) => ({
        id,
        format: getFormat(id),
        url: canvases[id]?.toDataURL('image/jpeg', 0.6),
      })),
    [canvases],
  );

  if (!frozen) return null;
  const destaqueCount = warnings.filter((w) => w.severity === 'destaque').length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exportar</DialogTitle>
          <DialogDescription>
            Os três formatos em tamanho real (1080px), prontos para subir na Meta.
          </DialogDescription>
        </DialogHeader>

        {/* Palcos ocultos de export — só enquanto o diálogo está aberto. */}
        {open &&
          FORMAT_IDS.map((id) =>
            canvases[id] ? null : (
              <ExportStage key={id} formatId={id} layout={frozen.layouts[id]} onReady={onStageReady} />
            ),
          )}

        <div className="grid grid-cols-3 gap-3">
          {previews.map(({ id, format, url }) => (
            <div key={id} className="flex flex-col items-center gap-1.5">
              <div className="grid h-40 w-full place-items-center rounded-md border border-hairline bg-elevated/50 p-2">
                {url ? (
                  <img src={url} alt={format.label} className="h-36 w-full object-contain drop-shadow-sm" />
                ) : (
                  <span className="text-xs text-mute">Renderizando…</span>
                )}
              </div>
              <span className="text-xs text-mute">
                {format.label} · {formatDimensions(id)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!url || phase === 'exporting'}
                onClick={() => void exportOne(id)}
              >
                <Download /> {type.toUpperCase()}
              </Button>
            </div>
          ))}
        </div>

        {warnings.length > 0 && (
          <div className="max-h-36 overflow-y-auto rounded-md border border-hairline bg-elevated/40 p-2">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-warning-deep">
              <TriangleAlert className="size-3.5" />
              {warnings.length} {warnings.length === 1 ? 'aviso' : 'avisos'} — não bloqueiam a exportação
            </p>
            <ul className="space-y-1">
              {warnings.map((w, i) => (
                <li
                  key={i}
                  className={cn(
                    'text-xs',
                    w.severity === 'destaque'
                      ? 'font-medium text-danger-deep'
                      : w.severity === 'info'
                        ? 'text-mute'
                        : 'text-body',
                  )}
                >
                  {w.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-md border border-hairline-strong/60">
              {(['jpg', 'png'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  aria-pressed={type === t}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors',
                    type === t ? 'bg-emerald-soft text-emerald-deep' : 'text-mute hover:bg-ink/10',
                  )}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
            {type === 'jpg' && (
              <button className="text-xs text-mute underline-offset-2 hover:underline" onClick={() => setAdvanced(!advanced)}>
                Avançado
              </button>
            )}
          </div>

          <Button
            variant="cta"
            disabled={phase !== 'ready' || FORMAT_IDS.some((id) => !canvases[id])}
            onClick={() => void exportAll()}
            title={destaqueCount > 0 ? 'Há placeholders vazios — confira os avisos' : undefined}
          >
            <Package /> {phase === 'exporting' ? 'Exportando…' : 'Exportar os 3 (ZIP)'}
          </Button>
        </div>

        {advanced && type === 'jpg' && (
          <div className="flex items-center gap-3 text-xs text-mute">
            <span className="shrink-0">Qualidade JPG</span>
            <SliderField value={quality} min={50} max={100} onLive={setQuality} onEnd={() => {}} />
            <span className="shrink-0">Sem ajuste: 0.92 com fallback automático até caber em 30MB.</span>
          </div>
        )}

        {error && <p className="text-sm text-danger-deep">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
