import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { TEXTO_PARA_GUIA, IMAGEM_PARA_GUIA } from './templatize';
import { guideRoleSchema } from './schema';

// A convenção de nomes de camada vive em DOIS lugares: as tabelas de regras do
// templatize (código) e a tabela da SPEC §18 (documentação). Manter as duas à
// mão já nos mordeu duas vezes (preco/selo, nome/cargo) — este teste torna a
// tabela da SPEC executável: divergiu, quebrou, e a mensagem diz O QUE FAZER.
//
// Se o parse do markdown virar dor de cabeça um dia, o caminho combinado
// (2026-08-13) é INVERTER a dependência: a convenção mora só no código e a
// seção da SPEC passa a ser gerada a partir dela. Nunca voltar às duas à mão.

const SPEC = readFileSync(
  fileURLToPath(new URL('../../../docs/SPEC.md', import.meta.url)),
  'utf8',
);

// Linhas da tabela FORA da checagem exata termo↔regra, com o porquê:
//
// - "Foto/Imagem + Produto/Pessoa/…" — família ABERTA: o "…" significa que
//   qualquer termo combinado com Foto/Imagem vira pergunta específica. Os
//   termos citados são exemplos das regras genéricas de foto; exigir papel
//   exato por termo quebraria justamente porque a linha é aberta de propósito.
// - "ANTES · DEPOIS" — papel duplo numa linha só (foto-principal ·
//   foto-secundaria), e a demoção "só a primeira foto é principal" é
//   estrutural (inferGuides), não nominal.
//
// Para estas, o teste só cobra que os termos reconhecíveis existam nas regras
// de IMAGEM — sem papel exato por termo.
const LINHAS_ESTRUTURAIS = ['Foto/Imagem', 'ANTES'];

