import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { templateSchema } from '@/lib/model/schema';
import { projectFromTemplate } from '@/lib/db/templates';
import type { Project, Template } from '@/lib/model/types';
import {
  buildScreens,
  clampScreen,
  emptySkippedLogos,
  labelDoContador,
  podeAvancar,
  TOTAL_PASSOS,
} from './steps';

function carregar(arquivo: string): Template {
  const p = fileURLToPath(new URL(`../../../public/templates/${arquivo}`, import.meta.url));
  return templateSchema.parse(JSON.parse(readFileSync(p, 'utf8')));
}

function projetoGuiado(arquivo: string): Project {
  return projectFromTemplate(carregar(arquivo)).project;
}

describe('telas do modo guiado (§18)', () => {
  it('deriva as telas do roteiro, na ordem dos passos', () => {
    const screens = buildScreens(projetoGuiado('produto-em-destaque.json'));
    expect(screens.map((s) => s.kind)).toEqual([
      'foto',
      'logo',
      'texto',
      'texto',
      'texto',
      'conferir',
    ]);
    // Os passos só avançam, nunca voltam.
    const passos = screens.map((s) => s.passo);
    expect([...passos].sort((a, b) => a - b)).toEqual(passos);
    expect(screens.at(-1)?.passo).toBe(TOTAL_PASSOS);
  });

  it('um campo por tela: cada texto do roteiro vira uma tela', () => {
    const project = projetoGuiado('produto-em-destaque.json');
    const textos = buildScreens(project).filter((s) => s.kind === 'texto');
    expect(textos).toHaveLength(3);
    expect(new Set(textos.map((t) => t.layerId)).size).toBe(3);
    expect(textos.map((t) => t.guide?.role)).toEqual(['titulo', 'subtitulo', 'botao']);
  });

  it('modelo com duas fotos gera duas telas de foto, sem código especial', () => {
    const screens = buildScreens(projetoGuiado('antes-e-depois.json'));
    const fotos = screens.filter((s) => s.kind === 'foto');
    expect(fotos).toHaveLength(2);
    expect(fotos[0].guide?.role).toBe('foto-principal');
    expect(fotos[1].guide?.role).toBe('foto-secundaria');
    expect(fotos[0].sub).toEqual({ indice: 1, total: 2 });
  });

  it('o contador tem cinco passos fixos, com subcontador quando precisa', () => {
    const screens = buildScreens(projetoGuiado('antes-e-depois.json'));
    const foto = screens.find((s) => s.kind === 'foto')!;
    const logo = screens.find((s) => s.kind === 'logo')!;
    expect(labelDoContador(foto)).toBe('Passo 2 de 5 · foto 1 de 2');
    expect(labelDoContador(logo)).toBe('Passo 3 de 5');
    // O total nunca muda com o modelo: é sempre "de 5".
    for (const arquivo of ['produto-em-destaque.json', 'oferta-e-preco.json', 'lista-de-beneficios.json']) {
      for (const s of buildScreens(projetoGuiado(arquivo))) {
        expect(labelDoContador(s)).toContain(`de ${TOTAL_PASSOS}`);
      }
    }
  });

  it('todo modelo do fluxo termina em "conferir"', () => {
    for (const arquivo of [
      'produto-em-destaque.json',
      'oferta-e-preco.json',
      'lista-de-beneficios.json',
      'antes-e-depois.json',
    ]) {
      const screens = buildScreens(projetoGuiado(arquivo));
      expect(screens.at(-1)?.kind, arquivo).toBe('conferir');
    }
  });

  it('índice salvo fora da faixa não trava o fluxo', () => {
    const screens = buildScreens(projetoGuiado('produto-em-destaque.json'));
    expect(clampScreen(-3, screens)).toBe(0);
    expect(clampScreen(999, screens)).toBe(screens.length - 1);
    expect(clampScreen(NaN, screens)).toBe(0);
    expect(clampScreen(2, screens)).toBe(2);
  });

  it('texto obrigatório em branco não avança; opcional avança', () => {
    // Nenhum roteiro autoral de texto usa `optional` hoje — o caso opcional é
    // marcado aqui no teste, porque o comportamento do motor precisa continuar
    // valendo para o próximo modelo que o use.
    const project = projetoGuiado('produto-em-destaque.json');
    const layers = project.layouts[project.baseFormat].layers;
    const camadaSub = layers.find((l) => l.guide?.role === 'subtitulo')!;
    camadaSub.guide!.optional = true;

    const screens = buildScreens(project);
    const titulo = screens.find((s) => s.guide?.role === 'titulo')!;
    const opcional = screens.find((s) => s.guide?.optional && s.kind === 'texto')!;

    const alvo = layers.find((l) => l.id === titulo.layerId)!;
    if (alvo.type === 'text') alvo.content = '   ';
    expect(podeAvancar(titulo, project)).toBe(false);

    if (alvo.type === 'text') alvo.content = 'Oferta da semana';
    expect(podeAvancar(titulo, project)).toBe(true);

    const alvoOpcional = layers.find((l) => l.id === opcional.layerId)!;
    if (alvoOpcional.type === 'text') alvoOpcional.content = '';
    expect(podeAvancar(opcional, project)).toBe(true);
  });

  it('a logo pulável e vazia é identificada para não sobreviver ao fluxo', () => {
    const project = projetoGuiado('produto-em-destaque.json');
    const vazias = emptySkippedLogos(project);
    expect(vazias).toHaveLength(1);

    // Preenchida, deixa de ser candidata à remoção.
    const layer = project.layouts[project.baseFormat].layers.find((l) => l.id === vazias[0])!;
    if (layer.type === 'image') layer.assetId = 'asset-qualquer';
    expect(emptySkippedLogos(project)).toHaveLength(0);
  });

  it('logo NÃO pulável nunca entra na lista de remoção', () => {
    // O caso "a logo é o modelo inteiro" (ex-Marca em destaque, gerado que foi
    // removido) vive no motor, não em arquivo: sem `optional: true`, a camada
    // fica fora da limpeza mesmo vazia.
    const project = projetoGuiado('produto-em-destaque.json');
    for (const layout of Object.values(project.layouts)) {
      const logo = layout.layers.find((l) => l.guide?.role === 'logo');
      if (logo?.guide) delete logo.guide.optional;
    }
    expect(emptySkippedLogos(project)).toHaveLength(0);
  });
});
