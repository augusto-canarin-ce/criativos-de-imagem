# PROGRESS

Registro de progresso por fase. Atualizado ao fim de cada fase, conforme SPEC §15.

---

## FASE 4 — Ferramentas completas  ✅ concluída

### Feito

- [x] Elipse (O), linha e seta (L; seta/pontas via inspector) com estilo unificado —
      linha/seta usam a ALTURA do quadro como espessura, cor vem do preenchimento
- [x] Editor de gradiente completo: paradas arrastáveis (clicar adiciona com cor
      interpolada, duplo clique remove, mín. 2), ângulo no linear, CENTRO arrastável
      em prévia + raio no radial — em texto, forma, marca-texto e FUNDO
- [x] Blend modes completos em grupos (Escurecer/Clarear/Contraste/Comparar/Cor),
      normal no topo, via optgroup
- [x] Máscara retângulo-com-raio/elipse via clipFunc; crop NÃO destrutivo (px na
      imagem original, integrado ao cover/contain + focal point) com proporções
      livre/4:5/1:1/9:16; ajustes brilho/contraste/saturação/blur via filtros com
      cache() e debounce 120ms
- [x] Grupos (Cmd+G/Cmd+Shift+G): filhos RELATIVOS (a adaptação move o grupo como
      unidade de graça), redimensionar escala a geometria dos filhos (Figma-like),
      desagrupar rebate rotação; painel em árvore com expandir/recolher; no canvas,
      clicar em filho seleciona o grupo (filho individual pelo painel)
- [x] Snapping (§8): centro do canvas, safe area, bordas+centros das outras camadas,
      tolerância 6px DE TELA (÷escala), guias vermelhas 1px só durante o arraste,
      Alt desativa — matemática pura em lib/layout/snapping com 5 testes
- [x] Atalhos: O, L, Cmd+G/Cmd+Shift+G, Cmd+C/V (objeto, clipboard interno),
      Cmd+Alt+C/V (estilo: aparência sem geometria/conteúdo)
- [x] Placeholders completos: criar no menu Inserir (sem tecla, §8), rotular no
      inspector, drop em QUALQUER placeholder vazio preenche, esvaziar/substituir,
      lote na ordem de leitura (topo→baixo, esquerda como desempate)
- [x] Fixture visual "mascara-formas" (máscara elipse, máscara raio + CROP, elipse
      com traçado externo, linha, seta dupla); 97 unitários + 6 visuais

### Aceite (§15) — ✅ verificado

Anúncio montado no app com as ferramentas reais (foto de fundo, título com
marca-texto, xícara com máscara elipse, selo, CTA em gradiente + elipse agrupados
via Cmd+G) e duplicado 2× ("três anúncios" com variação — o fluxo real de
produção). Depois, as TRÊS imagens esvaziadas (botão do inspector → placeholders) e
o criativo **remontado em 4,0 segundos** com um único arraste de 3 fotos novas —
preenchidas na ordem de leitura, máscaras/quadros/efeitos intactos. Limite: 60s.

### Achados e decisões

- **DataCloneError de novo**: `structuredClone` sobre draft em groupSelection/
  ungroupSelection — terceira ocorrência do padrão; helper `deepClone` agora vive
  no store também. Vale regra de revisão: nunca `structuredClone` dentro de recipe.
- Grupos: reordenar dentro do grupo e duplo-clique-para-entrar ficam para o
  acabamento; seleção de filho é pelo painel.
- Snapping de espaçamento igual entre 3+ objetos: continua pendência registrada.
- Guias de snap verificadas por teste (matemática) e code-review do render; a
  captura ao vivo do gesto não foi automatizável com clique sintético nesta sessão.
- Traçado em linha/seta: a própria linha É traçado — seção de traçado do estilo
  unificado segue disponível mas é redundante ali (documentado, não escondido).

---

## Pendências registradas (fora da fase atual)

- **Landing page (Fase 7)** — decisão de escopo registrada na SPEC §13 em
  2026-08-07: página pública antes do dashboard, mesmo design system, tema escuro,
  rota separada, zero requisição externa, posicionamento pela tese da §1 (sem
  promessa de IA/versatilidade; botão de entrada direta, sem cadastro). Estrutura:
  header+logo, headline/sub, funcionalidades, "como funciona", CTA para o dashboard.
