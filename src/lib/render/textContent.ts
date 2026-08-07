import type { TextLayer } from '@/lib/model/types';

/** Texto final renderizado: aplica caixa alta e bullet de um nível. Fonte única da
 *  verdade para o nó Konva, o <textarea> de edição e o medidor de auto-fit. */
export function konvaText(layer: TextLayer): string {
  let text = layer.content;
  if (layer.transform === 'uppercase') text = text.toUpperCase();
  if (layer.bullet) {
    text = text
      .split('\n')
      .map((line) => (line.length ? `•  ${line}` : line))
      .join('\n');
  }
  return text;
}
