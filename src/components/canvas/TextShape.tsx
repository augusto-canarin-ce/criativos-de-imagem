import { Text } from 'react-konva';
import type { TextLayer } from '@/lib/model/types';
import { fillToSolid } from '@/lib/render/fill';
import { fontStack } from '@/lib/fonts/stacks';
import { fontStyleFor, konvaText } from './textMetrics';

// Render de uma TextLayer no Konva. Gradiente em texto e marca-texto chegam na
// Fase 4; aqui, preenchimento sólido. As métricas ficam em `textMetrics` para o
// editor sobreposto (o <textarea>) usar exatamente os mesmos valores e o texto não
// "pular" ao entrar/sair da edição (SPEC §8).

export function TextShape({ layer }: { layer: TextLayer }) {
  return (
    <Text
      width={layer.frame.w}
      height={layer.frame.h}
      text={konvaText(layer)}
      fontFamily={fontStack(layer.fontFamily)}
      fontSize={layer.fontSize}
      fontStyle={fontStyleFor(layer.fontWeight)}
      lineHeight={layer.lineHeight}
      letterSpacing={layer.letterSpacing}
      align={layer.align}
      verticalAlign={layer.vAlign === 'middle' ? 'middle' : layer.vAlign === 'bottom' ? 'bottom' : 'top'}
      textDecoration={layer.underline ? 'underline' : ''}
      fill={fillToSolid(layer.fill)}
      wrap="word"
      listening
    />
  );
}
