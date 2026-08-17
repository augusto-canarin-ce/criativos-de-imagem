import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { createProject } from './factory';
import { createTextLayer, createRectLayer, createImageLayer } from './layers';
import { templatizeProject, inferGuides } from './templatize';
import { templateFileJson, projectFromTemplate } from '@/lib/db/templates';
import { setActiveBrandKit } from '@/lib/store/brand';
import { templateSchema } from './schema';
import { JARGAO_PROIBIDO } from '@/config/guided';
import type { BrandKit, ImageLayer, Layer, Project, TextLayer } from './types';

// A conversão projeto→modelo (§18, preparação para os modelos desenhados à mão).
// O usuário vai desenhar QUATRO modelos no editor e exportar — este teste é o que
// garante que ele não precisa retocar JSON nenhum na mão.

const KIT: BrandKit = {
  id: 'kit-teste',
  name: 'Marca do teste',
  colors: [
    { id: 'primary', name: 'Principal', hex: '#E63946' },
    { id: 'secondary', name: 'Escura', hex: '#1D3557' },
    { id: 'surface', name: 'Clara', hex: '#F1FAEE' },
  ],
  fonts: [
    { role: 'display', family: 'Archivo Black', weights: [400] },
    { role: 'body', family: 'Inter', weights: [400, 700] },
  ],
  logos: [],
  textStyles: {},
};

/** Um projeto como o usuário vai desenhar: camadas nomeadas pela convenção,
 *  cores da marca em hex (como o conta-gotas as deixa) e imagens preenchidas. */
function projetoDesenhado(): Project {
  const p = createProject({ name: 'Produto em destaque' });

  const foto = createImageLayer('4:5', 'asset-foto-123', 'Foto do produto');
  foto.name = 'Foto do produto';
  foto.crop = { x: 10, y: 10, w: 500, h: 500 };
  foto.adjust = { brightness: 0.2, contrast: 0, saturation: 0, blur: 0 };

  // A logo fica SEM renomear de propósito: imagem inserida no editor nasce com
  // name "Imagem" e o significado no rótulo — a inferência precisa achá-la assim.
  const logo = createImageLayer('4:5', 'asset-logo-456', 'Logo da marca');
  logo.frame = { x: 80, y: 100, w: 220, h: 80 };

  const titulo = createTextLayer('4:5', 'A frase do anúncio');
  titulo.name = 'Título';
  titulo.frame = { x: 80, y: 700, w: 920, h: 200 };
  titulo.fill = { kind: 'solid', color: '#e63946' }; // hex do kit, caixa diferente
  titulo.fontFamily = 'Archivo Black';

  const apoio = createTextLayer('4:5', 'texto de apoio');
  apoio.name = 'Subtítulo';
  apoio.frame = { x: 80, y: 920, w: 920, h: 80 };
  apoio.fill = { kind: 'solid', color: '#ffffff' }; // NÃO é do kit
  apoio.fontFamily = 'Inter';

  const cta = createTextLayer('4:5', 'Comprar agora');
  cta.name = 'Botão';
  cta.frame = { x: 290, y: 1100, w: 500, h: 60 };

  const estrelas = createTextLayer('4:5', '★★★★★');
  estrelas.name = 'Estrelas';

  const fundo = createRectLayer('4:5');
  fundo.name = 'Fundo';
  fundo.fill = {
    kind: 'linear',
    stops: [
      { offset: 0, color: '#1D3557' },
      { offset: 1, color: '#000000' },
    ],
    angle: 90,
  };

  p.layouts['4:5'].layers = [fundo, foto, titulo, apoio, cta, estrelas, logo];
  p.layouts['4:5'].background = { kind: 'solid', color: '#F1FAEE' };
  return p;
}

function porNome(layers: Layer[], nome: string): Layer {
  const l = layers.find((x) => x.name === nome);
  if (!l) throw new Error(`camada "${nome}" não achada`);
  return l;
}

