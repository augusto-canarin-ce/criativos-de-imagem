import { useEffect } from 'react';
import Konva from 'konva';

// Blur via filtro do Konva. Filtro exige cache() no nó — sem isso não aparece
// (SPEC §8). O cache é invalidado sempre que as deps visuais mudam (o objeto da
// camada troca de identidade a cada edição via Immer, então basta passá-lo).

export function useNodeBlur(
  ref: React.RefObject<Konva.Node | null>,
  blur: number | undefined,
  deps: unknown[],
): void {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (blur && blur > 0) {
      node.cache({ pixelRatio: 1 });
      node.filters([Konva.Filters.Blur]);
      (node as Konva.Node & { blurRadius: (v: number) => void }).blurRadius(blur);
    } else if (node.isCached()) {
      node.filters([]);
      node.clearCache();
    }
    node.getLayer()?.batchDraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blur, ...deps]);
}
