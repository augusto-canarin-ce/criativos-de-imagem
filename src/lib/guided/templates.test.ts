import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { templateSchema } from '@/lib/model/schema';
import { GUIDED_OBJECTIVES, JARGAO_PROIBIDO, resolveObjectiveTemplate } from '@/config/guided';
import type { GuideSlot, Layer, Template } from '@/lib/model/types';

// Os modelos de fábrica são gerados por `scripts/gen-templates.mjs` e vivem em
// public/templates. Este teste é o contrato entre o gerador e o modo guiado
// (SPEC §18): se alguém mexer num modelo e quebrar o roteiro, quebra aqui — e
// não na frente de um usuário que não sabe o que é um placeholder vazio.

const dir = fileURLToPath(new URL('../../../public/templates/', import.meta.url));

function load(file: string): Template {
  return templateSchema.parse(JSON.parse(readFileSync(dir + file, 'utf8')));
}

const index: { id: string; name: string; file: string }[] = JSON.parse(
  readFileSync(dir + 'index.json', 'utf8'),
);
const templates = index.map((e) => ({ entry: e, template: load(e.file) }));

function baseLayers(t: Template): Layer[] {
  return t.project.layouts[t.project.baseFormat].layers;
}

function guides(t: Template): { layer: Layer; guide: GuideSlot }[] {
  return baseLayers(t)
    .filter((l): l is Layer & { guide: GuideSlot } => !!l.guide)
    .map((l) => ({ layer: l, guide: l.guide }));
}

