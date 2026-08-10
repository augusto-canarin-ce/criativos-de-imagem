import { describe, it, expect } from 'vitest';
import { applyExportPattern, exportFileName, projectFileName, slugify, zipFileName } from './naming';

describe('slugify', () => {
  it('minúsculas, sem acentos, espaços viram hífen', () => {
    expect(slugify('Black Friday — frete grátis')).toBe('black-friday-frete-gratis');
    expect(slugify('Promoção de Inauguração!')).toBe('promocao-de-inauguracao');
  });
  it('nome vazio ou só símbolos cai para "criativo"', () => {
    expect(slugify('***')).toBe('criativo');
    expect(slugify('')).toBe('criativo');
  });
});

describe('nomes de arquivo (SPEC §11)', () => {
  it('segue {projeto}_{dims}_v{n}.{ext}', () => {
    expect(exportFileName('BlackFriday Frete', '4:5', 'jpg')).toBe(
      'blackfriday-frete_1080x1350_v1.jpg',
    );
    expect(exportFileName('X', '9:16', 'png', 3)).toBe('x_1080x1920_v3.png');
  });
  it('zip com data', () => {
    expect(zipFileName('BlackFriday Frete', new Date(2026, 7, 6))).toBe(
      'blackfriday-frete_2026-08-06.zip',
    );
  });
  it('arquivo de projeto', () => {
    expect(projectFileName('Minha Campanha')).toBe('minha-campanha.criativo');
  });
});

describe('padrão de nome configurável (§11, Fase 7)', () => {
  it('preenche os marcadores', () => {
    expect(applyExportPattern('{projeto}_{formato}_v{n}', 'Black Friday', '4:5', 2)).toBe(
      'black-friday_1080x1350_v2',
    );
    expect(applyExportPattern('meta-{formato}', 'X', '9:16', 1)).toBe('meta-1080x1920');
  });

  it('remove caracteres inválidos de nome de arquivo', () => {
    expect(applyExportPattern('a/b:c*{projeto}', 'X', '1:1', 1)).toBe('a-b-c-x');
  });

  it('padrão vazio ou só símbolos cai no nome de fábrica', () => {
    expect(applyExportPattern('', 'Campanha', '1:1', 1)).toBe('campanha_1080x1080_v1');
    expect(applyExportPattern('   ', 'Campanha', '1:1', 1)).toBe('campanha_1080x1080_v1');
  });

  it('exportFileName usa o padrão quando recebe um', () => {
    expect(exportFileName('Campanha', '1:1', 'png', 3, '{projeto}-{n}')).toBe('campanha-3.png');
  });
});
