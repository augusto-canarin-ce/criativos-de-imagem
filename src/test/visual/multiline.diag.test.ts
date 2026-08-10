import { describe, it, expect } from 'vitest';
import Konva from 'konva';

// DIAGNÓSTICO do bug de texto multilinha: Konva.Text com ALTURA FIXA não recorta
// visualmente — ele DERRUBA linhas inteiras que não cabem (textArr truncado).
// Qualquer frame.h alguns px abaixo da altura real do conteúdo apaga a 2ª linha.

describe('comportamento do Konva.Text com altura fixa', () => {
  function make(height?: number) {
    const t = new Konva.Text({
      text: 'Máquina de Clientes',
      width: 400,
      fontSize: 60,
      lineHeight: 1.1,
      fontFamily: 'Arial',
      wrap: 'word',
      ...(height ? { height } : {}),
    });
    return { lines: (t as unknown as { textArr: { text: string }[] }).textArr, measured: t.height() };
  }

  it('sem altura fixa: 2 linhas; altura exata: 2 linhas; altura -3px: DERRUBA a 2ª', () => {
    const free = make();
    expect(free.lines.length).toBe(2);

    const exact = make(Math.ceil(free.measured));
    expect(exact.lines.length).toBe(2);

    const short = make(Math.ceil(free.measured) - 3);
    expect(short.lines.length).toBe(1); // ← o bug: linha inteira some
    expect(short.lines[0].text).toContain('Máquina');
  });
});
