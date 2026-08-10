import { useEffect } from 'react';
import Konva from 'konva';
import type { ImageLayer } from '@/lib/model/types';

// Ajustes de imagem (SPEC §8): brilho, contraste, saturação e blur via filtros do
// Konva. Filtro exige cache() no nó — sem isso não aparece; o cache é invalidado a
// cada mudança de parâmetro (o objeto layer troca de identidade via Immer). O
// debounce de 120ms fica nos sliders (SliderField debounceMs).

const isDefault = (a: ImageLayer['adjust']): boolean =>
  a.brightness === 0 && a.contrast === 0 && a.saturation === 0 && a.blur === 0;

export function useImageFilters(
  ref: React.RefObject<Konva.Node | null>,
  layer: ImageLayer,
  extraDeps: unknown[],
): void {
  const { adjust } = layer;
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (isDefault(adjust)) {
      if (node.isCached()) {
        node.filters([]);
        node.clearCache();
      }
    } else {
      const filters: typeof Konva.Filters.Blur[] = [];
      if (adjust.brightness !== 0) filters.push(Konva.Filters.Brighten);
      if (adjust.contrast !== 0) filters.push(Konva.Filters.Contrast);
      if (adjust.saturation !== 0) filters.push(Konva.Filters.HSV);
      if (adjust.blur > 0) filters.push(Konva.Filters.Blur);
      node.cache({ pixelRatio: 1 });
      node.filters(filters);
      const n = node as Konva.Node & {
        brightness: (v: number) => void;
        contrast: (v: number) => void;
        saturation: (v: number) => void;
        blurRadius: (v: number) => void;
      };
      n.brightness(adjust.brightness / 100); //  UI −100..100 → −1..1
      n.contrast(adjust.contrast); //            −100..100 direto
      n.saturation(1 + adjust.saturation / 100); // multiplicativo, 1 = neutro
      n.blurRadius(adjust.blur);
    }
    node.getLayer()?.batchDraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjust.brightness, adjust.contrast, adjust.saturation, adjust.blur, ...extraDeps]);
}
