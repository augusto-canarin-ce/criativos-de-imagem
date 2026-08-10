import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import type { TextLayer } from '@/lib/model/types';
import type { Asset } from '@/lib/model/types';
import { useEditor } from '@/lib/store/editor';
import { CURATED_FONTS, curatedFont } from '@/lib/fonts/curated';
import { SYSTEM_FONT_OPTIONS } from '@/lib/fonts/stacks';
import { googleCatalogEntry, sessionGoogleFonts } from '@/lib/fonts/googleFonts';
import { listUserFonts } from '@/lib/fonts/userFonts';
import { FontSearchDialog } from '@/components/dialogs/FontSearchDialog';
import { NumberField, Row, SectionTitle, ToggleGroup } from './controls';
import { FillControl, HighlightControl } from './StyleControls';

// Texto completo (§8/§9): seletor de fontes agrupado (Títulos / Corpo / Minhas
// fontes / Google carregadas / Sistema), pesos dinâmicos por família, busca no
// Google + upload, entrelinha, tracking, caixa alta, alinhamentos horizontal E
// vertical, sublinhado, bullet, preenchimento (sólido/gradiente), marca-texto e
// auto-fit.

const FALLBACK_WEIGHTS = [300, 400, 500, 600, 700, 800, 900];

function weightsFor(family: string, userFonts: Asset[]): number[] {
  const curated = curatedFont(family);
  if (curated) return curated.weights;
  const google = sessionGoogleFonts().find((f) => f.family === family);
  if (google) return google.weights;
  if (userFonts.some((f) => f.name === family)) return [400];
  const catalog = googleCatalogEntry(family);
  if (catalog) return catalog.weights;
  return FALLBACK_WEIGHTS;
}