function semAcento(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

interface LinhaDaTabela {
  termos: string[];
  papeis: string[];
  estrutural: boolean;
}

/** Extrai as linhas da tabela de convenção da SPEC §18. Se o formato da tabela
 *  mudar (cabeçalho, ordem de colunas), este parse quebra alto — fricção aceita
 *  pelo usuário em 2026-08-13 como o preço de a documentação ser executável. */
function linhasDaConvencao(): LinhaDaTabela[] {
  const linhas = SPEC.split('\n');
  const cabecalho = linhas.findIndex((l) => l.includes('| Termo no nome | Papel | Pergunta gerada |'));
  expect(
    cabecalho,
    'Tabela de convenção não encontrada na SPEC §18 — o cabeçalho "| Termo no nome | Papel | Pergunta gerada |" mudou? Restaure-o ou atualize este parse.',
  ).toBeGreaterThan(-1);

  const out: LinhaDaTabela[] = [];
  for (let i = cabecalho + 2; i < linhas.length && linhas[i].startsWith('|'); i++) {
    const celulas = linhas[i].split('|').map((c) => c.trim());
    const [termoCell, papelCell] = [celulas[1], celulas[2]];
    const estrutural = LINHAS_ESTRUTURAIS.some((marca) => termoCell.startsWith(marca));
    out.push({
      termos: termoCell
        .split(/[/+·]/)
        .map((t) => semAcento(t.trim()))
        .filter((t) => t && t !== '…'),
      papeis: papelCell
        .replace(/\(opcional\)/g, '')
        .split('·')
        .map((p) => p.trim())
        .filter(Boolean),
      estrutural,
    });
  }
  expect(out.length, 'Tabela de convenção vazia — o parse ou a SPEC quebraram.').toBeGreaterThan(5);
  return out;
}

const REGRAS = [...TEXTO_PARA_GUIA, ...IMAGEM_PARA_GUIA];
const PAPEIS_DO_ENUM = guideRoleSchema.options as readonly string[];

describe('convenção de nomes: SPEC §18 ↔ regras de inferência ↔ GuideRole', () => {
  const tabela = linhasDaConvencao();

  it('todo papel citado na SPEC existe no enum', () => {
    for (const linha of tabela) {
      for (const papel of linha.papeis) {
        expect(
          PAPEIS_DO_ENUM,
          `SPEC cita o papel "${papel}" que não existe no GuideRole. ` +
            'CORRIGIR: adicione o papel em types.ts (GuideRole) E em schema.ts ' +
            '(guideRoleSchema), ou conserte a célula na tabela da SPEC §18.',
        ).toContain(papel);
      }
    }
  });

  it('todo termo da SPEC tem regra de inferência com o papel prometido', () => {
    for (const linha of tabela.filter((l) => !l.estrutural)) {
      for (const termo of linha.termos) {
        const regra = REGRAS.find((r) => r.contem === termo);
        expect(
          regra,
          `SPEC documenta o termo "${termo}" mas nenhuma regra o reconhece. ` +
            'CORRIGIR: adicione uma regra em TEXTO_PARA_GUIA ou IMAGEM_PARA_GUIA ' +
            `(templatize.ts) com { contem: '${termo}' }, ou remova o termo da tabela da SPEC §18.`,
        ).toBeDefined();
        expect(
          regra!.guide.role,
          `Termo "${termo}": a SPEC promete o papel "${linha.papeis[0]}" mas a regra dá "${regra!.guide.role}". ` +
            'CORRIGIR: alinhe o papel na regra (templatize.ts) ou na tabela da SPEC §18 — um dos dois está mentindo.',
        ).toBe(linha.papeis[0]);
      }
    }
  });

  it('termos das linhas estruturais de foto existem nas regras de imagem', () => {
    const contems = new Set(IMAGEM_PARA_GUIA.map((r) => r.contem));
    for (const linha of tabela.filter((l) => l.estrutural)) {
      for (const termo of linha.termos) {
        expect(
          contems,
          `SPEC cita "${termo}" numa linha estrutural de foto, mas IMAGEM_PARA_GUIA não o reconhece. ` +
            'CORRIGIR: adicione a regra de imagem (templatize.ts) ou tire o termo da tabela da SPEC §18.',
        ).toContain(termo);
      }
    }
  });

  it('toda regra de inferência está documentada na SPEC', () => {
    const termosDaSpec = new Set(tabela.flatMap((l) => l.termos));
    for (const regra of REGRAS) {
      expect(
        termosDaSpec,
        `A regra { contem: '${regra.contem}' } existe no código mas não está na tabela da SPEC §18. ` +
          'CORRIGIR: documente o termo na tabela de convenção (com o papel e a pergunta), ou remova a regra (templatize.ts).',
      ).toContain(regra.contem);
    }
  });

  it('todo papel do enum é produzido por alguma regra — sem papel órfão', () => {
    // Papel órfão = só alcançável escrevendo roteiro à mão no JSON. Foi assim
    // que preco/selo nasceram desalinhados do resto do sistema.
    const produzidos = new Set(REGRAS.map((r) => r.guide.role as string));
    for (const papel of PAPEIS_DO_ENUM) {
      expect(
        produzidos,
        `O papel "${papel}" existe no GuideRole mas nenhuma regra de inferência o produz. ` +
          'CORRIGIR: crie a regra em TEXTO_PARA_GUIA/IMAGEM_PARA_GUIA e documente o termo na ' +
          'SPEC §18, ou remova o papel do enum (types.ts + schema.ts).',
      ).toContain(papel);
    }
  });

  it('toda regra produz papel do enum', () => {
    for (const regra of REGRAS) {
      expect(
        PAPEIS_DO_ENUM,
        `A regra { contem: '${regra.contem}' } produz o papel "${regra.guide.role}" que não está no ` +
          'guideRoleSchema. CORRIGIR: alinhe types.ts e schema.ts (os dois declaram o enum).',
      ).toContain(regra.guide.role);
    }
  });
});
