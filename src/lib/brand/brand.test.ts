import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { BrandKit } from '@/lib/model/types';
import { templateSchema } from '@/lib/model/schema';
import { createTextLayer } from '@/lib/model/layers';
import {
  resolveBrandColor,
  resolveBrandFont,
  isColorToken,
  isFontToken,
  textStyleFromLayer,
  matchesTextStyle,
  FONT_DISPLAY_TOKEN,
  FONT_BODY_TOKEN,
} from './tokens';
import { projectFromTemplate } from '@/lib/db/templates';
import { FORMAT_IDS } from '@/config/formats';

const KIT: BrandKit = {
  id: 'k1',
  name: 'Marca A',
  colors: [
    { id: 'primary', name: 'Primária', hex: '#10b981' },
    { id: 'ink', name: 'Texto', hex: '#111111' },
  ],
  fonts: [
    { role: 'display', family: 'Anton', weights: [400] },
    { role: 'body', family: 'Inter', weights: [400, 700] },
  ],
  logos: [],
  textStyles: {},
};

describe('tokens de marca (§6/§10)', () => {
  it('reconhece tokens de cor e de fonte', () => {
    expect(isColorToken('brand.primary')).toBe(true);
    expect(isColorToken('#10b981')).toBe(false);
    expect(isFontToken(FONT_DISPLAY_TOKEN)).toBe(true);
    expect(isFontToken('Anton')).toBe(false);
  });

  it('resolve cor pelo id e cai em fallback quando o id sumiu', () => {
    expect(resolveBrandColor('brand.primary', KIT)).toBe('#10b981');
    expect(resolveBrandColor('brand.inexistente', KIT)).toBe('#888888');
    expect(resolveBrandColor('#ff0000', KIT)).toBe('#ff0000'); // hex passa direto
  });

  it('sem kit, token de cor não quebra o render', () => {
    expect(resolveBrandColor('brand.primary', null)).toBe('#888888');
  });

  it('resolve fonte por papel', () => {
    expect(resolveBrandFont(FONT_DISPLAY_TOKEN, KIT)).toBe('Anton');
    expect(resolveBrandFont(FONT_BODY_TOKEN, KIT)).toBe('Inter');
    expect(resolveBrandFont('Montserrat', KIT)).toBe('Montserrat');
  });

  it('TROCAR DE KIT muda o que os mesmos tokens resolvem (o aceite da fase)', () => {
    const outro: BrandKit = {
      ...KIT,
      id: 'k2',
      colors: [{ id: 'primary', name: 'Primária', hex: '#dc2626' }],
      fonts: [{ role: 'display', family: 'Bebas Neue', weights: [400] }],
    };
    expect(resolveBrandColor('brand.primary', KIT)).toBe('#10b981');
    expect(resolveBrandColor('brand.primary', outro)).toBe('#dc2626');
    expect(resolveBrandFont(FONT_DISPLAY_TOKEN, outro)).toBe('Bebas Neue');
  });
});

describe('estilos de texto (§10)', () => {
  it('extrai só aparência — nunca geometria ou conteúdo', () => {
    const layer = createTextLayer('4:5', 'Olá');
    const style = textStyleFromLayer(layer);
    expect(style.fontSize).toBe(layer.fontSize);
    expect(style).not.toHaveProperty('frame');
    expect(style).not.toHaveProperty('content');
    expect(style).not.toHaveProperty('id');
  });

  it('detecta camada modificada em relação ao estilo', () => {
    const layer = createTextLayer('4:5', 'Olá');
    const style = textStyleFromLayer(layer);
    expect(matchesTextStyle(layer, style)).toBe(true);

    const moved = { ...layer, frame: { ...layer.frame, x: 999 } };
    expect(matchesTextStyle(moved, style), 'mover não conta como modificar o estilo').toBe(true);

    const restyled = { ...layer, fontSize: layer.fontSize + 10 };
    expect(matchesTextStyle(restyled, style)).toBe(false);
  });
});

