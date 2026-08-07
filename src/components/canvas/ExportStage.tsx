import { useEffect, useRef } from 'react';
import { Stage, Layer as KonvaLayer } from 'react-konva';
import type Konva from 'konva';
import type { FormatId, Layout } from '@/lib/model/types';
import { getFormat } from '@/config/formats';
import { StageScene } from './StageScene';

// Palco de EXPORT (§11): a MESMA StageScene do preview (LayerNode → shapes — um
// único caminho de render; nenhum código de desenho paralelo), montada no tamanho
// real do formato com escala 1 e sem a câmera do preview. Pré-requisitos antes do
// onReady: imagens já no cache (preload feito pelo diálogo ANTES de montar),
// fontes prontas, e dois rAFs para os efeitos com cache() (blur) assentarem —
// então um draw() síncrono e o stage está pronto para toCanvas({pixelRatio: 1}).

interface Props {
  formatId: FormatId;
  layout: Layout;
  onReady: (formatId: FormatId, stage: Konva.Stage) => void;
}

export function ExportStage({ formatId, layout, onReady }: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const format = getFormat(formatId);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    // Dois macrotasks — NÃO requestAnimationFrame: rAF congela em página oculta
    // (aba em segundo plano) e o export nunca ficaria pronto. setTimeout roda
    // sempre; os useEffects dos filhos (cache de blur) já rodaram, e o draw()
    // final é síncrono por contrato da §11.
    let t2: ReturnType<typeof setTimeout> | undefined;
    const t1 = setTimeout(() => {
      t2 = setTimeout(() => {
        const stage = stageRef.current;
        if (!stage || done.current) return;
        done.current = true;
        stage.draw();
        onReady(formatId, stage);
      }, 0);
    }, 0);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [formatId, onReady]);

  return (
    // Fora da tela, mas RENDERIZADO (display:none quebraria o canvas).
    <div aria-hidden className="pointer-events-none fixed -left-[200vw] top-0 opacity-0">
      <Stage ref={stageRef} width={format.width} height={format.height} listening={false}>
        <KonvaLayer>
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
  );
}
