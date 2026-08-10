import { ArrowRight, Github, Layers, MonitorSmartphone, ShieldCheck, Sparkles } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { goToDashboard } from '@/lib/router';

// Landing page pública (SPEC §13). Posicionamento pela tese da §1: o app faz UMA
// coisa e faz rápido. Nada de prometer versatilidade, automação ou IA — a ausência
// de IA é decisão de produto. Ordem dos argumentos definida pelo usuário:
// 1) um criativo, três formatos  2) nada sai do navegador  3) sem cadastro
// 4) grátis e aberto  5) só o necessário.
//
// Zero requisição externa (§3): o mockup dos formatos é CSS puro, sem imagem
// remota; a fonte já está no bundle.

const FEATURES = [
  {
    icon: Layers,
    title: 'Um criativo, três formatos',
    body: 'Você desenha no 4:5 e o 1:1 e o 9:16 saem prontos, adaptados de verdade — não esticados. Ajustou um na mão? Só ele muda.',
  },
  {
    icon: ShieldCheck,
    title: 'Suas imagens não saem daqui',
    body: 'Tudo roda no seu navegador. Sem servidor, sem upload, sem conta em lugar nenhum. Material de cliente continua sendo só seu.',
  },
  {
    icon: Sparkles,
    title: 'Só o necessário para um bom anúncio',
    body: 'Texto, imagem, formas, marca e exportação. Sem IA, sem automação mágica, sem vinte menus que você nunca abre.',
  },
];

const STEPS = [
  { n: '1', title: 'Escolha um modelo', body: 'Ou comece do zero. Os modelos já vêm com espaços marcados para as suas fotos.' },
  { n: '2', title: 'Arraste suas imagens', body: 'Solte as fotos nos espaços, troque os textos e aplique as cores e fontes da sua marca.' },
  { n: '3', title: 'Exporte os três', body: 'Um clique gera os três formatos em tamanho real, prontos para subir no Gerenciador de Anúncios.' },
];

export function Landing() {
  return (
    <div className="min-h-full bg-canvas">
      <header className="sticky top-0 z-10 border-b border-hairline bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <Logo className="h-6 w-auto text-ink" />
          <Button variant="cta" size="sm" onClick={goToDashboard}>
            Abrir o editor <ArrowRight />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        {/* Hero */}
        <section className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-deep">
              Editor de criativos para anúncios
            </p>
            <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.08] tracking-tight text-ink">
              Um criativo.
              <br />
              Os três formatos
              <br />
              que a Meta pede.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-body">
              Monte o anúncio uma vez e leve para Feed vertical, quadrado e Stories sem
              remontar nada. Direto no navegador, sem cadastro e sem enviar suas imagens
              para lugar nenhum.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button variant="cta" size="lg" onClick={goToDashboard}>
                Abrir o editor <ArrowRight />
              </Button>
              <span className="text-xs text-mute">
                Sem cadastro. O botão leva direto para o editor.
              </span>
            </div>
          </div>

          {/* Mockup dos três formatos — CSS puro, sem imagem remota (§3) */}
          <div aria-hidden className="flex items-end justify-center gap-3 md:justify-end">
            {[
              { w: 116, h: 145, label: '4:5' },
              { w: 116, h: 116, label: '1:1' },
              { w: 92, h: 164, label: '9:16' },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-2">
                <div
                  className="relative overflow-hidden rounded-lg border border-hairline shadow-sm"
                  style={{
                    width: f.w,
                    height: f.h,
                    background: 'linear-gradient(160deg, #134e4a 0%, #0f172a 100%)',
                  }}
                >
                  <span className="absolute inset-x-3 top-4 block h-2 rounded bg-white/85" />
                  <span className="absolute inset-x-3 top-8 block h-2 w-2/3 rounded bg-white/55" />
                  <span className="absolute inset-x-5 bottom-4 block h-4 rounded-full bg-emerald" />
                </div>
                <span className="text-[10px] tabular-nums text-mute">{f.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Funcionalidades */}
        <section className="border-t border-hairline py-16">
          <div className="grid gap-8 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <span className="mb-3 grid size-9 place-items-center rounded-lg bg-emerald-soft text-emerald-deep">
                  <Icon className="size-4" />
                </span>
                <h2 className="text-base font-semibold text-ink">{title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-body">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Como funciona */}
        <section className="border-t border-hairline py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Como funciona</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n}>
                <span className="mb-3 grid size-8 place-items-center rounded-full border border-emerald/40 text-sm font-semibold text-emerald-deep">
                  {s.n}
                </span>
                <h3 className="text-base font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-body">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Fechamento */}
        <section className="border-t border-hairline py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Grátis e de código aberto
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-body">
            Licença MIT: use, adapte e hospede por conta própria se quiser. Nenhuma chave
            de API, nenhuma assinatura, nenhum limite de exportação.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button variant="cta" size="lg" onClick={goToDashboard}>
              Abrir o editor <ArrowRight />
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
            >
              <a
                href="https://github.com/augusto-canarin-ce/criativos-de-imagem"
                target="_blank"
                rel="noreferrer noopener"
              >
                <Github /> Ver o código
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-mute">
          <span className="flex items-center gap-1.5">
            <MonitorSmartphone className="size-3.5" />
            Feito para desktop — no celular dá para ver e exportar.
          </span>
          <span>Licença MIT · seus projetos ficam neste navegador</span>
        </div>
      </footer>
    </div>
  );
}
