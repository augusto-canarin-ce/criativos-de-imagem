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
import { useBrandKit } from '@/lib/store/brand';
import {
  FONT_BODY_TOKEN,
  FONT_DISPLAY_TOKEN,
  isFontToken,
  resolveBrandFont,
  brandFontWeights,
} from '@/lib/brand/tokens';
import { NumberField, Row, SectionTitle, ToggleGroup } from './controls';
import { FillControl, HighlightControl } from './StyleControls';
import { ColorPicker } from '@/components/ui/color-picker';
import { fillToSolid } from '@/lib/render/fill';
import { aplicarCor, corEm, remapSpans } from '@/lib/model/textSpans';

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
  const brandKit = useBrandKit();

  useEffect(() => {
    void listUserFonts().then(setUserFonts);
  }, [searchOpen]); // recarrega após upload pelo diálogo

  function set(mutate: (l: TextLayer) => void) {
    updateLayer(layer.id, (l) => l.type === 'text' && mutate(l));
  }

  // Trecho selecionado no texto (2026-09-22): "seleciono uma parte e escolho a
  // cor". Enquanto houver um trecho armado, o seletor abaixo pinta só ele.
  const textSelection = useEditor((s) => s.textSelection);
  const setTextSelection = useEditor((s) => s.setTextSelection);
  const trecho =
    textSelection && textSelection.layerId === layer.id && textSelection.end > textSelection.start
      ? textSelection
      : null;
  const trechoTexto = trecho ? layer.content.slice(trecho.start, trecho.end) : '';
  const corDoTrecho = trecho ? (corEm(layer.spans, trecho.start) ?? fillToSolid(layer.fill)) : '';

  // Com token de marca, os pesos vêm do papel no kit.
  const weights =
    brandFontWeights(layer.fontFamily, brandKit) ?? weightsFor(layer.fontFamily, userFonts);
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
        onChange={(e) =>
          set((l) => {
            l.spans = remapSpans(l.spans, l.content, e.target.value);
            l.content = e.target.value;
          })
        }
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
                const available =
                  brandFontWeights(e.target.value, brandKit) ??
                  weightsFor(e.target.value, userFonts);
                if (!available.includes(l.fontWeight)) {
                  l.fontWeight = available.includes(700) ? 700 : available[available.length - 1];
                }
              })
            }
          >
            {!known && !isFontToken(layer.fontFamily) && (
              <option value={layer.fontFamily}>{layer.fontFamily}</option>
            )}
            {/* Tokens de marca (§6/§10): a camada segue o papel do brand kit —
                trocar de marca troca a fonte de todas as camadas de uma vez. */}
            <optgroup label="Marca">
              <option value={FONT_DISPLAY_TOKEN}>
                Marca — títulos{brandKit ? ` (${resolveBrandFont(FONT_DISPLAY_TOKEN, brandKit)})` : ''}
              </option>
              <option value={FONT_BODY_TOKEN}>
                Marca — corpo{brandKit ? ` (${resolveBrandFont(FONT_BODY_TOKEN, brandKit)})` : ''}
              </option>
            </optgroup>
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
          <NumberField
            value={layer.fontSize}
            min={4}
            onCommit={(v) =>
              set((l) => {
                // Tamanho digitado é escolha explícita: o teto do auto-ajuste
                // acompanha, senão os formatos derivados devolveriam ao max antigo.
                l.fontSize = v;
                if (l.autoFit.enabled && v > l.autoFit.max) l.autoFit.max = v;
              })
            }
          />
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

      {trecho && (
        <div className="mb-3 rounded-md border border-emerald/40 bg-emerald-soft px-2.5 py-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] leading-snug text-emerald-deep">
              Cor só do trecho{' '}
              <span className="font-medium">
                “{trechoTexto.length > 40 ? `${trechoTexto.slice(0, 40)}…` : trechoTexto}”
              </span>
            </p>
            <button
              type="button"
              className="shrink-0 text-[11px] text-mute hover:text-ink"
              title="Voltar a editar a cor do texto inteiro"
              onClick={() => setTextSelection(null)}
            >
              ✕
            </button>
          </div>
          <div className="mt-1.5">
            <ColorPicker
              value={corDoTrecho}
              onCommit={(hex) =>
                set((l) => {
                  l.spans = aplicarCor(l.spans, trecho.start, trecho.end, hex);
                })
              }
            />
          </div>
        </div>
      )}
      <FillControl value={layer.fill} onChange={(fill) => set((l) => (l.fill = fill))} />
      {layer.spans?.length ? (
        <button
          type="button"
          className="mt-1 text-[11px] text-mute hover:text-ink hover:underline"
          title="Volta o texto inteiro para a cor do preenchimento"
          onClick={() => set((l) => (l.spans = undefined))}
        >
          Remover cores parciais ({layer.spans.length} {layer.spans.length === 1 ? 'trecho' : 'trechos'})
        </button>
      ) : null}
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
