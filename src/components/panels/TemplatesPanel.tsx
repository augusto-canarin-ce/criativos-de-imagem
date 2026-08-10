import { useEffect, useState } from 'react';
import { Stage, Layer as KonvaLayer } from 'react-konva';
import { Loader2, Trash2 } from 'lucide-react';
import type { Layout, Template } from '@/lib/model/types';
import { useEditor, selectProject } from '@/lib/store/editor';
import { getFormat } from '@/config/formats';
import {
  CATEGORY_LABELS,
  deleteUserTemplate,
  listUserTemplates,
  loadBuiltinTemplates,
  projectFromTemplate,
  saveProjectAsTemplate,
  templateFileJson,
} from '@/lib/db/templates';
import { db } from '@/lib/db/dexie';
import { goToEditor } from '@/lib/router';
import { downloadBlob } from '@/lib/export/zip';
import { slugify } from '@/lib/export/naming';
import { StageScene } from '@/components/canvas/StageScene';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Painel de MODELOS (§10). Abas "De fábrica" e "Meus". A miniatura usa a MESMA
// StageScene do editor e do export em escala reduzida — nada de um segundo
// caminho de desenho, e o placeholder aparece com o rótulo (que é o que faz o
// modelo se explicar sozinho).

const THUMB_W = 96;

function TemplateThumb({ layout }: { layout: Layout }) {
  const format = getFormat(layout.formatId);
  const scale = THUMB_W / format.width;
  return (
    <Stage
      width={THUMB_W}
      height={format.height * scale}
      listening={false}
      style={{ borderRadius: 6, overflow: 'hidden' }}
    >
      <KonvaLayer scaleX={scale} scaleY={scale}>
        <StageScene
          format={format}
          layout={layout}
          showSafeArea={false}
          interactive={false}
          chrome={false}
        />
      </KonvaLayer>
    </Stage>
  );
}

export function TemplatesPanel() {
  const project = useEditor(selectProject);
  const [tab, setTab] = useState<'builtin' | 'mine'>('builtin');
  const [builtin, setBuiltin] = useState<Template[] | null>(null);
  const [mine, setMine] = useState<Template[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [altHeld, setAltHeld] = useState(false);

  useEffect(() => {
    const sync = (e: KeyboardEvent) => setAltHeld(e.altKey);
    window.addEventListener('keydown', sync);
    window.addEventListener('keyup', sync);
    return () => {
      window.removeEventListener('keydown', sync);
      window.removeEventListener('keyup', sync);
    };
  }, []);

  useEffect(() => {
    void loadBuiltinTemplates()
      .then(setBuiltin)
      .catch((err) => {
        setBuiltin([]);
        setError(err instanceof Error ? err.message : 'Falha ao carregar os modelos.');
      });
    void listUserTemplates().then(setMine);
  }, []);

  async function apply(template: Template) {
    // Cria um projeto novo a partir do modelo, herdando a marca ativa — os
    // tokens do modelo já nascem com as cores e fontes do usuário (§10).
    const { project: fresh, firstPlaceholderId } = projectFromTemplate(template, {
      brandKitId: project?.brandKitId,
    });
    await db.projects.add(fresh);
    goToEditor(fresh.id);
    // O editor remonta pelo hash; a seleção do primeiro placeholder acontece
    // assim que o projeto carrega.
    if (firstPlaceholderId) {
      setTimeout(() => useEditor.getState().select([firstPlaceholderId]), 400);
    }
  }

  async function saveCurrent() {
    if (!project) return;
    const name = window.prompt('Nome do modelo', project.name);
    if (!name?.trim()) return;
    await saveProjectAsTemplate(project, name, 'promocao');
    setMine(await listUserTemplates());
    setTab('mine');
  }

  const list = tab === 'builtin' ? builtin : mine;

  return (
    <div className="p-3">
      <div className="mb-3 flex overflow-hidden rounded-md border border-hairline-strong/60">
        {(
          [
            ['builtin', 'De fábrica'],
            ['mine', 'Meus'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            className={cn(
              'flex-1 px-2 py-1.5 text-xs transition-colors',
              tab === id ? 'bg-emerald-soft text-emerald-deep' : 'text-mute hover:bg-ink/10',
            )}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-2 rounded-md bg-danger-soft px-2 py-1.5 text-xs text-danger-deep">{error}</p>
      )}

      {list === null ? (
        <p className="flex items-center gap-2 py-6 text-xs text-mute">
          <Loader2 className="size-3.5 animate-spin" /> Carregando modelos…
        </p>
      ) : list.length === 0 ? (
        <p className="py-4 text-xs leading-relaxed text-mute">
          {tab === 'mine'
            ? 'Nenhum modelo seu ainda. Monte um criativo e salve como modelo — as imagens viram placeholders para reusar depois.'
            : 'Nenhum modelo de fábrica encontrado.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((t) => (
            <li key={t.id}>
              <div className="group flex gap-2 rounded-lg border border-hairline p-2 transition-colors hover:border-emerald/50">
                <button
                  className="shrink-0 overflow-hidden rounded-md bg-elevated"
                  title={`Aplicar "${t.name}"`}
                  onClick={() => void apply(t)}
                >
                  <TemplateThumb layout={t.project.layouts[t.project.baseFormat]} />
                </button>
                <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="text-[11px] text-mute">{CATEGORY_LABELS[t.category]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => void apply(t)}>
                      Usar
                    </Button>
                    {!t.builtin && (
                      <button
                        className="text-mute opacity-0 transition-opacity hover:text-danger-deep group-hover:opacity-100"
                        title="Apagar modelo"
                        onClick={async () => {
                          await deleteUserTemplate(t.id);
                          setMine(await listUserTemplates());
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {project && (
        <>
          <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => void saveCurrent()}>
            Salvar este criativo como modelo
          </Button>
          {/* Ação ESCONDIDA (§10): gera o JSON que vira modelo de fábrica no
              repositório. Serve a quem mantém o app, não a quem usa — por isso
              some atrás do Alt em vez de ocupar espaço na interface. */}
          {altHeld && (
            <button
              className="mt-2 w-full text-center text-[11px] text-mute hover:text-ink hover:underline"
              onClick={() => {
                const name = window.prompt('Nome do modelo de fábrica', project.name);
                if (!name?.trim()) return;
                const category =
                  (window.prompt(
                    'Categoria: promocao | lancamento | prova-social | institucional',
                    'promocao',
                  ) as Template['category'] | null) ?? 'promocao';
                const json = templateFileJson(project, name.trim(), category);
                downloadBlob(new Blob([json], { type: 'application/json' }), `${slugify(name)}.json`);
              }}
            >
              Exportar como modelo de fábrica (JSON)
            </button>
          )}
        </>
      )}
    </div>
  );
}