describe('modelos de fábrica (§10)', () => {
  const dir = fileURLToPath(new URL('../../../public/templates/', import.meta.url));
  const files = readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'index.json');

  it('são exatamente os quatro desenhados à mão', () => {
    // Os gerados por script foram removidos em 2026-08-13 — os quatro
    // objetivos do passo 1 resolvem para modelos desenhados, sem reserva.
    expect(files.sort()).toEqual([
      'antes-e-depois.json',
      'lista-de-beneficios.json',
      'oferta-e-preco.json',
      'produto-em-destaque.json',
    ]);
  });

  // Cores literais ESCOLHIDAS pelo autor do modelo (2026-08-13): cor da paleta
  // que não ocupa papel padrão não tem token garantido em todo kit — virar
  // token quebraria o modelo em kits sem aquele id. Qualquer literal NOVO tem
  // que ser declarado aqui, senão o contrato acusa (literal acidental continua
  // sendo bug).
  const LITERAIS_DELIBERADOS: Record<string, string[]> = {
    'oferta-e-preco.json': ['#a1a1a1'],
    // #0a0a0a declarado por futuro: o Véu hoje é gradiente (stops fora desta
    // checagem), mas um re-export pode voltá-lo a sólido.
    'lista-de-beneficios.json': ['#a1a1a1', '#0a0a0a'],
  };

  it.each(readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'index.json'))(
    '%s passa no schema, usa tokens de marca e só tem placeholders rotulados',
    (file) => {
      const raw = JSON.parse(readFileSync(dir + file, 'utf8'));
      const parsed = templateSchema.safeParse(raw);
      expect(parsed.success, JSON.stringify(parsed.error?.issues?.[0])).toBe(true);

      const layers = raw.project.layouts['4:5'].layers as {
        type: string;
        assetId: string | null;
        placeholder?: { label: string };
        fill?: { kind: string; color?: string };
      }[];
      expect(layers.length).toBeGreaterThan(0);

      for (const l of layers) {
        // §8: modelo de fábrica é, por definição, um projeto onde toda imagem é
        // placeholder ROTULADO.
        if (l.type === 'image') {
          expect(l.assetId).toBeNull();
          expect(l.placeholder?.label?.length ?? 0).toBeGreaterThan(2);
        }
        // §10: cores vêm da marca, para o modelo nascer com a identidade do
        // usuário — exceto literais deliberados, declarados acima.
        if (l.fill?.kind === 'solid' && !isColorToken(l.fill.color!)) {
          expect(
            LITERAIS_DELIBERADOS[file] ?? [],
            `${file}: literal não declarado ${l.fill.color}`,
          ).toContain(l.fill.color);
        }
      }
    },
  );
});

describe('aplicar modelo', () => {
  const template = templateSchema.parse(
    JSON.parse(
      readFileSync(
        fileURLToPath(new URL('../../../public/templates/produto-em-destaque.json', import.meta.url)),
        'utf8',
      ),
    ),
  );

  it('cria projeto com ids novos e herda a marca ativa', () => {
    const { project } = projectFromTemplate(template, { brandKitId: 'k1', name: 'Meu anúncio' });
    expect(project.name).toBe('Meu anúncio');
    expect(project.brandKitId).toBe('k1');
    const original = template.project.layouts['4:5'].layers.map((l) => l.id);
    const fresh = project.layouts['4:5'].layers.map((l) => l.id);
    for (const id of fresh) expect(original).not.toContain(id);
  });

  it('duas aplicações não colidem em id', () => {
    const a = projectFromTemplate(template).project;
    const b = projectFromTemplate(template).project;
    const idsA = a.layouts['4:5'].layers.map((l) => l.id);
    const idsB = b.layouts['4:5'].layers.map((l) => l.id);
    expect(idsA.some((id) => idsB.includes(id))).toBe(false);
  });

  it('devolve o primeiro placeholder vazio para abrir selecionado (§8)', () => {
    const { project, firstPlaceholderId } = projectFromTemplate(template);
    expect(firstPlaceholderId).toBeTruthy();
    const layer = project.layouts['4:5'].layers.find((l) => l.id === firstPlaceholderId);
    expect(layer?.type).toBe('image');
    expect(layer?.type === 'image' && layer.assetId).toBeNull();
  });

  // Decisão de 2026-08-13 (reverte a regra anterior): o modelo é aplicado COMO
  // ESTÁ NO ARQUIVO em qualquer caminho — a logo vem junto, e quem não quiser
  // apaga a camada. O `optional: true` continua no roteiro, para o passo 3 do
  // guiado seguir pulável.
  it('o espaço de logo vem junto nos três formatos, em qualquer caminho', () => {
    // Modelos desenhados trazem os três layouts completos do arquivo — a logo
    // tem que estar em todos, sem filtro nenhum no meio.
    const { project } = projectFromTemplate(template);
    for (const id of FORMAT_IDS) {
      const logos = project.layouts[id].layers.filter((l) => l.guide?.role === 'logo');
      expect(logos, id).toHaveLength(1);
      expect(logos[0].guide?.optional, id).toBe(true);
    }
  });
});