- Réguas + guias arrastáveis (Shift+G reservado) — §8, junto do acabamento.
- Snapping de espaçamento igual entre 3+ objetos — complemento do snapping da Fase 4.
- "Exportar todos" (backup completo no dashboard, §12) — Fase 7.
- CI com refs visuais pinadas (vendorizar TTF) — Fase 7.

---

## FASE 3 — Exportação  ✅ concluída

### Feito

- [x] `lib/render/imageCache.ts` — cache síncrono + preload; `useImageAsset` virou
      cache-first (o export nasce com imagens prontas; o preview reusa entre formatos)
- [x] `ExportStage` — a MESMA `StageScene` do preview em tamanho real, escala 1,
      sem cromo (borda de artboard/sombra ganharam a flag `chrome`, desligada no
      export). Um único caminho de render: nenhum código de desenho paralelo.
- [x] Prontidão §9/§11: preload de imagens → `document.fonts.ready` + check por
      família/peso → efeitos com cache assentados → `draw()` síncrono → `toCanvas`
- [x] `encode.ts` (PNG; JPG 0.92→0.85→0.80 até caber em 30MB), `naming.ts`
      (`{slug}_{1080x1350}_v{n}.{ext}`), `zip.ts` (`{slug}_{data}.zip`)
- [x] `checklist.ts` — §11 completo: placeholder vazio (destaque, 1º), fora da safe
      zone (texto/forma/logo; fundo full-bleed isento), contraste <4.5:1 contra a
      luminância média REAL sob a caixa, fonte <28px, imagem >100%, fonte não
      carregada, texto >20% (informativo). Rodapé com contagem viva + lista.
- [x] Diálogo: previews reais dos 3, download individual, ZIP, JPG/PNG, qualidade
      atrás de "Avançado", congela o projeto na abertura; Cmd+Shift+E
- [x] `.criativo` export/import com ids regenerados, validação zod+migração,
      ArrayBuffer nas duas pontas (browser e Node); import no dashboard, export no
      menu do card. Round-trip coberto por teste.
- [x] **Regressão visual**: vitest+jsdom+node-canvas rodando a cena React REAL;
      fixtures: texto com gradiente+contorno+sombra+marca-texto, formas com radial+
      blend multiply+traçados dentro/fora, imagem com blur (cache!)+sombra,
      placeholder vazio; refs no repo; pixelmatch ≤0.1%; `test:visual[:update]`

### Aceite (§15) — ✅ verificado

Dimensões exatas provadas duas vezes: na suíte (os três formatos) e no navegador
(1080×1350/1080/1920 nos previews reais). Pixel a pixel: dois renders independentes
(fechar/reabrir o diálogo = stages novos) produziram dataURLs **byte a byte
idênticos** nos 3 formatos — e a suíte visual compara a mesma cena com as refs.

### Achados e decisões

- **Bug real (rAF em página oculta):** a prontidão usava `requestAnimationFrame`,
  que congela com a aba em segundo plano — export nunca ficava pronto. Trocado por
  macrotasks; pego porque o painel de verificação ficou oculto no meio do teste.
- **`-apple-system` derrubava a pilha de fonte no node-canvas** (parser rejeita o
  hífen → default 10px). Removido do fallback (system-ui cobre); a suíte visual
  pegou — primeira vitória dela antes de existir CI.
- **JSZip em Node não lê Blob** — ArrayBuffer nas duas pontas (funciona igual no
  browser). Pego pelo teste de round-trip.
- Refs geradas nesta máquina (macOS/node-canvas). Fontes dos fixtures são de
  sistema; em CI (Fase 7) vendorizar TTF e regenerar refs pinadas. Fixtures de
  máscara e fonte do usuário entram quando as features chegarem (Fases 4/5).
- "Exportar todos" (backup completo do dashboard, §12) fica para a Fase 7.
- Contraste roda no diálogo (precisa de pixels); o rodapé mostra as checagens
  estáticas ao vivo com debounce de 400ms.

---

## Interlúdio pós-Fase 2 — Ajustes do teste da v1  ✅

Feedback do usuário após testar (2026-08-07), em quatro blocos:

**Bugs corrigidos**
- Borda do artboard desenhada POR CIMA de todas as camadas (1px de tela em
  qualquer zoom, `strokeScaleEnabled(false)`) — imagem sangrando não a esconde.
- Textarea de edição de texto cresce a cada tecla (autosize por `scrollHeight`);
  antes, texto com quebra de linha cortava o topo da primeira linha até confirmar.

