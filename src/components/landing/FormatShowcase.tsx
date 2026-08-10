import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { FORMAT_IDS, getFormat, formatDimensions } from '@/config/formats';
import type { FormatId } from '@/lib/model/types';

// Demonstração dos três formatos no card do hero — CSS puro, zero requisição
// externa (SPEC §3). Não é decoração: é o argumento 1 desenhado.
//
// Os três desenhos estão na MESMA escala, e é isso que os faz honestos. Os
// formatos da Meta têm 1080px de largura os três (SPEC §2), então os mockups
// têm largura idêntica e alturas diferentes. As peças mantêm o mesmo tamanho em
// pixels nos três — o que muda é só onde elas se apoiam: título ancorado no
// topo, botão ancorado na base, foto esticada entre os dois. Exatamente o que o
// motor de adaptação faz.

const BASE_WIDTH = 1080;

interface MockProps {
  formatId: FormatId;
  width: number;
  /** Altura do mais alto (9:16) — mantém as legendas numa linha só. */
  railHeight: number;
  highlight: boolean;
}

function MiniCreative({ formatId, width, railHeight, highlight }: MockProps) {
  const format = getFormat(formatId);
  const height = Math.round((width * format.height) / format.width);
  // Escala do desenho: quantos px de tela cada px do criativo ocupa.
  const s = width / BASE_WIDTH;
  const px = (v: number) => `${Math.round(v * s * 100) / 100}px`;

  return (
    <div className="flex flex-col items-center">
      {/* Os desenhos se alinham pelo topo — é aí que a diferença de altura
          aparece. A régua de altura fixa mantém as legendas numa linha só. */}
      <div style={{ height: railHeight }}>
        <div
          className={cn(
            'relative overflow-hidden rounded-md',
            highlight
              ? 'shadow-[0_10px_30px_-12px_rgb(16_185_129_/_0.55)] ring-1 ring-emerald/60'
              : 'opacity-70 ring-1 ring-hairline-strong',
          )}
          style={{
            width,
            height,
            background: 'linear-gradient(165deg, #10241f 0%, #0a0a0a 100%)',
          }}
        >
          {/* Foto: esticada entre topo e base — cresce junto com o formato */}
          <span
            className="absolute rounded-sm"
            style={{
              left: px(86),
              right: px(86),
              top: px(324),
              bottom: px(281),
              background: 'linear-gradient(150deg, #0f766e 0%, #134e4a 55%, #1c1c1c 100%)',
            }}
          />
          {/* Título: ancorado no topo, mesmo tamanho nos três */}
          <span
            className="absolute rounded-full bg-white/85"
            style={{ left: px(86), right: px(86), top: px(108), height: px(70) }}
          />
          <span
            className="absolute rounded-full bg-white/45"
            style={{ left: px(86), width: px(520), top: px(205), height: px(70) }}
          />
          {/* Botão: ancorado na base, mesmo tamanho nos três */}
          <span
            className="absolute rounded-full"
            style={{
              left: px(86),
              width: px(470),
              bottom: px(97),
              height: px(108),
              background: 'linear-gradient(180deg, #10b981 0%, #047857 100%)',
            }}
          />
        </div>
      </div>

      <span
        className={cn(
          'mt-3 text-[11px] tabular-nums',
          highlight ? 'font-medium text-emerald-deep' : 'text-mute',
        )}
      >
        {formatId}
      </span>
      {/* `text-mute` e não `text-faint`: o faint fica em 4.18:1 no fundo escuro,
          abaixo do piso de 4.5:1. */}
      <span className="mt-0.5 hidden text-[10px] tabular-nums text-mute sm:block">
        {formatDimensions(formatId)}
      </span>
    </div>
  );
}

export function FormatShowcase() {
  // A largura vem do viewport para caber no celular sem rolagem horizontal.
  const [width, setWidth] = useState(112);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const update = () => setWidth(mq.matches ? 112 : 76);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // O 9:16 é o mais alto: ele define a régua onde as legendas se alinham.
  const tallest = getFormat('9:16');
  const railHeight = Math.round((width * tallest.height) / tallest.width);

  return (
    <div className="flex items-start justify-center gap-5 sm:gap-8">
      {FORMAT_IDS.map((id) => (
        <MiniCreative
          key={id}
          formatId={id}
          width={width}
          railHeight={railHeight}
          highlight={id === '4:5'}
        />
      ))}
    </div>
  );
}