describe('roteiro dos modelos de fábrica (§18)', () => {
  it('os treze modelos são válidos e todos declaram algum roteiro', () => {
    expect(templates).toHaveLength(13);
    for (const { template } of templates) {
      expect(guides(template).length).toBeGreaterThan(0);
    }
  });

  it('nenhuma pergunta ou dica usa jargão', () => {
    for (const { template } of templates) {
      for (const { guide } of guides(template)) {
        const texto = `${guide.question} ${guide.hint ?? ''}`.toLowerCase();
        for (const palavra of JARGAO_PROIBIDO) {
          expect(texto, `"${guide.question}" em ${template.name}`).not.toContain(palavra);
        }
      }
    }
  });

  it('toda pergunta é uma pergunta de verdade', () => {
    for (const { template } of templates) {
      for (const { guide } of guides(template)) {
        expect(guide.question.trim().length, template.name).toBeGreaterThan(4);
        expect(guide.question.trim().endsWith('?'), guide.question).toBe(true);
      }
    }
  });

  it('as dicas começam em maiúscula', () => {
    // A dica aparece como frase logo abaixo da pergunta, em corpo grande.
    for (const { template } of templates) {
      for (const { guide } of guides(template)) {
        if (!guide.hint) continue;
        const inicial = guide.hint[0];
        expect(inicial, `${template.name}: "${guide.hint}"`).toBe(inicial.toUpperCase());
      }
    }
  });

  it('a ordem não empata dentro do mesmo papel', () => {
    for (const { template } of templates) {
      const porGrupo = new Map<string, number[]>();
      for (const { guide } of guides(template)) {
        // Fotos e textos são passos diferentes; a ordem só precisa ser única
        // dentro do passo em que a pergunta aparece.
        const grupo = guide.role.startsWith('foto') ? 'foto' : guide.role === 'logo' ? 'logo' : 'texto';
        porGrupo.set(grupo, [...(porGrupo.get(grupo) ?? []), guide.order]);
      }
      for (const [grupo, ordens] of porGrupo) {
        expect(new Set(ordens).size, `${template.name} · ${grupo}`).toBe(ordens.length);
      }
    }
  });

  it('todo modelo tem no máximo uma foto principal e no máximo uma logo', () => {
    for (const { template } of templates) {
      const papeis = guides(template).map((g) => g.guide.role);
      expect(papeis.filter((r) => r === 'foto-principal').length, template.name).toBeLessThanOrEqual(1);
      expect(papeis.filter((r) => r === 'logo').length, template.name).toBeLessThanOrEqual(1);
    }
  });

  it('só camada de imagem recebe papel de foto ou logo', () => {
    for (const { template } of templates) {
      for (const { layer, guide } of guides(template)) {
        const ehImagem = guide.role.startsWith('foto') || guide.role === 'logo';
        expect(layer.type === 'image', `${template.name} · ${layer.name}`).toBe(ehImagem);
      }
    }
  });

  it('os quatro objetivos do passo 1 RESOLVEM para um modelo com roteiro completo', () => {
    // `resolveObjectiveTemplate` cai no modelo gerado por script enquanto o
    // desenhado à mão não chega — este teste garante que, em qualquer estado da
    // transição, o passo 1 nunca aponta para o vazio nem para modelo sem roteiro.
    for (const objetivo of GUIDED_OBJECTIVES) {
      const template = resolveObjectiveTemplate(
        objetivo,
        templates.map((t) => t.template),
      );
      expect(template, `${objetivo.label}: nenhum candidato existe`).not.toBeNull();

      const papeis = guides(template!).map((g) => g.guide.role);
      // Passo 2 precisa ter o que perguntar.
      expect(papeis, `${objetivo.label} não tem foto principal`).toContain('foto-principal');
      // Passo 3 precisa existir e precisa ser pulável.
      const logo = guides(template!).find((g) => g.guide.role === 'logo');
      expect(logo, `${objetivo.label} não tem espaço de logo`).toBeDefined();
      expect(logo!.guide.optional, `${objetivo.label}: a logo tem que ser pulável`).toBe(true);
      // Passo 4 precisa ter pelo menos um texto.
      expect(papeis.some((r) => ['titulo', 'subtitulo', 'botao'].includes(r)), objetivo.label).toBe(
        true,
      );
    }
  });

  it('os quatro objetivos resolvem para modelos DIFERENTES', () => {
    const resolvidos = GUIDED_OBJECTIVES.map(
      (o) => resolveObjectiveTemplate(o, templates.map((t) => t.template))?.id,
    );
    expect(new Set(resolvidos).size).toBe(4);
  });

  it('o modelo com duas fotos pergunta o ANTES e o DEPOIS, nesta ordem', () => {
    // Requisito literal do briefing de 2026-08-11: o passo 2 do "Antes e depois"
    // vira duas telas, com as perguntas certas.
    const objetivo = GUIDED_OBJECTIVES.find((o) => o.id === 'antes-e-depois')!;
    const template = resolveObjectiveTemplate(objetivo, templates.map((t) => t.template))!;
    const fotos = guides(template)
      .filter((g) => g.guide.role === 'foto-principal' || g.guide.role === 'foto-secundaria')
      .sort((a, b) => a.guide.order - b.guide.order);
    expect(fotos).toHaveLength(2);
    expect(fotos[0].guide.role).toBe('foto-principal');
    expect(fotos[0].guide.question.toUpperCase()).toContain('ANTES');
    expect(fotos[1].guide.role).toBe('foto-secundaria');
    expect(fotos[1].guide.question.toUpperCase()).toContain('DEPOIS');
  });

  it('todo espaço de logo cabe dentro da área segura do formato base', () => {
    // Se a logo nascer fora da margem que a interface da Meta cobre, o fluxo
    // guiado gera um aviso logo depois de a pessoa ter dito "sim" para ela.
    const SAFE = { top: 80, right: 60, bottom: 80, left: 60 };
    const W = 1080;
    const H = 1350;
    for (const { template } of templates) {
      const logo = guides(template).find((g) => g.guide.role === 'logo');
      if (!logo) continue;
      const f = logo.layer.frame;
      expect(f.x, `${template.name}: logo à esquerda demais`).toBeGreaterThanOrEqual(SAFE.left);
      expect(f.y, `${template.name}: logo alta demais`).toBeGreaterThanOrEqual(SAFE.top);
      expect(f.x + f.w, `${template.name}: logo à direita demais`).toBeLessThanOrEqual(W - SAFE.right);
      expect(f.y + f.h, `${template.name}: logo baixa demais`).toBeLessThanOrEqual(H - SAFE.bottom);
    }
  });
});
