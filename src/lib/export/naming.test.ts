import { describe, it, expect } from 'vitest';
import { exportFileName, projectFileName, slugify, zipFileName } from './naming';

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
