import Konva from 'konva';
import type { TextLayer } from '@/lib/model/types';
import { fontStack } from '@/lib/fonts/stacks';
import { konvaText } from './textContent';
import { mapaParaExibicao, trechosDe } from '@/lib/model/textSpans';

// Layout de texto com trechos coloridos (2026-09-22). O Konva.Text não pinta
// letras com cores diferentes, então a camada vira vários nós — um por trecho
// por linha. A QUEBRA DE LINHA continua sendo a do próprio Konva: um nó
// idêntico ao do caminho simples é criado fora da tela só para ler `textArr`,
// o que garante as mesmas quebras e larguras que o texto teria sem cores.

export interface RunLayout {
  text: string;
  x: number;
  y: number;
  /** `null` = cor da camada. */
  color: string | null;
}

export interface RichLayout {
  runs: RunLayout[];
  lineHeightPx: number;
  totalHeight: number;
}

export function layoutRichText(layer: TextLayer): RichLayout {
  const display = konvaText(layer);
  const node = new Konva.Text({
    text: display,
    width: layer.frame.w,
    fontSize: layer.fontSize,
    fontFamily: fontStack(layer.fontFamily),
    fontStyle: String(layer.fontWeight),
    lineHeight: layer.lineHeight,
    letterSpacing: layer.letterSpacing,
    align: layer.align,
    wrap: 'word',
  });
  const lines = node.textArr;
  const lineHeightPx = layer.fontSize * layer.lineHeight;

  // Trechos em coordenadas do texto exibido (o bullet desloca índices).
  const mapa = mapaParaExibicao(layer.content, layer.bullet);
  const spans = (layer.spans ?? []).map((s) => ({
    start: mapa[Math.min(s.start, layer.content.length)],
    end: mapa[Math.min(s.end, layer.content.length)],
    color: s.color,
  }));

  const runs: RunLayout[] = [];
  let cursor = 0;
  lines.forEach((line, i) => {
    // As linhas do Konva são substrings contíguas do texto exibido (ele só
    // descarta o espaço onde quebrou): a próxima ocorrência a partir do
    // cursor é a linha certa.
    let idx = display.indexOf(line.text, cursor);
    if (idx < 0) idx = cursor;
    const inicio = idx;
    const fim = idx + line.text.length;
    cursor = fim;

    const lineX =
      layer.align === 'center'
        ? (layer.frame.w - line.width) / 2
        : layer.align === 'right'
          ? layer.frame.w - line.width
          : 0;
    let x = lineX;
    for (const t of trechosDe(inicio, fim, spans)) {
      const text = display.slice(t.start, t.end);
      runs.push({ text, x, y: i * lineHeightPx, color: t.color });
      // A mesma medida que o Konva usa para a largura da linha (inclui tracking).
      x += node._getTextWidth(text);
    }
  });
  node.destroy();
  return { runs, lineHeightPx, totalHeight: lines.length * lineHeightPx };
}