describe('templatizeProject — projeto desenhado vira modelo de fábrica', () => {
  it('toda imagem vira placeholder rotulado, sem resto da imagem original', () => {
    const layouts = templatizeProject(projetoDesenhado(), KIT);
    const foto = porNome(layouts['4:5'].layers, 'Foto do produto') as ImageLayer;
    expect(foto.assetId).toBeNull();
    expect(foto.placeholder.label).toBe('Foto do produto');
    expect(foto.crop).toBeUndefined();
    expect(foto.adjust).toEqual({ brightness: 0, contrast: 0, saturation: 0, blur: 0 });
    expect(foto.focalPoint).toEqual({ x: 0.5, y: 0.5 });
  });

  it('cor que bate com o kit vira token (sem diferenciar caixa); a que não bate fica', () => {
    const layouts = templatizeProject(projetoDesenhado(), KIT);
    const layers = layouts['4:5'].layers;
    expect((porNome(layers, 'Título') as TextLayer).fill).toEqual({
      kind: 'solid',
      color: 'brand.primary',
    });
    expect((porNome(layers, 'Subtítulo') as TextLayer).fill).toEqual({
      kind: 'solid',
      color: '#ffffff',
    });
    // gradiente: cada stop converte independente
    const fundo = porNome(layers, 'Fundo');
    if (fundo.type === 'shape' && fundo.fill.kind === 'linear') {
      expect(fundo.fill.stops[0].color).toBe('brand.secondary');
      expect(fundo.fill.stops[1].color).toBe('#000000');
    } else {
      throw new Error('fundo deveria ser gradiente linear');
    }
    // o fundo do layout também
    expect(layouts['4:5'].background).toEqual({ kind: 'solid', color: 'brand.surface' });
  });

  it('fonte que bate com os papéis do kit vira brand.display/brand.body', () => {
    const layouts = templatizeProject(projetoDesenhado(), KIT);
    const layers = layouts['4:5'].layers;
    expect((porNome(layers, 'Título') as TextLayer).fontFamily).toBe('brand.display');
    expect((porNome(layers, 'Subtítulo') as TextLayer).fontFamily).toBe('brand.body');
  });

  it('o nome da camada vira roteiro; decoração fica de fora', () => {
    const layouts = templatizeProject(projetoDesenhado(), KIT);
    const layers = layouts['4:5'].layers;
    expect(porNome(layers, 'Foto do produto').guide?.role).toBe('foto-principal');
    expect(porNome(layers, 'Imagem').guide).toMatchObject({ role: 'logo', optional: true });
    expect(porNome(layers, 'Título').guide?.role).toBe('titulo');
    expect(porNome(layers, 'Subtítulo').guide?.role).toBe('subtitulo');
    expect(porNome(layers, 'Botão').guide?.role).toBe('botao');
    // Estrelas e Fundo são do modelo, não da pessoa: sem pergunta.
    expect(porNome(layers, 'Estrelas').guide).toBeUndefined();
    expect(porNome(layers, 'Fundo').guide).toBeUndefined();
  });

  it('a ordem das perguntas segue a hierarquia: título, apoio, botão', () => {
    const layouts = templatizeProject(projetoDesenhado(), KIT);
    const textos = layouts['4:5'].layers
      .filter((l) => l.guide && !l.guide.role.startsWith('foto') && l.guide.role !== 'logo')
      .sort((a, b) => a.guide!.order - b.guide!.order);
    expect(textos.map((l) => l.guide!.role)).toEqual(['titulo', 'subtitulo', 'botao']);
    expect(new Set(textos.map((l) => l.guide!.order)).size).toBe(3);
  });

  it('nenhuma pergunta inferida usa jargão, e toda pergunta termina em "?"', () => {
    const layouts = templatizeProject(projetoDesenhado(), KIT);
    for (const layer of layouts['4:5'].layers) {
      if (!layer.guide) continue;
      expect(layer.guide.question.trim().endsWith('?'), layer.name).toBe(true);
      const texto = `${layer.guide.question} ${layer.guide.hint ?? ''}`.toLowerCase();
      for (const palavra of JARGAO_PROIBIDO) {
        expect(texto, `${layer.name}: "${layer.guide.question}"`).not.toContain(palavra);
      }
    }
  });

  it('ANTES e DEPOIS: duas fotos com papéis e perguntas certos', () => {
    const p = createProject({ name: 'Antes e depois' });
    const antes = createImageLayer('4:5', 'a1', 'Foto ANTES');
    antes.name = 'Foto ANTES';
    antes.frame = { x: 60, y: 300, w: 460, h: 620 };
    const depois = createImageLayer('4:5', 'a2', 'Foto DEPOIS');
    depois.name = 'Foto DEPOIS';
    depois.frame = { x: 560, y: 300, w: 460, h: 620 };
    p.layouts['4:5'].layers = [antes, depois];

    const layouts = templatizeProject(p, null);
    const la = porNome(layouts['4:5'].layers, 'Foto ANTES');
    const ld = porNome(layouts['4:5'].layers, 'Foto DEPOIS');
    expect(la.guide).toMatchObject({ role: 'foto-principal', order: 1 });
    expect(la.guide?.question).toContain('ANTES');
    expect(ld.guide).toMatchObject({ role: 'foto-secundaria', order: 2 });
    expect(ld.guide?.question).toContain('DEPOIS');
  });

  it('duas fotos comuns: só a primeira vira principal', () => {
    const p = createProject();
    const f1 = createImageLayer('4:5', 'a1', 'Foto do produto');
    f1.name = 'Foto do produto';
    f1.frame = { x: 0, y: 100, w: 500, h: 500 };
    const f2 = createImageLayer('4:5', 'a2', 'Foto de apoio');
    f2.name = 'Foto de apoio';
    f2.frame = { x: 0, y: 700, w: 500, h: 500 };
    p.layouts['4:5'].layers = [f1, f2];
    const layouts = templatizeProject(p, null);
    expect(porNome(layouts['4:5'].layers, 'Foto do produto').guide?.role).toBe('foto-principal');
    expect(porNome(layouts['4:5'].layers, 'Foto de apoio').guide?.role).toBe('foto-secundaria');
  });

  it('o roteiro é copiado para os formatos derivados pelo id da camada', () => {
    // Sem isso, a remoção da logo pulável no editor tiraria a camada da base e a
    // deixaria nos derivados — três formatos com pilhas diferentes.
    const p = projetoDesenhado();
    p.layouts['1:1'].layers = structuredClone(p.layouts['4:5'].layers);
    p.layouts['9:16'].layers = structuredClone(p.layouts['4:5'].layers);
    const layouts = templatizeProject(p, KIT);
    for (const formatId of ['1:1', '9:16'] as const) {
      expect(porNome(layouts[formatId].layers, 'Imagem').guide?.role).toBe('logo');
      expect(porNome(layouts[formatId].layers, 'Título').guide?.role).toBe('titulo');
    }
  });

  it('não muda o projeto aberto — a conversão é numa cópia', () => {
    const p = projetoDesenhado();
    templatizeProject(p, KIT);
    const foto = porNome(p.layouts['4:5'].layers, 'Foto do produto') as ImageLayer;
    expect(foto.assetId).toBe('asset-foto-123');
    expect(foto.guide).toBeUndefined();
    expect((porNome(p.layouts['4:5'].layers, 'Título') as TextLayer).fill).toEqual({
      kind: 'solid',
      color: '#e63946',
    });
  });
});

