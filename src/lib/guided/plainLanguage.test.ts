import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { templateSchema } from '@/lib/model/schema';
import { projectFromTemplate } from '@/lib/db/templates';
import { FORMAT_IDS } from '@/config/formats';
import { JARGAO_PROIBIDO } from '@/config/guided';
import type { ChecklistWarning } from '@/lib/export/checklist';
import type { Project } from '@/lib/model/types';
import { avisosParaLeigo, DICA_DO_FORMATO, NOME_DO_FORMATO, nomeAmigavel } from './plainLanguage';

function projeto(arquivo = 'oferta-em-destaque.json'): Project {
  const p = fileURLToPath(new URL(`../../../public/templates/${arquivo}`, import.meta.url));
  const t = templateSchema.parse(JSON.parse(readFileSync(p, 'utf8')));
  return projectFromTemplate(t, { guided: true }).project;
}

const TODOS_OS_KINDS: ChecklistWarning['kind'][] = [
  'placeholder-vazio',
  'fora-da-safe-zone',
  'contraste',
  'fonte-pequena',
  'imagem-ampliada',
  'fonte-nao-carregada',
  'texto-demais',
];

describe('checklist em linguagem de quem não é designer (§18)', () => {
  it('traduz TODOS os tipos de aviso — nenhum cai em branco', () => {
    const p = projeto();
    const titulo = p.layouts['4:5'].layers.find((l) => l.guide?.role === 'titulo')!;

    for (const kind of TODOS_OS_KINDS) {
      const w: ChecklistWarning = {
        kind,
        severity: 'aviso',
        formatId: '9:16',
        layerName: titulo.name,
        message: 'mensagem técnica original',
      };
      const [aviso] = avisosParaLeigo([w], p);
      expect(aviso, kind).toBeDefined();
      expect(aviso.texto.length, kind).toBeGreaterThan(20);
      expect(aviso.texto, kind).not.toContain('mensagem técnica');
    }
  });

  it('nenhuma tradução usa jargão', () => {
    const p = projeto();
    const titulo = p.layouts['4:5'].layers.find((l) => l.guide?.role === 'titulo')!;
    const textos = [
      ...TODOS_OS_KINDS.flatMap((kind) =>
        avisosParaLeigo(
          [{ kind, severity: 'aviso', formatId: '9:16', layerName: titulo.name, message: '' }],
          p,
        ).map((a) => a.texto),
      ),
      ...Object.values(NOME_DO_FORMATO),
      ...Object.values(DICA_DO_FORMATO),
    ];
    for (const texto of textos) {
      for (const palavra of JARGAO_PROIBIDO) {
        expect(texto.toLowerCase(), texto).not.toContain(palavra);
      }
    }
  });

  it('o mesmo problema nos três formatos vira UMA linha', () => {
    const p = projeto();
    const titulo = p.layouts['4:5'].layers.find((l) => l.guide?.role === 'titulo')!;
    const avisos = avisosParaLeigo(
      FORMAT_IDS.map((formatId) => ({
        kind: 'fonte-pequena' as const,
        severity: 'aviso' as const,
        formatId,
        layerName: titulo.name,
        message: '',
      })),
      p,
    );
    expect(avisos).toHaveLength(1);
    expect(avisos[0].formatos).toEqual(FORMAT_IDS);
    expect(avisos[0].texto).toContain('nos três formatos');
  });

  it('fonte pequena e contraste em camada decorativa do modelo não viram aviso', () => {
    // O "Antes e depois" desenhado à mão usa etiquetas de 20px de propósito
    // (ANTES/DEPOIS). A pessoa não consegue mudar isso no fluxo — cobrá-la seria
    // ruído sobre uma decisão de quem desenhou o modelo.
    const p = projeto('antes-e-depois.json');
    const etiqueta = p.layouts['4:5'].layers.find((l) => l.name === 'Rótulo antes')!;
    expect(etiqueta.guide).toBeUndefined();

    const avisos = avisosParaLeigo(
      (['fonte-pequena', 'contraste'] as const).map((kind) => ({
        kind,
        severity: 'aviso' as const,
        formatId: '4:5' as const,
        layerName: etiqueta.name,
        message: '',
      })),
      p,
    );
    expect(avisos).toHaveLength(0);

    // Na camada COM roteiro (o título), os mesmos avisos continuam aparecendo.
    const titulo = p.layouts['4:5'].layers.find((l) => l.guide?.role === 'titulo')!;
    const doTitulo = avisosParaLeigo(
      [{ kind: 'fonte-pequena', severity: 'aviso', formatId: '4:5', layerName: titulo.name, message: '' }],
      p,
    );
    expect(doTitulo).toHaveLength(1);
  });

  it('área segura só vale para o que a pessoa colocou, não para enfeite do modelo', () => {
    const p = projeto();
    const decorativa = p.layouts['4:5'].layers.find((l) => l.name === 'Sombreado')!;
    expect(decorativa.guide).toBeUndefined();

    const avisos = avisosParaLeigo(
      [
        {
          kind: 'fora-da-safe-zone',
          severity: 'aviso',
          formatId: '9:16',
          layerName: decorativa.name,
          message: '',
        },
      ],
      p,
    );
    expect(avisos).toHaveLength(0);
  });

  it('o aviso do Stories explica o que a interface do Instagram cobre', () => {
    const p = projeto();
    const titulo = p.layouts['4:5'].layers.find((l) => l.guide?.role === 'titulo')!;
    const [aviso] = avisosParaLeigo(
      [
        {
          kind: 'fora-da-safe-zone',
          severity: 'aviso',
          formatId: '9:16',
          layerName: titulo.name,
          message: '',
        },
      ],
      p,
    );
    expect(aviso.texto).toContain('Stories');
    expect(aviso.texto).toContain('Instagram');
    expect(aviso.acao).toBe('puxar-para-dentro');
  });

  it('placeholder vazio vira convite para escolher a imagem', () => {
    const p = projeto();
    const foto = p.layouts['4:5'].layers.find((l) => l.guide?.role === 'foto-principal')!;
    const [aviso] = avisosParaLeigo(
      [
        {
          kind: 'placeholder-vazio',
          severity: 'destaque',
          formatId: '4:5',
          layerName: foto.name,
          message: '',
        },
      ],
      p,
    );
    expect(aviso.texto).toContain('a foto');
    expect(aviso.acao).toBe('escolher-imagem');
    expect(aviso.grave).toBe(true);
  });

  it('nomeia os elementos pelo papel, não pelo nome interno do modelo', () => {
    const p = projeto();
    const camadas = p.layouts['4:5'].layers;
    expect(nomeAmigavel(camadas.find((l) => l.guide?.role === 'titulo'))).toBe('o título');
    expect(nomeAmigavel(camadas.find((l) => l.guide?.role === 'botao'))).toBe('o texto do botão');
    expect(nomeAmigavel(camadas.find((l) => l.guide?.role === 'logo'))).toBe('a sua logo');
    expect(nomeAmigavel(camadas.find((l) => l.name === 'Sombreado'))).toBe('um elemento');
  });
});
