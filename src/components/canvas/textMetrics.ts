import type { TextLayer } from '@/lib/model/types';
import { fontStack } from '@/lib/fonts/stacks';

// Fonte da verdade das métricas de texto, compartilhada entre o nó Konva e o
// <textarea> de edição. Qualquer divergência aqui vira um "salto" visual ao entrar
// ou sair da edição (SPEC §8), então os dois lados leem exatamente destas funções.

/** Peso da fonte no formato aceito pelo shorthand de fonte do canvas ("700 96px …"). */
export function fontStyleFor(weight: number): string {
  return String(weight);
}

/** Texto final renderizado: aplica caixa alta e bullet de um nível. */
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

/** Estilos CSS para o <textarea> baterem com o nó Konva. `scale` = escala do stage. */
export function textareaStyle(layer: TextLayer, scale: number): React.CSSProperties {
  return {
    fontFamily: fontStack(layer.fontFamily),
    fontSize: `${layer.fontSize * scale}px`,
    fontWeight: layer.fontWeight,
    lineHeight: String(layer.lineHeight),
    letterSpacing: `${layer.letterSpacing * scale}px`,
    textAlign: layer.align,
    textTransform: layer.transform === 'uppercase' ? 'uppercase' : 'none',
    textDecoration: layer.underline ? 'underline' : 'none',
    width: `${layer.frame.w * scale}px`,
    height: `${layer.frame.h * scale}px`,
  };
}
