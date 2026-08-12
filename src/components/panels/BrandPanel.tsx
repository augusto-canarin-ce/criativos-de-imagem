import { useEffect, useState } from 'react';
import { Download, FileUp, Lock, Plus, Trash2, Type as TypeIcon, Upload } from 'lucide-react';
import type { BrandKit } from '@/lib/model/types';
import { useEditor, selectProject } from '@/lib/store/editor';
import { setActiveBrandKit, useBrandKit } from '@/lib/store/brand';
import {
  buildBrandFile,
  createBrandKit,
  deleteBrandKit,
  importBrandFile,
  listBrandKits,
  saveBrandKit,
} from '@/lib/db/brand';
import { saveImageAsset } from '@/lib/db/assets';
import { pickImageFiles } from '@/lib/assets/upload';
import { CURATED_FONTS } from '@/lib/fonts/curated';
import { newId } from '@/lib/model/factory';
import { STANDARD_ROLE_IDS, type StandardRoleId } from '@/lib/brand/roles';
import { slugify } from '@/lib/export/naming';
import { downloadBlob } from '@/lib/export/zip';
import { textStyleFromLayer } from '@/lib/brand/tokens';
import { ColorPicker } from '@/components/ui/color-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Painel de MARCA (SPEC §10): cores nomeadas, fontes por papel, logos e estilos
// de texto. Múltiplos kits, um ativo por projeto. Editar aqui atualiza o criativo
// inteiro na hora — os tokens resolvem no render (§6).