**Comportamento de imagem**
- Primeira imagem do layout entra como FUNDO (cover, formato inteiro, base da
  pilha); as demais entram como ELEMENTO (`createImageElementLayer`): contain,
  proporção natural, até metade do formato, centralizadas, topo da pilha.
- Soltar arquivo sobre camada de imagem SELECIONADA substitui só o asset
  (quadro/máscara/crop/efeitos preservados — `replaceImageOnLayer`); no vazio,
  camada nova. Botão da barra cria camada nova.
- PNG com alfa ok; SVG aceito com sanitização (§12: remove `<script>`,
  `foreignObject`, `on*`, `javascript:`) — verificado com payload malicioso.

**Antecipado das Fases 4/5**
- Estilo unificado (`StyleControls`): preenchimento sólido/linear/radial para
  texto e forma (2 paradas + ângulo/raio; editor completo de paradas continua na
  Fase 4), traçado com posição dentro/centro/fora (emulado por geometria; em
  texto só centrado e a posição fica oculta), sombra, blur com `cache()` e
  debounce de 120ms, marca-texto com padding e raio (retângulo atrás do bloco
  medido, respeitando vAlign).
- Alinhar/distribuir/esticar (`lib/layout/align` + AlignBar): 6 alinhamentos,
  2 distribuições (Figma: extremos fixos, vãos iguais), 100% largura/altura.
  1 selecionada = relativo ao canvas; várias = à seleção.
- Modificadores no transformer: Shift trava proporção, Alt centro, ambos juntos.

**Atalhos (padrão Figma — SPEC §14 revisada)**
- `config/shortcuts.ts` criado como fonte única (o modal da Fase 7 lê dela).
- Mudanças: elipse `E`→`O`, imagem `I`→`Cmd+Shift+K` (o `I` some; no Figma é o
  conta-gotas, Fase 5), exportar `Cmd+E`→`Cmd+Shift+E`, comandos `Cmd+K`→`Cmd+/`.

Elipse/linha/seta seguem na Fase 4; o inspector diz "Retângulo" para não sugerir
formas inexistentes. 69 testes (align com cobertura própria).

---

## FASE 2 — Multiformato  ✅ concluída

Objetivo: adaptação automática entre os três formatos com override manual. O motor é
puramente vertical (largura fixa em 1080 — SPEC §2): sem reescala horizontal, sem
recálculo de fonte, sem reflow.

### Tarefas

- [x] `lib/layout/anchors.ts` — redistribuição vertical por âncora (top/center/bottom/stretch)
- [x] `lib/layout/safeArea.ts` — correção de invasão da safe zone (texto/forma) + avisos
- [x] `lib/layout/autoFit.ts` — busca binária de fontSize (medidor injetado, testável)
- [x] `lib/layout/adapt.ts` — `adaptLayout` completo + propagação base → conectados
- [x] `lib/layout/rebase.ts` — troca de formato base (§7) com contagem exata de efeitos
- [x] `lib/render/measureText.ts` — medidor Konva real (browser)
- [x] Store: propagação em todo commit (mesmo passo de undo), override automático,
      dest-only layers, delete/reorder em derivado, detached, rebase em 1 undo
- [x] FormatBar: abas com chip "base"/desconectado, contagem de overrides,
      "Reconectar todas", desconectar/reconectar, "Usar como base…" com confirmação
- [x] Modo comparar: três formatos lado a lado, foco editável, clique para focar
- [x] Marcador de override no painel + chip/reversão no inspector
- [x] Focal point arrastável no inspector de imagem, com a linha de explicação
- [x] Auto-fit no inspector (liga/desliga + min/max), reaplicado ao confirmar edição
- [x] Avisos de adaptação no rodapé, por formato
- [x] 26 testes novos do motor (cada âncora, override, detached, safe zone, auto-fit,
      rebase) — 64 no total

### Aceite (SPEC §15) — ✅ verificado no navegador e no banco

Criativo montado no 4:5 (foto de fundo stretch + título top + botão): 1:1 e 9:16
saíram corretos sem tocar em nada — imagem re-cobrindo por formato, texto empurrado
para dentro da safe zone do 9:16 (aviso no rodapé), botão corrigido no 1:1. Ajuste
manual do botão no 9:16 (y→1300): `overriddenIn` marcado automaticamente e **4:5 e
1:1 idênticos byte a byte** aos snapshots pré-edição (comparados no IndexedDB).
Edição posterior na base propagou aos conectados mantendo o override intacto.