export function TextInspector({ layer }: { layer: TextLayer }) {
  const updateLayer = useEditor((s) => s.updateLayer);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userFonts, setUserFonts] = useState<Asset[]>([]);

  useEffect(() => {
    void listUserFonts().then(setUserFonts);
  }, [searchOpen]); // recarrega após upload pelo diálogo

  function set(mutate: (l: TextLayer) => void) {
    updateLayer(layer.id, (l) => l.type === 'text' && mutate(l));
  }

  const weights = weightsFor(layer.fontFamily, userFonts);
  const googleLoaded = sessionGoogleFonts();
  const displays = CURATED_FONTS.filter((f) => f.role === 'display');
  const bodies = CURATED_FONTS.filter((f) => f.role === 'body');
  // Família fora de todos os grupos (ex.: Google usada no projeto salvo mas ainda
  // não recarregada nesta sessão): aparece num grupo próprio para não sumir.
  const known =
    CURATED_FONTS.some((f) => f.family === layer.fontFamily) ||
    SYSTEM_FONT_OPTIONS.some((f) => f.family === layer.fontFamily) ||
    googleLoaded.some((f) => f.family === layer.fontFamily) ||
    userFonts.some((f) => f.name === layer.fontFamily);

  return (
    <div>
      <SectionTitle>Texto</SectionTitle>
      <textarea
        className="mb-2 min-h-16 w-full resize-y rounded-md border border-hairline-strong/60 bg-transparent p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald/40"
        value={layer.content}
        onChange={(e) => set((l) => (l.content = e.target.value))}
        placeholder="Conteúdo do texto"
      />
      <Row label="Fonte">
        <div className="flex w-full items-center gap-1">
          <select
            className="h-8 w-full cursor-pointer rounded-md border border-hairline-strong/60 bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald/40"
            value={layer.fontFamily}
            onChange={(e) =>
              set((l) => {
                l.fontFamily = e.target.value;
                const available = weightsFor(e.target.value, userFonts);
                if (!available.includes(l.fontWeight)) {
                  l.fontWeight = available.includes(700) ? 700 : available[available.length - 1];
                }
              })
            }
          >
            {!known && <option value={layer.fontFamily}>{layer.fontFamily}</option>}
            <optgroup label="Títulos">
              {displays.map((f) => (
                <option key={f.family} value={f.family}>
                  {f.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Corpo">
              {bodies.map((f) => (
                <option key={f.family} value={f.family}>
                  {f.label}
                </option>
              ))}
            </optgroup>
            {userFonts.length > 0 && (
              <optgroup label="Minhas fontes">
                {userFonts.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </optgroup>
            )}
            {googleLoaded.length > 0 && (
              <optgroup label="Google Fonts (sessão)">
                {googleLoaded.map((f) => (
                  <option key={f.family} value={f.family}>
                    {f.family}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Sistema">
              {SYSTEM_FONT_OPTIONS.map((f) => (
                <option key={f.family} value={f.family}>
                  {f.label}
                </option>
              ))}
            </optgroup>
          </select>
          <button
            type="button"
            title="Buscar no Google Fonts ou enviar fonte"
            onClick={() => setSearchOpen(true)}
            className="grid size-8 shrink-0 place-items-center rounded-md border border-hairline-strong/60 text-mute hover:bg-ink/10 hover:text-ink"
          >
            <Search className="size-4" />
          </button>
        </div>
      </Row>
      <div className="grid grid-cols-2 gap-x-3">
        <Row label="Peso">
          <select
            className="h-8 w-full cursor-pointer rounded-md border border-hairline-strong/60 bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald/40"
            value={layer.fontWeight}
            onChange={(e) => set((l) => (l.fontWeight = Number(e.target.value)))}
          >
            {weights.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Tam.">
          <NumberField value={layer.fontSize} min={4} onCommit={(v) => set((l) => (l.fontSize = v))} />
        </Row>
        <Row label="Entrelinha">
          <NumberField value={layer.lineHeight} step={0.05} min={0.5} onCommit={(v) => set((l) => (l.lineHeight = v))} />
        </Row>
        <Row label="Tracking">
          <NumberField value={layer.letterSpacing} step={0.5} onCommit={(v) => set((l) => (l.letterSpacing = v))} />
        </Row>
      </div>
      <Row label="Alinhar">
        <ToggleGroup
          value={layer.align}
          options={[
            { value: 'left', label: '⯇', title: 'Esquerda' },
            { value: 'center', label: '≡', title: 'Centro' },
            { value: 'right', label: '⯈', title: 'Direita' },
          ]}
          onCommit={(v) => set((l) => (l.align = v))}
        />
      </Row>
      <Row label="Vertical">
        <ToggleGroup
          value={layer.vAlign}
          options={[
            { value: 'top', label: '⤒', title: 'Topo' },
            { value: 'middle', label: '⇕', title: 'Meio' },
            { value: 'bottom', label: '⤓', title: 'Base' },
          ]}
          onCommit={(v) => set((l) => (l.vAlign = v))}
        />
      </Row>
      <Row label="Caixa">
        <ToggleGroup
          value={layer.transform}
          options={[
            { value: 'none', label: 'Ab' },
            { value: 'uppercase', label: 'AB' },
          ]}
          onCommit={(v) => set((l) => (l.transform = v))}
        />
      </Row>
      <div className="grid grid-cols-2 gap-x-3">
        <Row label="Sublinhado">
          <input
            type="checkbox"
            className="size-4 accent-[var(--color-emerald-500)]"
            checked={layer.underline}
            onChange={(e) => set((l) => (l.underline = e.target.checked))}
          />
        </Row>
        <Row label="Lista">
          <input
            type="checkbox"
            className="size-4 accent-[var(--color-emerald-500)]"
            checked={layer.bullet}
            onChange={(e) => set((l) => (l.bullet = e.target.checked))}
          />
        </Row>
      </div>

      <FillControl value={layer.fill} onChange={(fill) => set((l) => (l.fill = fill))} />
      <HighlightControl layer={layer} />

      {/* Auto-fit (SPEC §8): por camada, desligado por padrão; o usuário define o
          piso e o teto. Reduz o texto até caber na caixa — nunca aumenta. */}
      <SectionTitle>Auto-ajuste</SectionTitle>
      <Row label="Reduzir p/ caber">
        <input
          type="checkbox"
          className="size-4 accent-[var(--color-emerald-500)]"
          checked={layer.autoFit.enabled}
          onChange={(e) => set((l) => (l.autoFit.enabled = e.target.checked))}
        />
      </Row>
      {layer.autoFit.enabled && (
        <div className="grid grid-cols-2 gap-x-3">
          <Row label="Mín.">
            <NumberField
              value={layer.autoFit.min}
              min={4}
              onCommit={(v) => set((l) => (l.autoFit.min = Math.min(v, l.autoFit.max)))}
            />
          </Row>
          <Row label="Máx.">
            <NumberField
              value={layer.autoFit.max}
              min={4}
              onCommit={(v) => set((l) => (l.autoFit.max = Math.max(v, l.autoFit.min)))}
            />
          </Row>
        </div>
      )}

      <FontSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onPicked={(family, loadedWeights) =>
          set((l) => {
            l.fontFamily = family;
            if (!loadedWeights.includes(l.fontWeight)) {
              l.fontWeight = loadedWeights.includes(700) ? 700 : loadedWeights[0];
            }
          })
        }
      />
    </div>
  );
}
