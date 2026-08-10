import { useEditor } from '@/lib/store/editor';
import { getFormat } from '@/config/formats';
import { SectionTitle } from './controls';
import { FillControl } from './StyleControls';

// Sem seleção, o inspector mostra o fundo (sólido OU gradiente — §8) e o formato.
// O fundo do Layout é sempre opaco (§6); num formato conectado, editar o fundo
// edita a base (o fundo segue a base — decisão da Fase 2).

export function BackgroundInspector() {
  const activeFormat = useEditor((s) => s.activeFormat);
  const background = useEditor((s) => s.history?.present.layouts[activeFormat].background);
  const setBackground = useEditor((s) => s.setBackground);
  const format = getFormat(activeFormat);
  if (!background) return null;

  return (
    <div className="p-3">
      <FillControl label="Fundo" value={background} onChange={setBackground} />
      <SectionTitle>Formato</SectionTitle>
      <p className="text-xs text-mute">
        {format.label} · {format.width}×{format.height}px
      </p>
      <p className="mt-3 text-xs text-mute">
        Selecione uma camada para editar suas propriedades, ou clique numa ferramenta para
        inserir.
      </p>
    </div>
  );
}
