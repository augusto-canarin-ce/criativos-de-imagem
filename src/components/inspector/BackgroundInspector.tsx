import type { Fill } from '@/lib/model/types';
import { useEditor } from '@/lib/store/editor';
import { getFormat } from '@/config/formats';
import { ColorField, Row, SectionTitle } from './controls';

// Sem seleção, o inspector mostra as propriedades do fundo e do formato. O fundo do
// Layout é sempre opaco (SPEC §6) — gradiente de fundo chega na Fase 4.

export function BackgroundInspector() {
  const activeFormat = useEditor((s) => s.activeFormat);
  const background = useEditor((s) => s.history?.present.layouts[activeFormat].background);
  const setBackground = useEditor((s) => s.setBackground);
  const format = getFormat(activeFormat);
  if (!background) return null;
  const solid = background.kind === 'solid' ? background.color : '#ffffff';

  return (
    <div className="p-3">
      <SectionTitle>Fundo</SectionTitle>
      <Row label="Cor">
        <ColorField value={solid} onCommit={(hex) => setBackground({ kind: 'solid', color: hex } as Fill)} />
      </Row>
      <SectionTitle>Formato</SectionTitle>
      <p className="text-xs text-muted-foreground">
        {format.label} · {format.width}×{format.height}px
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        Selecione uma camada para editar suas propriedades, ou clique numa ferramenta para
        inserir.
      </p>
    </div>
  );
}