export function BrandPanel() {
  const project = useEditor(selectProject);
  const commit = useEditor((s) => s.commit);
  const kit = useBrandKit();
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setKits(await listBrandKits());
  }
  useEffect(() => {
    void refresh();
  }, []);

  async function update(mutate: (k: BrandKit) => void) {
    if (!kit) return;
    const next = structuredClone(kit);
    mutate(next);
    await saveBrandKit(next);
    setActiveBrandKit(next); // redesenha o canvas na hora
    await refresh();
  }

  async function useKit(id: string | undefined) {
    commit((p) => {
      p.brandKitId = id;
    });
    // O efeito do Editor recarrega o kit; setamos já para não piscar.
    setActiveBrandKit(id ? (kits.find((k) => k.id === id) ?? null) : null);
  }

  async function addKit() {
    const fresh = createBrandKit(`Marca ${kits.length + 1}`);
    await saveBrandKit(fresh);
    await refresh();
    await useKit(fresh.id);
  }

  async function importKit() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.marca,application/zip';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setError(null);
      try {
        const imported = await importBrandFile(file);
        await refresh();
        await useKit(imported.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível importar a marca.');
      }
    };
    input.click();
  }

  async function exportKit() {
    if (!kit) return;
    downloadBlob(await buildBrandFile(kit), `${slugify(kit.name)}.marca`);
  }

  async function addLogo() {
    const [file] = await pickImageFiles(false);
    if (!file || !kit) return;
    const asset = await saveImageAsset(file);
    await update((k) => {
      k.logos.push({ id: newId(), assetId: asset.id, label: file.name });
    });
  }

  if (!project) return null;

  return (
    <div className="p-3">
      {/* Seleção de kit */}
      <div className="mb-3 flex items-center gap-1">
        <select
          className="h-8 w-full cursor-pointer rounded-md border border-hairline-strong/60 bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald/40"
          value={project.brandKitId ?? ''}
          onChange={(e) => void useKit(e.target.value || undefined)}
        >
          <option value="">Sem marca</option>
          {kits.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>
        <button
          className="grid size-8 shrink-0 place-items-center rounded-md border border-hairline-strong/60 text-mute hover:bg-ink/10 hover:text-ink"
          title="Nova marca"
          onClick={() => void addKit()}
        >
          <Plus className="size-4" />
        </button>
        <button
          className="grid size-8 shrink-0 place-items-center rounded-md border border-hairline-strong/60 text-mute hover:bg-ink/10 hover:text-ink"
          title="Importar marca (.marca)"
          onClick={importKit}
        >
          <FileUp className="size-4" />
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-md bg-danger-soft px-2 py-1.5 text-xs text-danger-deep">{error}</p>
      )}

      {!kit ? (
        <p className="text-xs leading-relaxed text-mute">
          Sem marca ativa. Crie uma para usar tokens de cor e fonte — aí trocar de marca
          atualiza o criativo inteiro de uma vez.
        </p>
      ) : (
        <>
          <Input
            value={kit.name}
            onChange={(e) => void update((k) => (k.name = e.target.value))}
            className="mb-3 h-8 text-sm"
            aria-label="Nome da marca"
          />

          <Section title="Cores">
            <div className="space-y-1.5">
              {kit.colors.map((color) => (
                <div key={color.id} className="flex items-center gap-1.5">
                  <ColorPicker
                    value={color.hex}
                    onCommit={(hex) =>
                      void update((k) => {
                        const c = k.colors.find((x) => x.id === color.id);
                        if (c) c.hex = hex;
                      })
                    }
                  />
                  <input
                    className="h-8 min-w-0 flex-1 rounded-md border border-hairline-strong/60 bg-transparent px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-emerald/40"
                    value={color.name}
                    onChange={(e) =>
                      void update((k) => {
                        const c = k.colors.find((x) => x.id === color.id);
                        if (c) c.name = e.target.value;
                      })
                    }
                  />
                  {/* Os cinco papéis padrão não podem ser apagados: os modelos
                      de fábrica apontam para eles, e um kit sem os papéis
                      renderiza todo token no cinza de "não resolvido" (foi o
                      caso das miniaturas cinzas, 2026-08-12). Troque a COR do
                      papel, não o papel. */}
                  {STANDARD_ROLE_IDS.includes(color.id as StandardRoleId) ? (
                    <span
                      className="shrink-0 cursor-help text-faint"
                      title="Cor de papel padrão: os modelos de fábrica usam este papel. Mude a cor à vontade; remover, não."
                    >
                      <Lock className="size-3.5" />
                    </span>
                  ) : (
                    <button
                      className="shrink-0 text-mute hover:text-danger-deep"
                      title={`Remover "${color.name}"`}
                      onClick={() =>
                        void update((k) => {
                          k.colors = k.colors.filter((x) => x.id !== color.id);
                        })
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              className="mt-1.5 text-xs text-emerald-deep hover:underline"
              onClick={() =>
                void update((k) => {
                  k.colors.push({ id: newId().slice(0, 8), name: 'Nova cor', hex: '#888888' });
                })
              }
            >
              + Adicionar cor
            </button>
          </Section>

          <Section title="Fontes">
            {(['display', 'body'] as const).map((role) => {
              const font = kit.fonts.find((f) => f.role === role);
              return (
                <div key={role} className="mb-1.5">
                  <span className="text-[11px] text-mute">
                    {role === 'display' ? 'Títulos' : 'Corpo'}
                  </span>
                  <select
                    className="h-8 w-full cursor-pointer rounded-md border border-hairline-strong/60 bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald/40"
                    value={font?.family ?? ''}
                    onChange={(e) =>
                      void update((k) => {
                        const curated = CURATED_FONTS.find((f) => f.family === e.target.value);
                        const existing = k.fonts.find((f) => f.role === role);
                        const weights = curated?.weights ?? [400, 700];
                        if (existing) {
                          existing.family = e.target.value;
                          existing.weights = weights;
                        } else {
                          k.fonts.push({ role, family: e.target.value, weights });
                        }
                      })
                    }
                  >
                    {CURATED_FONTS.filter((f) => (role === 'display' ? true : f.role === 'body')).map(
                      (f) => (
                        <option key={f.family} value={f.family}>
                          {f.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              );
            })}
            <p className="mt-1 text-[11px] leading-snug text-mute">
              Use “Marca — títulos/corpo” no seletor de fonte da camada para ela seguir a marca.
            </p>
          </Section>

          <Section title="Logos">
            {kit.logos.length === 0 ? (
              <p className="text-xs text-mute">Nenhum logo ainda.</p>
            ) : (
              <ul className="space-y-1">
                {kit.logos.map((logo) => (
                  <li key={logo.id} className="flex items-center gap-2 text-xs">
                    <span className="min-w-0 flex-1 truncate">{logo.label}</span>
                    <button
                      className="text-mute hover:text-emerald-deep"
                      title="Inserir no criativo"
                      onClick={() => void insertLogo(logo.assetId, logo.label)}
                    >
                      <Plus className="size-3.5" />
                    </button>
                    <button
                      className="text-mute hover:text-danger-deep"
                      title="Remover do kit"
                      onClick={() =>
                        void update((k) => {
                          k.logos = k.logos.filter((l) => l.id !== logo.id);
                        })
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button className="mt-1.5 text-xs text-emerald-deep hover:underline" onClick={() => void addLogo()}>
              + Adicionar logo
            </button>
          </Section>

          <TextStylesSection kit={kit} onUpdate={update} />

          <div className="mt-4 flex gap-2 border-t border-hairline pt-3">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => void exportKit()}>
              <Download /> Exportar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger-deep"
              title="Apagar esta marca"
              onClick={async () => {
                await deleteBrandKit(kit.id);
                setActiveBrandKit(null);
                await refresh();
                commit((p) => {
                  p.brandKitId = undefined;
                });
              }}
            >
              <Trash2 />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

async function insertLogo(assetId: string, label: string) {
  const { getAsset } = await import('@/lib/db/assets');
  const { createImageElementLayer } = await import('@/lib/model/layers');
  const asset = await getAsset(assetId);
  if (!asset) return;
  const store = useEditor.getState();
  const layer = createImageElementLayer(
    store.activeFormat,
    assetId,
    { width: asset.width ?? 300, height: asset.height ?? 150 },
    label,
  );
  store.addLayer(layer);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-mute">{title}</h3>
      {children}
    </div>
  );
}

/** Estilos de texto (§10): "Título", "Subtítulo", "CTA" aplicáveis em um clique. */
function TextStylesSection({
  kit,
  onUpdate,
}: {
  kit: BrandKit;
  onUpdate: (mutate: (k: BrandKit) => void) => Promise<void>;
}) {
  const project = useEditor(selectProject);
  const activeFormat = useEditor((s) => s.activeFormat);
  const selectedIds = useEditor((s) => s.selectedIds);
  const updateLayer = useEditor((s) => s.updateLayer);

  const selectedText =
    project?.layouts[activeFormat].layers.find(
      (l) => selectedIds.includes(l.id) && l.type === 'text',
    ) ?? null;

  const names = Object.keys(kit.textStyles);

  function apply(name: string) {
    const style = kit.textStyles[name];
    if (!style || !selectedText) return;
    updateLayer(selectedText.id, (l) => {
      if (l.type !== 'text') return;
      Object.assign(l, structuredClone(style));
    });
  }

  return (
    <Section title="Estilos de texto">
      {names.length === 0 ? (
        <p className="text-xs text-mute">
          Nenhum estilo. Selecione uma camada de texto e salve a aparência dela como estilo.
        </p>
      ) : (
        <ul className="space-y-1">
          {names.map((name) => (
            <li key={name} className="flex items-center gap-2">
              <button
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-xs',
                  selectedText ? 'hover:bg-ink/10' : 'cursor-default opacity-60',
                )}
                disabled={!selectedText}
                title={selectedText ? `Aplicar "${name}"` : 'Selecione uma camada de texto'}
                onClick={() => apply(name)}
              >
                <TypeIcon className="size-3.5 shrink-0 text-mute" />
                <span className="truncate">{name}</span>
              </button>
              <button
                className="shrink-0 text-mute hover:text-danger-deep"
                title={`Remover estilo "${name}"`}
                onClick={() =>
                  void onUpdate((k) => {
                    delete k.textStyles[name];
                  })
                }
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {selectedText && selectedText.type === 'text' && (
        <button
          className="mt-1.5 flex items-center gap-1 text-xs text-emerald-deep hover:underline"
          onClick={() => {
            const name = window.prompt('Nome do estilo (ex.: Título, Subtítulo, CTA)');
            if (!name?.trim()) return;
            void onUpdate((k) => {
              k.textStyles[name.trim()] = textStyleFromLayer(selectedText);
            });
          }}
        >
          <Upload className="size-3" /> Salvar seleção como estilo
        </button>
      )}
    </Section>
  );
}