### Decisões tomadas no caminho

- **Semântica de `overriddenIn`:** autoritativa na cópia do formato derivado (cada
  layout tem cópias próprias por id). Cópia recém-derivada nasce com `overriddenIn`
  vazio — clones não carregam marcas (senão o rebase deixaria marcas fantasma; bug
  pego por teste).
- **Apagar em formato derivado conectado** vira override com `visible=false` (o
  modelo não tem tumba de exclusão por formato); "Voltar a seguir o base" restaura.
  Na base, apaga de verdade em todos os conectados, inclusive cópias sobrescritas.
- **Reordenar pilha só na base ou em formato desconectado** — a ordem dos conectados
  segue a base (a UI oculta os botões; o store tem no-op de segurança).
- **Fundo segue a base em formato conectado**: editar o fundo num derivado conectado
  edita a base (fundo não tem override por camada). Desconectado tem fundo próprio.
- **Propagação e performance (§16):** commits propagam dentro da mesma receita
  (mesmo passo de undo); commits ao vivo (slider/arraste) NÃO propagam por tick — a
  propagação funde no passo ao fechar o grupo (`endLive`). Arraste no canvas só
  comita no soltar, então os formatos derivados do modo comparar atualizam ao
  confirmar, como a SPEC pede. `pixelRatio` reduzido explícito ficou dispensável
  (as colunas derivadas já renderizam em escala pequena).
- **Bug real corrigido:** `structuredClone` sobre draft do Immer lança
  `DataCloneError` — a propagação roda dentro de `produceWithPatches`. `deepClone`
  com `current()`/`isDraft()` resolve; os testes usavam objetos puros e não pegavam.
- Correção de safe zone cobre texto e forma; logo (imagem) fica para o checklist da
  Fase 3, junto do aviso "logo fora da safe zone".

---

## Interlúdio pós-Fase 1 — Linguagem visual (design system)  ✅

Aplicada a linguagem visual do DS "Conversão Extrema" v2.1 à interface (decisão do
usuário): tokens (`@theme` + semânticos temáveis em canais RGB), tipografia Geist
Sans **empacotada via fontsource** (offline, sem Google Fonts), escopo `.ds-app` de
densidade, acento esmeralda com parcimônia, hairlines de 1px no lugar de sombras.
**Sem a marca/logo** — repo público. Componentes Radix/shadcn mantidos, só as
classes migradas ao vocabulário novo (`surface`, `ink`, `mute`, `hairline`…).

Decisões: CTA "Exportar os 3" com a variante contida do shiny (grafite + anel
esmeralda, sem animação — hierarquia por exceção); seleção/transformer em esmeralda;
safe zone recolorida para azul `info` (não confundir com seleção); "Geist Sans"
virou a primeira opção de fonte do canvas e o padrão de camada nova — é a única
família realmente empacotada, render determinístico. Pilha de fallback por genérico
(`lib/fonts/stacks`) preservada.

---

## FASE 1 — Canvas e edição  ✅ concluída

Objetivo: editor funcional sobre o formato base. Konva num único Layer com Groups.
Fundo, imagem, texto e retângulo. Seleção, transformer, painel de camadas, inspector
básico, undo/redo, salvamento automático. **Sem multiformato ainda** (Fase 2) e
**sem export** (Fase 3).

### Tarefas

