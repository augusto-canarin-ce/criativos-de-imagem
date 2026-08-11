import { useState } from 'react';
import { ChevronDown, MoveDown, MoveUp } from 'lucide-react';
import { useEditor, selectProject } from '@/lib/store/editor';
import { useBrandKit } from '@/lib/store/brand';
import { FORMAT_IDS } from '@/config/formats';
import type { FormatId } from '@/lib/model/types';
import { moverVertical, trocarCorDoTexto, escreverTexto, fecharEdicaoDeTexto } from '@/lib/guided/actions';
import { NOME_DO_FORMATO, nomeAmigavel } from '@/lib/guided/plainLanguage';
import { cn } from '@/lib/utils';

// Ajustes simples do passo 5 (§18): mover, trocar cor, trocar texto. NÃO é o
// editor — não há seleção no canvas, nem arraste, nem inspector. A pessoa escolhe
// um elemento numa lista curta (só os que ela mesma preencheu) e mexe em três
// coisas.
//
// Mover é só vertical, e é uma decisão de produto, não preguiça: a adaptação
// entre formatos é um problema puramente vertical (§2), e soltar o eixo
// horizontal é o tipo de liberdade que estraga um layout que já estava pronto.

const PASSO_PX = 40;

export function AjustesSimples() {
  const project = useEditor(selectProject);
  const kit = useBrandKit();
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [formato, setFormato] = useState<FormatId>('4:5');

  if (!project) return null;

  const editaveis = project.layouts[project.baseFormat].layers.filter(
    (l) => l.guide && l.visible && (l.type === 'text' || l.type === 'image'),
  );
  if (!editaveis.length) return null;

  const cores = [
    ...(kit?.colors ?? []).map((c) => ({ nome: c.name, hex: c.hex })),
    { nome: 'Branco', hex: '#ffffff' },
    { nome: 'Preto', hex: '#111111' },
  ];

  return (
    <div className="rounded-xl border border-hairline bg-surface/50">
      <p className="border-b border-hairline px-5 py-4 text-base text-mute">
        Quer mexer em alguma coisa? Escolha o que ajustar:
      </p>

      <ul>
        {editaveis.map((layer) => {
          const aberto = abertoId === layer.id;
          return (
            <li key={layer.id} className="border-b border-hairline last:border-0">
              <button
                type="button"
                onClick={() => setAbertoId(aberto ? null : layer.id)}
                className="flex min-h-14 w-full items-center justify-between gap-3 px-5 text-left text-lg text-ink transition-colors hover:bg-ink/5"
              >
                <span>{capitalizar(nomeAmigavel(layer))}</span>
                <ChevronDown
                  className={cn('size-5 shrink-0 text-mute transition-transform', aberto && 'rotate-180')}
                />
              </button>

              {aberto && (
                <div className="space-y-5 px-5 pb-6">
                  {layer.type === 'text' && (
                    <>
                      <label className="block">
                        <span className="mb-2 block text-base text-mute">O que está escrito</span>
                        <textarea
                          value={layer.content}
                          rows={2}
                          onChange={(e) => escreverTexto(layer.id, e.target.value)}
                          onBlur={fecharEdicaoDeTexto}
                          className="w-full resize-none rounded-lg border border-hairline-strong bg-surface px-4 py-3 text-lg text-ink focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/30"
                        />
                      </label>

                      <div>
                        <span className="mb-2 block text-base text-mute">Cor da letra</span>
                        <div className="flex flex-wrap gap-2">
                          {cores.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              title={c.nome}
                              aria-label={`Cor ${c.nome}`}
                              onClick={() => trocarCorDoTexto(layer.id, c.hex)}
                              className="size-11 rounded-lg ring-1 ring-hairline-strong transition-transform hover:scale-105"
                              style={{ background: c.hex }}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    {/* Sem `toLowerCase`: "Stories e Reels" é nome próprio e
                        virava "no stories e reels". */}
                    <span className="mb-2 block text-base text-mute">
                      Subir ou descer no {NOME_DO_FORMATO[formato]}
                    </span>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {FORMAT_IDS.map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setFormato(id)}
                          className={cn(
                            'min-h-11 rounded-lg px-4 text-base transition-colors',
                            formato === id
                              ? 'bg-emerald-soft text-emerald-deep'
                              : 'text-mute hover:bg-ink/5',
                          )}
                        >
                          {NOME_DO_FORMATO[id]}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <BotaoMover
                        onClick={() => moverVertical(layer.id, formato, -PASSO_PX)}
                        rotulo="Subir"
                      >
                        <MoveUp className="size-5" />
                      </BotaoMover>
                      <BotaoMover
                        onClick={() => moverVertical(layer.id, formato, PASSO_PX)}
                        rotulo="Descer"
                      >
                        <MoveDown className="size-5" />
                      </BotaoMover>
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BotaoMover({
  children,
  onClick,
  rotulo,
}: {
  children: React.ReactNode;
  onClick: () => void;
  rotulo: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-hairline-strong bg-surface text-lg text-ink transition-colors hover:bg-elevated"
    >
      {children} {rotulo}
    </button>
  );
}

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
