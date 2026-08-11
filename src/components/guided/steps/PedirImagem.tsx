import { useRef, useState } from 'react';
import { ImagePlus, Loader2, RefreshCw } from 'lucide-react';
import type { GuidedScreen } from '@/lib/guided/steps';
import { preencherImagem } from '@/lib/guided/actions';
import { useEditor, selectProject } from '@/lib/store/editor';
import { cn } from '@/lib/utils';
import { AvisoGentil, Feito, Pergunta } from '../GuidedChrome';

// PASSOS 2 e 3 (§18): pedir uma imagem. É a mesma tela para a foto e para a logo
// — o que muda é a pergunta, que vem do roteiro do modelo, e o botão de pular,
// que o passo 3 acrescenta.
//
// Área de soltar GRANDE, mais botão de escolher arquivo: parte do público não
// sabe arrastar arquivo, e obrigar a arrastar trava o fluxo logo no começo.

const ACEITA = 'image/png,image/jpeg,image/webp,image/svg+xml';

export function PedirImagem({ screen }: { screen: GuidedScreen }) {
  const project = useEditor(selectProject);
  const input = useRef<HTMLInputElement>(null);
  const [carregando, setCarregando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [sobre, setSobre] = useState(false);

  const layer = project?.layouts[project.baseFormat].layers.find((l) => l.id === screen.layerId);
  const preenchida = layer?.type === 'image' && layer.assetId !== null;

  async function receber(files: FileList | null) {
    const file = files?.[0];
    if (!file || !screen.layerId) return;
    setCarregando(true);
    setAviso(null);
    try {
      const { aviso } = await preencherImagem(screen.layerId, file);
      setAviso(aviso);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div>
      <Pergunta dica={screen.guide?.hint}>{screen.guide?.question}</Pergunta>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setSobre(true);
        }}
        onDragLeave={() => setSobre(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSobre(false);
          void receber(e.dataTransfer.files);
        }}
        className={cn(
          'flex min-h-52 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 text-center transition-colors',
          sobre ? 'border-emerald bg-emerald-soft' : 'border-hairline-strong bg-surface/50',
        )}
      >
        {carregando ? (
          <p className="flex items-center gap-2 text-lg text-mute">
            <Loader2 className="size-5 animate-spin" /> Preparando a imagem…
          </p>
        ) : (
          <>
            <ImagePlus className="size-8 text-mute" />
            <p className="text-lg text-mute">Arraste a imagem para cá</p>
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-hairline-strong bg-surface px-6 text-lg font-medium text-ink transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/50"
            >
              {preenchida ? <RefreshCw className="size-4" /> : null}
              {preenchida ? 'Trocar a imagem' : 'Escolher do computador'}
            </button>
          </>
        )}
        <input
          ref={input}
          type="file"
          accept={ACEITA}
          className="hidden"
          onChange={(e) => {
            void receber(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {preenchida && !aviso && <Feito>Pronto, sua imagem já está no criativo ao lado.</Feito>}
      {aviso && <AvisoGentil>{aviso}</AvisoGentil>}
    </div>
  );
}