- [x] Roteamento por hash (`#/` dashboard, `#/p/:id` editor); reload reabre o projeto
- [x] Store do editor (Zustand): projeto ativo, seleção, ferramenta
- [x] Undo/redo por patches do Immer (`lib/history`), limite 100, arraste/slider = 1 passo
- [x] Salvamento automático debounced 800ms (IndexedDB), com flush ao sair
- [x] Canvas Konva: **um único Layer** com Groups por camada; fundo do Layout
- [x] Render de imagem (cover/contain não destrutivo), texto e retângulo — helpers puros
- [x] Seleção (clique, shift, clique no vazio limpa) + Transformer (redimensiona/rotaciona)
- [x] Zoom (Ctrl/Cmd+scroll, botões, ajustar, 100%) e pan (espaço+arrasto, scroll)
- [x] Edição de texto no canvas via `<textarea>` sobreposto (acentuação/IME, Esc/Enter)
- [x] Painel de camadas: selecionar, visibilidade, cadeado, renomear, apagar, reordenar
- [x] Inspector por tipo (um arquivo cada): comum, texto, imagem, forma + fundo
- [x] Toolbar: ferramentas (V/T/R/I), inserir, desfazer/refazer, zoom, safe zone
- [x] Atalhos essenciais: V/T/R/I, undo/redo, Delete, Cmd+D, Cmd+]/[, setas para mover
- [x] Upload/drag-drop de imagem → Asset no IndexedDB (pipeline completo §12 → fase de imagens)
- [x] Testes das funções puras (history, cover, layer factory) — 32 testes no total

### Aceite (SPEC §15) — ✅ verificado no navegador

Montado um criativo 4:5 com foto de fundo (cover), título ("Promoção de inauguração",
com acentos preservados) e botão retangular; reload real reabriu o projeto com **tudo
idêntico** (3 camadas, imagem recarregada do IndexedDB). Undo/redo testados.

### Decisões e notas

- **Ferramenta tem prioridade sobre seleção:** clicar com T/R insere no ponto mesmo
  por cima de uma camada (senão uma foto de fundo full-bleed bloquearia a inserção).
  A camada só captura o clique com a ferramenta Seleção ativa.
- **Fonte "Inter":** ainda cai para a fonte-padrão do sistema (serifada) — a curadoria
  via fontsource entra na Fase 5. Sem impacto no modelo.
- **Bundle 876 kB** (Konva). Code-splitting/lazy do editor fica para o acabamento.
- **Pipeline de assets §12** (resize 2560, dedup por hash, miniatura) adiado para a
  fase de imagens; hoje o blob é guardado como veio. Modelo já é o final.
- Miniatura de 24px por camada: ícone por tipo por ora; render real depois.

---

## FASE 0 — Fundação  ✅ concluída

Objetivo: base do projeto rodando, modelo de dados versionado, persistência local e
dashboard de projetos. **Sem canvas ainda.**

### Tarefas

- [x] Scaffolding Vite + React 19 + TypeScript `strict`
- [x] Tailwind + utilitários shadcn/ui (Button, Input, Dialog, DropdownMenu, AlertDialog)
- [x] Tema escuro por padrão (cinza neutro dessaturado), tema claro nas preferências
- [x] `lib/model/types.ts` — todos os tipos da SPEC §6
- [x] `lib/model/schema.ts` — schemas zod espelhados
- [x] `lib/model/migrations.ts` — versionamento de schema desde o commit 1
- [x] `config/formats.ts` — os três formatos, e só os três
- [x] `config/safeAreas.ts` — safe zones editáveis + perfil Reels do 9:16
- [x] `lib/db/dexie.ts` — tabelas `projects`, `assets`, `brandKits`, `templates`, `settings`
- [x] `lib/db/projects.ts` — CRUD: criar, ler, renomear, duplicar, apagar
- [x] `lib/store` — preferências (tema, último formato) via localStorage
- [x] Dashboard: grade de projetos, criar, renomear, duplicar, apagar (com confirmação)
- [x] Salvamento sobrevive ao reload (IndexedDB) — verificado no navegador
- [x] `LICENSE` (MIT) + campo `license` no `package.json`
- [x] `README.md` com instalação, deploy genérico e as duas frases de adoção
- [x] `base` do Vite por variável de ambiente (raiz ou subdiretório)
- [x] Vitest configurado + testes (factory, migrações, CRUD) — 17 testes passando

### Aceite (SPEC §15) — ✅ verificado

Criar, renomear, duplicar e apagar projetos; sobrevive ao reload. Testado no
navegador (criar → duplicar → reload mantém tudo) e em testes unitários.

### Pendente / próximas fases

- `config/shortcuts.ts` entra na Fase 1 (não há editor ainda para atalhar).
- Stubs de `assets`/`brandKits`/`templates`: sem CRUD real nesta fase.
- Exportação de backup `.criativo` mencionada na UI ("em breve") — Fase 3.

### Decisões tomadas no caminho

- **Tailwind v4** com plugin oficial `@tailwindcss/vite` (sem `tailwind.config.js`;
  tema via `@theme` no CSS). shadcn/ui em modo manual (componentes copiados em
  `components/ui`), sem rodar a CLI interativa.
- **IDs** via `crypto.randomUUID()` — sem dependência extra.
- **Reatividade do dashboard** via `dexie-react-hooks` (`useLiveQuery`).
- Stubs vazios para `assets`/`brandKits`/`templates` nas próximas fases; nesta fase
  só `projects` tem CRUD real.
