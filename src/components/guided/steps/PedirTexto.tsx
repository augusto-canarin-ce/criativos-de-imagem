import { useEffect, useRef } from 'react';
import type { GuidedScreen } from '@/lib/guided/steps';
import { escreverTexto, fecharEdicaoDeTexto } from '@/lib/guided/actions';
import { useEditor, selectProject } from '@/lib/store/editor';
import { Feito, Pergunta } from '../GuidedChrome';

// PASSO 4 (§18): um campo por tela, rotulado pela pergunta que o modelo declara.
// Preview ao vivo a cada tecla.
//
// O campo começa VAZIO. Os modelos vêm com texto de exemplo ("Nome do produto
// aqui", "R$ 99") e ninguém pode publicar isso por ter clicado rápido demais —
// então o exemplo vira sugestão dentro do campo, não conteúdo.

export function PedirTexto({ screen }: { screen: GuidedScreen }) {
  const project = useEditor(selectProject);
  const campo = useRef<HTMLTextAreaElement>(null);
  const exemplo = useRef<string>('');

  const layer = project?.layouts[project.baseFormat].layers.find((l) => l.id === screen.layerId);
  const conteudo = layer?.type === 'text' ? layer.content : '';

  // Na primeira vez que esta tela abre, o texto de exemplo sai do criativo e vira
  // placeholder do campo. Se a pessoa voltar depois, o que ela escreveu fica.
  useEffect(() => {
    if (!screen.layerId || !layer || layer.type !== 'text') return;
    if (!exemplo.current) exemplo.current = layer.content;
    if (layer.content === exemplo.current && exemplo.current !== '') {
      escreverTexto(screen.layerId, '');
      fecharEdicaoDeTexto();
    }
    campo.current?.focus();
    // Só quando a tela muda — não a cada tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen.layerId]);

  const multilinha = (exemplo.current || conteudo).includes('\n') || screen.guide?.role === 'titulo';

  return (
    <div>
      <Pergunta dica={screen.guide?.hint}>{screen.guide?.question}</Pergunta>

      <textarea
        ref={campo}
        value={conteudo}
        rows={multilinha ? 3 : 2}
        placeholder={exemplo.current ? `Por exemplo: ${exemplo.current.replace(/\n/g, ' ')}` : ''}
        onChange={(e) => screen.layerId && escreverTexto(screen.layerId, e.target.value)}
        onBlur={fecharEdicaoDeTexto}
        className="w-full resize-none rounded-xl border border-hairline-strong bg-surface px-5 py-4 text-xl leading-relaxed text-ink placeholder:text-faint focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/30"
      />

      {/* Confirmação visível (2026-08-17): quem digita precisa ver que o texto
          entrou de verdade — o preview lateral sozinho passa despercebido. */}
      {conteudo.trim().length > 0 && (
        <Feito>Concluído! O texto já está no criativo ao lado.</Feito>
      )}

      {screen.guide?.optional && (
        <p className="mt-3 text-base text-mute">
          Este é opcional. Se deixar em branco, ele simplesmente não aparece.
        </p>
      )}
    </div>
  );
}
