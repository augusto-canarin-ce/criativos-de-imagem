import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Download,
  Github,
  ImagePlus,
  KeyRound,
  Layers,
  MonitorSmartphone,
  ShieldCheck,
  SlidersHorizontal,
  Wand2,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { goToDashboard, goToGuided } from '@/lib/router';
import { useSpotlight } from '@/lib/useSpotlight';
import { DotGrid } from './DotGrid';
import { Marquee } from './Marquee';
import { FormatShowcase } from './FormatShowcase';

// Landing page pública (SPEC §13). Posicionamento pela tese da §1: o app faz UMA
// coisa e faz rápido. Nada de prometer versatilidade, automação ou IA — a
// ausência de IA é decisão de produto. A ordem dos cinco argumentos está fixada
// na §13 e é a ordem em que a página os apresenta, de cima para baixo:
//   1) um criativo, três formatos ......... hero + seção de funcionalidades
//   2) nada sai do navegador .............. seção "por que é assim"
//   3) sem cadastro ....................... idem
//   4) grátis e código aberto (MIT) ....... idem
//   5) só o necessário .................... idem, e o carrossel que a fecha
//
// Linguagem visual do design system "Conversão Extrema" v2.1, na mesma pegada da
// outra landing do usuário: dot-grid no fundo, duas linhas verticais emoldurando
// a coluna, badge em pílula, headline com a segunda linha em esmeralda sobre um
// brilho radial, cards premium com spotlight, botão shiny.
//
// Zero requisição externa (§3 e §16): sem fonte por rede (Geist Sans está no
// bundle), sem imagem hospedada fora — os mockups e a textura são CSS —, sem
// analytics. Tema escuro fixo: é o que a §13 pede para a landing, e o `dark` na
// raiz vale mesmo se a pessoa tiver escolhido o tema claro no editor.

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Layers,
    title: 'Adaptação automática entre os três',
    body: 'Você desenha no 4:5. O 1:1 e o 9:16 saem prontos, com o texto do mesmo tamanho e apoiado onde faz sentido — não esticado. Se você ajustar um na mão, só ele muda.',
  },
  {
    icon: ImagePlus,
    title: 'Placeholders para remontar em segundos',
    body: 'Os modelos vêm com os espaços de foto já marcados. Arraste a imagem nova para dentro do espaço e o criativo inteiro se refaz, nos três formatos, sem reposicionar nada.',
  },
  {
    icon: Download,
    title: 'Os três exportados de uma vez',
    body: 'Um clique gera 4:5, 1:1 e 9:16 em tamanho real, em PNG ou JPG, soltos ou num ZIP com os nomes já padronizados para subir no Gerenciador de Anúncios.',
  },
];

const STEPS = [
  {
    n: '1',
    title: 'Escolha um modelo',
    body: 'Ou comece do zero. Os modelos já vêm com os espaços marcados para as suas fotos.',
  },
  {
    n: '2',
    title: 'Troque imagem e texto',
    body: 'Solte as fotos nos espaços, reescreva os textos e aplique as cores e as fontes da sua marca.',
  },
  {
    n: '3',
    title: 'Exporte os três',
    body: 'Confira os avisos de área segura, clique uma vez e receba os três arquivos prontos.',
  },
];

// Argumentos 2 a 5 da §13, nesta ordem. O 1 é a headline e a seção acima.
const PRINCIPLES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ShieldCheck,
    title: 'Os arquivos nunca saem do navegador',
    body: 'Não existe servidor para onde enviar. As imagens e os projetos ficam no armazenamento deste navegador, e a única coisa que o app baixa da internet são fontes. Material de cliente continua sendo só seu.',
  },
  {
    icon: KeyRound,
    title: 'Sem cadastro e sem login',
    body: 'Não há conta para criar, e-mail para confirmar nem plano para escolher. O botão abre o editor — é literalmente esse o caminho todo.',
  },
  {
    icon: Github,
    title: 'Grátis e de código aberto',
    body: 'Licença MIT: dá para ler o código, adaptar e hospedar por conta própria. Nenhuma chave de API, nenhuma assinatura, nenhum limite de exportação.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Só o necessário — e sem IA',
    body: 'A ausência de IA aqui é decisão de produto, não limitação: o gargalo de fazer um anúncio não é ter ideia, é remontar a mesma peça três vezes. Menos escolhas é a funcionalidade.',
  },
];

