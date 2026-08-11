import { useLayoutEffect, useRef, useState } from 'react';
import { Stage, Layer as KonvaLayer } from 'react-konva';
import { useEditor, selectProject } from '@/lib/store/editor';
import { getFormat } from '@/config/formats';
import { StageScene } from '@/components/canvas/StageScene';

// Preview ao vivo do modo guiado. Mesmo StageScene do editor e do export — o
// caminho de render é único (§11), então o que a pessoa vê aqui é o que sai no
// arquivo. Não é interativo: no fluxo guiado nada se edita clicando na imagem.
//
// Mostra sempre o formato BASE. Os três só aparecem no passo 5.

export function GuidedPreview() {
  const project = useEditor(selectProject);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Medida SÍNCRONA no layout, antes de pintar. O ResizeObserver sozinho não
  // basta: em página oculta (aba em segundo plano) o callback dele não é
  // entregue — é a mesma armadilha do requestAnimationFrame que já nos custou o
  // export travado. Com a medida inicial no layout, o preview nasce certo e o
  // observer cuida só das mudanças de tamanho depois.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const medir = () => {
      const { width, height } = el.getBoundingClientRect();
      setSize((atual) => (atual.w === width && atual.h === height ? atual : { w: width, h: height }));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // O elemento medido é renderizado SEMPRE. Se ele só aparecesse depois de o
  // projeto carregar, o ResizeObserver (efeito com deps []) já teria rodado
  // contra um ref nulo e nunca mais mediria nada — o preview ficava em branco
  // dependendo da ordem de montagem.
  const format = project ? getFormat(project.baseFormat) : null;
  const layout = project && format ? project.layouts[project.baseFormat] : null;

  const scale =
    format && size.w && size.h ? Math.min(size.w / format.width, size.h / format.height) : 0;

  return (
    <div ref={box} className="flex h-full w-full items-center justify-center">
      {format && layout && scale > 0 && (
        <div
          className="overflow-hidden rounded-xl shadow-lg ring-1 ring-hairline"
          style={{ width: format.width * scale, height: format.height * scale }}
        >
          <Stage width={format.width * scale} height={format.height * scale} listening={false}>
            <KonvaLayer scaleX={scale} scaleY={scale}>
              <StageScene
                format={format}
                layout={layout}
                showSafeArea={false}
                interactive={false}
                chrome={false}
              />
            </KonvaLayer>
          </Stage>
        </div>
      )}
    </div>
  );
}