describe('templateFileJson — o arquivo que o usuário vai gerar quatro vezes', () => {
  it('produz JSON válido pelo schema, com id de fábrica e slug sem acento', () => {
    setActiveBrandKit(KIT);
    try {
      const json = templateFileJson(projetoDesenhado(), 'Oferta e preço');
      const template = templateSchema.parse(JSON.parse(json));
      expect(template.id).toBe('builtin-oferta-e-preco');
      expect(template.builtin).toBe(true);
      expect(template.project.assets).toEqual([]);
    } finally {
      setActiveBrandKit(null);
    }
  });

  it('o arquivo exportado passa no contrato do passo 1 e aplica como projeto', () => {
    setActiveBrandKit(KIT);
    try {
      const json = templateFileJson(projetoDesenhado(), 'Produto em destaque');
      const template = templateSchema.parse(JSON.parse(json));

      const papeis = template.project.layouts['4:5'].layers
        .filter((l) => l.guide)
        .map((l) => l.guide!.role);
      expect(papeis).toContain('foto-principal');
      expect(papeis).toContain('logo');
      expect(papeis.some((r) => ['titulo', 'subtitulo', 'botao'].includes(r))).toBe(true);

      // E o ciclo fecha: aplicar o modelo exportado cria um projeto normal.
      const { project, firstPlaceholderId } = projectFromTemplate(template as never);
      expect(firstPlaceholderId).toBeTruthy();
      expect(project.layouts['4:5'].layers.some((l) => l.guide?.role === 'logo')).toBe(true);
    } finally {
      setActiveBrandKit(null);
    }
  });
});