const TOOLBOX = [
  'Texto',
  'Imagem',
  'Formas',
  'Gradiente',
  'Máscara',
  'Recorte',
  'Placeholders',
  'Marca',
  'Modelos',
  'Alinhamento',
  'Guias e snapping',
  'Área segura',
  'PNG e JPG',
  'ZIP dos três',
];

export function Landing() {
  return (
    // `overflow-x-clip` e não `-hidden`: hidden faz o outro eixo virar `auto` e
    // transforma a div num container de rolagem — o `sticky` do header passaria
    // a se ancorar nela, nunca na viewport.
    <div className="dark relative min-h-full overflow-x-clip text-body">
      <div aria-hidden className="fixed inset-0 -z-20 bg-canvas" />
      <DotGrid className="fixed inset-0 -z-10" />

      {/* Duas linhas verticais emoldurando a coluna de conteúdo. Some no
          celular, onde a coluna já ocupa a tela inteira. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-y-0 left-1/2 -z-10 hidden w-full max-w-6xl -translate-x-1/2 lg:block"
      >
        <span className="absolute inset-y-0 left-0 w-px bg-hairline" />
        <span className="absolute inset-y-0 right-0 w-px bg-hairline" />
      </div>

      <header className="sticky top-0 z-sticky border-b border-hairline bg-canvas/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <a href="#" aria-label="Criador Extremo" className="flex items-center">
            <Logo className="h-6 w-auto text-ink" />
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            {[
              ['#funcionalidades', 'Funcionalidades'],
              ['#como-funciona', 'Como funciona'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-4 py-2 text-sm font-medium text-mute transition-colors hover:bg-ink/5 hover:text-ink"
              >
                {label}
              </a>
            ))}
          </nav>

          <Button variant="shiny" size="default" onClick={goToDashboard}>
            Abrir o editor <ArrowRight className="size-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative py-16 text-center sm:py-24">
          {/* Brilho radial difuso atrás da headline */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-10 -z-10 h-[420px] opacity-90 blur-[90px]"
            style={{
              background:
                'radial-gradient(ellipse 40% 55% at 50% 45%, rgba(16,185,129,0.22) 0%, rgba(16,185,129,0) 70%)',
            }}
          />

          <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface/70 py-1.5 pl-1.5 pr-4 backdrop-blur-md">
            <span className="flex items-center gap-1">
              <span className="grid size-5 place-items-center rounded-full bg-emerald-soft text-emerald-deep">
                <ShieldCheck className="size-3" />
              </span>
              <span className="grid size-5 place-items-center rounded-full bg-elevated text-mute">
                <Github className="size-3" />
              </span>
            </span>
            <span className="text-[13px] font-medium text-body">
              Roda no navegador · código aberto
            </span>
          </span>

          {/* Duas linhas, e só duas: sem `text-balance`, que reequilibrava a
              primeira linha em duas e desmontava o par. */}
          <h1 className="mx-auto mt-8 max-w-4xl text-[clamp(2rem,5.6vw,3.75rem)] font-semibold leading-[1.06] tracking-tight text-ink">
            Um criativo, três formatos
            <br />
            <span className="text-emerald-400">sem remontar nada</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-body-lg leading-relaxed text-mute">
            Monte o anúncio uma vez e leve para{' '}
            <strong className="font-semibold text-ink">4:5, 1:1 e 9:16 já adaptados</strong>. Roda{' '}
            <strong className="font-semibold text-ink">no seu navegador</strong>, sem cadastro e sem
            enviar imagem para servidor nenhum.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="shiny" size="lg" onClick={() => goToGuided()}>
                <Wand2 className="size-4" /> Criativo rápido
              </Button>
              <Button variant="outline" size="lg" onClick={goToDashboard}>
                Abrir o editor <ArrowRight className="size-4" />
              </Button>
            </div>
            <span className="text-xs text-mute">
              Sem cadastro. Os dois botões levam direto para o app. O criativo rápido pergunta o
              que precisa e monta o anúncio para você — no computador.
            </span>
          </div>

          {/* Card de destaque: a demonstração dos três formatos */}
          <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-dashed border-hairline-strong bg-surface/40 px-5 py-8 backdrop-blur-sm sm:px-10 sm:py-10">
            <p className="mb-8 text-caption uppercase tracking-eyebrow text-mute">
              O mesmo criativo, nos três formatos
            </p>
            <FormatShowcase />
            <p className="mx-auto mt-8 max-w-md text-body-sm leading-relaxed text-mute">
              Os três têm 1080px de largura — só a altura muda. O texto sai do mesmo tamanho nos
              três; o que muda é <span className="text-ink">onde cada peça se apoia</span>.
            </p>
          </div>
        </section>

        {/* ── FUNCIONALIDADES ───────────────────────────────────────────── */}
        <Section id="funcionalidades" eyebrow="O que muda na prática">
          <SectionTitle>Três coisas que economizam a tarde</SectionTitle>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </Section>

        {/* ── COMO FUNCIONA ─────────────────────────────────────────────── */}
        <Section id="como-funciona" eyebrow="Como funciona">
          <SectionTitle>De uma ideia a três arquivos prontos</SectionTitle>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n}>
                <span className="mb-4 grid size-9 place-items-center rounded-full border border-emerald/40 text-sm font-semibold text-emerald-deep">
                  {s.n}
                </span>
                <h3 className="text-heading-sm text-ink">{s.title}</h3>
                <p className="mt-2 text-body-sm leading-relaxed text-mute">{s.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* ── PRINCÍPIOS (argumentos 2 a 5 da §13) ──────────────────────── */}
        <Section eyebrow="Por que é assim">
          <SectionTitle>Menos escolhas é a funcionalidade</SectionTitle>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <FeatureCard key={p.title} {...p} />
            ))}
          </div>

          {/* Carrossel fechando o argumento 5: isto é a caixa de ferramentas
              inteira — cabe numa linha, e é de propósito. */}
          <div className="mt-14 border-y border-hairline py-6">
            <p className="mb-5 text-center text-caption uppercase tracking-eyebrow text-mute">
              Tudo o que existe no editor
            </p>
            <Marquee duration={44} gapClass="mr-8">
              {TOOLBOX.map((tool) => (
                <span key={tool} className="select-none text-lg font-medium text-mute sm:text-xl">
                  {tool}
                </span>
              ))}
            </Marquee>
          </div>
        </Section>

        {/* ── FECHAMENTO ────────────────────────────────────────────────── */}
        <section className="py-20 text-center sm:py-28">
          <h2 className="mx-auto max-w-xl text-balance text-heading-lg text-ink sm:text-heading-xl">
            Abra e monte o primeiro criativo agora
          </h2>
          <p className="mx-auto mt-4 max-w-md text-balance text-body-sm leading-relaxed text-mute">
            Não há nada para instalar nem para preencher antes. O editor abre com os modelos já
            disponíveis.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button variant="shiny" size="lg" onClick={goToDashboard}>
              Abrir o editor <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" size="lg" asChild>
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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-caption text-mute">
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

function Section({
  id,
  eyebrow,
  children,
}: {
  id?: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-hairline py-20 sm:py-24">
      <p className="text-center text-caption uppercase tracking-eyebrow text-emerald-deep">
        {eyebrow}
      </p>
      {children}
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mx-auto mt-4 max-w-2xl text-balance text-center text-heading-lg text-ink sm:text-heading-xl">
      {children}
    </h2>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  const spotlight = useSpotlight();
  return (
    <div {...spotlight} className="premium-card bg-surface/40 p-6 backdrop-blur-sm">
      <span className="mb-4 grid size-10 place-items-center rounded-lg bg-emerald-soft text-emerald-deep">
        <Icon className="size-[18px]" />
      </span>
      <h3 className="text-heading-sm text-ink">{title}</h3>
      <p className="mt-2 text-body-sm leading-relaxed text-mute">{body}</p>
    </div>
  );
}
