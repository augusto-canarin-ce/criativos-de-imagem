import { useLayoutEffect, useRef, useState } from 'react';
import type { TextLayer } from '@/lib/model/types';
import { useEditor } from '@/lib/store/editor';
import { fillToSolid } from '@/lib/render/fill';
import { textareaStyle } from './textMetrics';

// Edição de texto no canvas via <textarea> sobreposto exatamente sobre o nó (SPEC §8).
// O nó Konva fica invisível durante a edição (LayerNode cuida disso). Toda a sessão
// é UM passo de undo: o commit acontece só na confirmação, não a cada tecla.

interface Props {
  layer: TextLayer;
  scale: number;
  panX: number;
  panY: number;
}

export function TextEditorOverlay({ layer, scale, panX, panY }: Props) {
  const setEditing = useEditor((s) => s.setEditing);
  const updateLayer = useEditor((s) => s.updateLayer);
  const [value, setValue] = useState(layer.content);
  const composing = useRef(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }, []);

  function confirm() {
    const ta = ref.current;
    // Remede a caixa: se o texto cresceu, cresce a altura do quadro (SPEC §8).
    const grownH = ta ? Math.ceil(ta.scrollHeight / scale) : layer.frame.h;
    updateLayer(layer.id, (l) => {
      if (l.type !== 'text') return;
      l.content = value;
      l.frame.h = Math.max(l.frame.h, grownH);
    });
    setEditing(null);
  }

  function cancel() {
    setEditing(null); // descarta `value`, o conteúdo anterior permanece intacto
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Não interceptar enquanto o navegador compõe (teclas mortas: ã, ç, ô, à).
    if (composing.current || e.nativeEvent.isComposing) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      confirm();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      confirm();
    }
    // Enter sozinho = quebra de linha (comportamento nativo do textarea).
  }

  const style = textareaStyle(layer, scale);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onCompositionStart={() => (composing.current = true)}
      onCompositionEnd={() => (composing.current = false)}
      onKeyDown={onKeyDown}
      onBlur={confirm}
      spellCheck={false}
      className="absolute z-20 m-0 resize-none overflow-hidden border-0 bg-transparent p-0 outline-none"
      style={{
        ...style,
        left: `${panX + layer.frame.x * scale}px`,
        top: `${panY + layer.frame.y * scale}px`,
        transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
        transformOrigin: 'top left',
        color: fillToSolid(layer.fill),
        caretColor: fillToSolid(layer.fill),
      }}
    />
  );
}
