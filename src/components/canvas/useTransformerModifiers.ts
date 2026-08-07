import { useEffect } from 'react';
import type Konva from 'konva';

// Modificadores de redimensionamento, padrão Figma/Photoshop:
//   Shift        → trava a proporção
//   Option/Alt   → redimensiona a partir do centro
//   Shift+Option → os dois: cresce igual em todas as direções, sem deformar
// Aplicados ao vivo no Transformer — funcionam inclusive no meio do arraste.

export function useTransformerModifiers(trRef: React.RefObject<Konva.Transformer | null>): void {
  useEffect(() => {
    function apply(e: KeyboardEvent | { shiftKey: boolean; altKey: boolean }) {
      const tr = trRef.current;
      if (!tr) return;
      tr.keepRatio(e.shiftKey);
      tr.centeredScaling(e.altKey);
    }
    const onKey = (e: KeyboardEvent) => apply(e);
    const onBlur = () => apply({ shiftKey: false, altKey: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('blur', onBlur);
    };
  }, [trRef]);
}
