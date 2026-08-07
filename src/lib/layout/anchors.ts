import type { Anchor, Frame } from '@/lib/model/types';

// Redistribuição vertical — o núcleo da adaptação (SPEC §7, passo 3).
//
// Os três formatos têm 1080px de largura; só a altura muda. Δ = altura de destino −
// altura de origem, e cada camada reage conforme sua âncora vertical:
//   'top'     → y inalterado
//   'bottom'  → y += Δ
//   'center'  → y += Δ / 2
//   'stretch' → h += Δ   (gradiente de legibilidade, faixas, overlays, fundos)
// x, w, fontSize, tracking, raio, sombra e blur ficam INTACTOS — é exatamente por
// não mexer neles que o resultado sai limpo. NÃO adicione escala horizontal aqui.

export function adaptFrame(frame: Frame, anchor: Anchor, delta: number): Frame {
  switch (anchor.v) {
    case 'top':
      return { ...frame };
    case 'bottom':
      return { ...frame, y: frame.y + delta };
    case 'center':
      return { ...frame, y: frame.y + delta / 2 };
    case 'stretch':
      return { ...frame, h: Math.max(1, frame.h + delta) };
  }
}