describe('inferGuides — roteiro autoral é intocável (ciclo aplicar → re-exportar)', () => {
  it('re-exportar um modelo aplicado preserva as perguntas escritas à mão', () => {
    // O fluxo real de manutenção: aplicar o "Antes e depois" completo, ajustar
    // posições e exportar de novo. As perguntas autorais do arquivo não podem
    // ser trocadas pelas inferidas por nome.
    const raw = JSON.parse(
      readFileSync(
        fileURLToPath(new URL('../../../public/templates/antes-e-depois.json', import.meta.url)),
        'utf8',
      ),
    );
    const template = templateSchema.parse(raw);
    const { project } = projectFromTemplate(template as never);

    const layouts = templatizeProject(project, null);
    const porNomeAqui = (n: string) => layouts['4:5'].layers.find((l) => l.name === n)!;

    // Perguntas e dicas autorais, intactas após o re-export.
    expect(porNomeAqui('Foto ANTES').guide).toMatchObject({
      question: 'Qual a foto do ANTES?',
      hint: 'A situação antes do seu trabalho.',
      role: 'foto-principal',
      order: 1,
    });
    expect(porNomeAqui('Foto DEPOIS').guide?.question).toBe('E a foto do DEPOIS?');
    expect(porNomeAqui('Título').guide?.question).toBe('Qual o título do anúncio?');
    expect(porNomeAqui('Logo').guide).toMatchObject({
      question: 'Quer colocar sua logo?',
      optional: true,
    });
  });

  it('camada nova sem roteiro é inferida SEM mexer nas existentes, com ordem em sequência', () => {
    const existente = createTextLayer('4:5', 'já tinha');
    existente.name = 'Título';
    existente.guide = { role: 'titulo', question: 'Pergunta autoral?', order: 3 };

    const nova = createTextLayer('4:5', 'texto novo');
    nova.name = 'Subtítulo';

    const fotoExistente = createImageLayer('4:5', 'a1', 'Foto');
    fotoExistente.name = 'Foto principal';
    fotoExistente.guide = { role: 'foto-principal', question: 'Foto autoral?', order: 1 };

    const fotoNova = createImageLayer('4:5', 'a2', 'Foto extra');
    fotoNova.name = 'Foto extra';

    const layers: Layer[] = [existente, nova, fotoExistente, fotoNova];
    inferGuides(layers);

    expect(existente.guide).toEqual({ role: 'titulo', question: 'Pergunta autoral?', order: 3 });
    expect(nova.guide).toMatchObject({ role: 'subtitulo', order: 4 });
    // A principal já existia: a foto nova vira secundária, ordem em sequência.
    expect(fotoExistente.guide?.question).toBe('Foto autoral?');
    expect(fotoNova.guide).toMatchObject({ role: 'foto-secundaria', order: 2 });
  });
});

describe('inferGuides — casos de borda da convenção de nomes', () => {
  it('segunda logo fica sem roteiro (o passo 3 é uma pergunta só)', () => {
    const l1 = createImageLayer('4:5', 'a', 'Logo');
    l1.name = 'Logo';
    const l2 = createImageLayer('4:5', 'b', 'Logo rodapé');
    l2.name = 'Logo rodapé';
    const layers: Layer[] = [l1, l2];
    inferGuides(layers);
    expect(l1.guide?.role).toBe('logo');
    expect(l2.guide).toBeUndefined();
  });

  it('nome sem termo reconhecido não ganha pergunta', () => {
    const t = createTextLayer('4:5', 'qualquer coisa');
    t.name = 'Rabisco decorativo';
    const layers: Layer[] = [t];
    inferGuides(layers);
    expect(t.guide).toBeUndefined();
  });
});
