import { describe, expect, it } from 'vitest';
import { aplicarCor, corEm, mapaParaExibicao, remapSpans, trechosDe } from './textSpans';

describe('trechos coloridos', () => {
  it('pinta um trecho e funde vizinhos da mesma cor', () => {
    let s = aplicarCor(undefined, 0, 4, '#f00');
    s = aplicarCor(s, 4, 8, '#f00');
    expect(s).toEqual([{ start: 0, end: 8, color: '#f00' }]);
  });

  it('pintar por cima recorta o que existia', () => {
    let s = aplicarCor(undefined, 0, 10, '#f00');
    s = aplicarCor(s, 3, 6, '#0f0');
    expect(s).toEqual([
      { start: 0, end: 3, color: '#f00' },
      { start: 3, end: 6, color: '#0f0' },
      { start: 6, end: 10, color: '#f00' },
    ]);
    expect(corEm(s, 4)).toBe('#0f0');
    expect(corEm(s, 11)).toBeUndefined();
  });

  it('digitar ANTES do trecho desliza; DEPOIS mantém; DENTRO recorta', () => {
    const texto = 'Seu bolo chega';
    expect(texto.slice(4, 8)).toBe('bolo');
    const base = aplicarCor(undefined, 4, 8, '#f00');
    expect(remapSpans(base, texto, 'O ' + texto)).toEqual([{ start: 6, end: 10, color: '#f00' }]);
    expect(remapSpans(base, texto, texto + ' hoje')).toEqual([{ start: 4, end: 8, color: '#f00' }]);
    // apaga "lo" (índices 6-8): sobra "bo"
    expect(remapSpans(base, texto, 'Seu bo chega')).toEqual([{ start: 4, end: 6, color: '#f00' }]);
    // apaga a palavra inteira: o trecho some
    expect(remapSpans(base, texto, 'Seu  chega')).toBeUndefined();
  });

  it('divide uma linha em trechos com e sem cor', () => {
    const s = aplicarCor(undefined, 4, 8, '#f00');
    expect(trechosDe(0, 12, s)).toEqual([
      { start: 0, end: 4, color: null },
      { start: 4, end: 8, color: '#f00' },
      { start: 8, end: 12, color: null },
    ]);
    // linha que começa no meio do trecho
    expect(trechosDe(6, 12, s)).toEqual([
      { start: 6, end: 8, color: '#f00' },
      { start: 8, end: 12, color: null },
    ]);
  });

  it('mapa de exibição acompanha o bullet ("•  " por linha não vazia)', () => {
    expect(mapaParaExibicao('ab', false)).toEqual([0, 1, 2]);
    // "ab\ncd" vira "•  ab\n•  cd": a=3, b=4, \n=5, c=9, d=10, fim=11
    expect(mapaParaExibicao('ab\ncd', true)).toEqual([3, 4, 5, 9, 10, 11]);
    // linha vazia não ganha prefixo
    expect(mapaParaExibicao('a\n\nb', true)).toEqual([3, 4, 5, 9, 10]);
  });
});
