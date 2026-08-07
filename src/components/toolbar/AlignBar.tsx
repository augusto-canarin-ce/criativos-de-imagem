import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
  StretchHorizontal,
  StretchVertical,
} from 'lucide-react';
import { useEditor } from '@/lib/store/editor';
import type { AlignOp } from '@/lib/layout/align';

// Alinhar/distribuir/esticar (SPEC §8): seis alinhamentos + duas distribuições +
// 100% da largura/altura. Uma camada → relativo ao canvas; várias → à seleção.

const ALIGNS: { op: AlignOp; icon: React.ReactNode; title: string }[] = [
  { op: 'left', icon: <AlignStartVertical className="size-3.5" />, title: 'Alinhar à esquerda' },
  { op: 'hcenter', icon: <AlignCenterVertical className="size-3.5" />, title: 'Centralizar na horizontal' },
  { op: 'right', icon: <AlignEndVertical className="size-3.5" />, title: 'Alinhar à direita' },
  { op: 'top', icon: <AlignStartHorizontal className="size-3.5" />, title: 'Alinhar ao topo' },
  { op: 'vcenter', icon: <AlignCenterHorizontal className="size-3.5" />, title: 'Centralizar na vertical' },
  { op: 'bottom', icon: <AlignEndHorizontal className="size-3.5" />, title: 'Alinhar à base' },
];

export function AlignBar() {
  const selectedCount = useEditor((s) => s.selectedIds.length);
  const alignSelection = useEditor((s) => s.alignSelection);
  const distributeSelection = useEditor((s) => s.distributeSelection);
  const stretchSelection = useEditor((s) => s.stretchSelection);

  if (selectedCount === 0) return null;
  const btn =
    'grid size-7 place-items-center rounded-md text-mute hover:bg-ink/10 hover:text-ink disabled:pointer-events-none disabled:opacity-35';

  return (
    <div className="flex items-center gap-0.5">
      <div className="mx-1 h-5 w-px bg-hairline" />
      {ALIGNS.map(({ op, icon, title }) => (
        <button key={op} className={btn} title={title} onClick={() => alignSelection(op)}>
          {icon}
        </button>
      ))}
      <button
        className={btn}
        title="Distribuir na horizontal (3+ camadas)"
        disabled={selectedCount < 3}
        onClick={() => distributeSelection('h')}
      >
        <AlignHorizontalSpaceBetween className="size-3.5" />
      </button>
      <button
        className={btn}
        title="Distribuir na vertical (3+ camadas)"
        disabled={selectedCount < 3}
        onClick={() => distributeSelection('v')}
      >
        <AlignVerticalSpaceBetween className="size-3.5" />
      </button>
      <div className="mx-1 h-5 w-px bg-hairline" />
      <button className={btn} title="Esticar para 100% da largura" onClick={() => stretchSelection('width')}>
        <StretchHorizontal className="size-3.5" />
      </button>
      <button className={btn} title="Esticar para 100% da altura" onClick={() => stretchSelection('height')}>
        <StretchVertical className="size-3.5" />
      </button>
    </div>
  );
}
