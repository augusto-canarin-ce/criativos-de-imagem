# PROGRESS

Registro de progresso por fase. Atualizado ao fim de cada fase, conforme SPEC §15.
As fases aparecem da mais recente para a mais antiga.

## Estado atual

**v1 completo e aprovado.** As oito fases (0 a 7) da SPEC §15 estão implementadas
e **todas aprovadas pelo usuário** — a Fase 7 em 2026-08-11. `main` está
sincronizada com `origin/main`. Verificação a cada fase: `npm run typecheck`,
`npm test` (147), `npm run test:visual` (8) e `npm run build`.

**Em andamento:** o modo guiado "Criativo rápido" (SPEC §18) — pedido em
2026-08-11, especificado, **plano apresentado e aguardando aprovação**. Nada foi
construído ainda.

Depois dele, em ordem de valor (§15): PWA instalável, remoção de fundo local,
tamanho custom de criativo. A lista completa do que ficou para depois está em
"Pós-v1", no fim da seção da Fase 7. A hospedagem segue em aberto por decisão do
usuário — o `dist/` sobe em qualquer host estático e nada no build depende de
plataforma.

**Regras aprendidas que valem para qualquer mudança futura:**

- Nunca `structuredClone` dentro de uma receita do Immer — use `deepClone`
  (`current`/`isDraft`). Aconteceu três vezes.
- `Konva.Text` com altura fixa não recorta: ele **derruba linhas inteiras**. A
  invariante `normalizeTextHeights` protege; não remova.
- `requestAnimationFrame` congela em página oculta — em pipeline crítico (export),
  use macrotasks.
- Cor e fonte só respeitam a marca se passarem por `resolveColor`/`fontStack`.
- Um único caminho de render (`StageScene`) serve preview, comparar, miniatura e
  export. Não crie um segundo.

---

## MODO GUIADO "Criativo rápido" (2026-08-11) — 📋 planejado, **não construído**

Funcionalidade pós-v1 pedida pelo usuário. Especificada na **SPEC §18**. O plano
foi apresentado e aguarda aprovação; nenhuma linha de implementação foi escrita.

**Motivação:** o público real são pessoas de 50+ que já desistiram do Canva e do
Figma. O editor completo intimida, e uma ferramenta que resolve o problema delas
só resolve se elas chegarem ao fim.

### O que o levantamento no código encontrou (é o que molda o plano)

- **Os modelos de fábrica não têm papéis.** As camadas de texto se chamam
  "Chamada", "Detalhe", "CTA", "Rótulo", "Código", "Condição", "Preço" — nomes
  para o painel de camadas, que **não servem de pergunta**. As imagens já têm
  `placeholder.label`, os textos não têm nada equivalente. Daí o campo `guide`.
- **Só 2 dos 12 modelos têm espaço de logo** (os dois institucionais). O passo 3
  não teria onde colocar o logo nos outros 10.
- **`projectFromTemplate` já faz o trabalho pesado** (ids novos preservando a
  identidade entre formatos) e `propagateProject` já deriva os três formatos. O
  modo guiado não precisa de motor próprio.
- **`staticChecklist` já cobre os avisos do passo 5**; falta a tradução leiga.
- Campos opcionais no modelo não exigem migração: `CURRENT_SCHEMA_VERSION`
  continua 1 e projeto antigo segue válido.

### Decisões de arquitetura propostas

- **O estado do fluxo mora no projeto** (`Project.guided`), não num store à
  parte — é o que dá salvamento automático e "fechar e voltar depois" de graça,
  já que o projeto persiste no Dexie a cada mudança.
- **O projeto nasce no passo 1**, ao escolher o modelo. Do passo 2 em diante é um
  projeto normal, e sair para o editor a qualquer momento não perde nada.
- **Um `guide` por camada** (`role`, `question`, `order`, `optional`) transforma
  modelo em roteiro. Camada sem `guide` não vira pergunta.
- **Pular o logo remove a camada**, não a deixa vazia: placeholder vazio vira
  aviso no checklist e quadro tracejado no anúncio.
- O modo guiado **não usa o escopo `.ds-app`** — ele densifica a interface para
  trabalho, e aqui vale o contrário.

### Decisões do usuário (2026-08-11) — as três perguntas em aberto, respondidas

1. **Só no computador**, mesma regra do editor (§13). Consequência registrada na
   SPEC: a landing abre no celular, então o botão "Criativo rápido" precisa
   avisar antes do clique e a rota precisa cair no aviso de modo leitura, não
   num fluxo quebrado.
2. **Passo 1 mostra 4 objetivos, um modelo cada.** Os outros oito seguem
   disponíveis no editor completo.
3. **Cinco passos fixos com subcontador nos textos**: "Passo 4 de 5 · texto 2 de
   3". Total que muda no meio do caminho quebra a confiança de quem já está
   inseguro.

Com isso o plano está fechado. Falta só a aprovação para implementar.

---

## Refinamento da landing page (2026-08-10)

Pedido do usuário, com uma referência visual anexada: outra landing dele, mesma
identidade, produto diferente. A instrução foi copiar a **linguagem visual**, não
o tom — a referência promete automação, IA e "viralizar", e este produto promete o
contrário (§1).

### Feito

- [x] **Recuperadas as utilities de marketing do design system** em vez de
      recriar equivalentes: `dot-grid`, `marquee`, `premium-card` (com spotlight
      e brilho de borda) e o botão `shiny` de borda esmeralda giratória. Elas
      tinham ficado de fora quando o DS foi aplicado, porque nada no editor as
      usava. Valores portados sem alteração; o `useSpotlight` veio junto.
- [x] A landing ganhou a pegada da referência: fundo de pontos cobrindo a página,
      duas linhas verticais emoldurando a coluna (alinhadas ao contêiner —
      conferido: 144px e 1296px numa viewport de 1440), header fixo com links ao
      centro e pílula shiny à direita, badge em pílula com ícones, headline em
      duas linhas com a segunda em esmeralda sobre brilho radial, eyebrows em
      esmeralda, cards de funcionalidade com ícone em quadrado esmeralda,
      carrossel e rodapé de uma linha.
- [x] **O card do hero virou a demonstração dos três formatos** (na referência é
      um dropzone de upload, que aqui não faz sentido). Os mockups estão na mesma
      escala: mesma largura, alturas diferentes, e as peças mantêm o tamanho nos
      três mudando só o apoio — título no topo, botão na base, foto esticada
      entre os dois. CSS puro, sem imagem remota.
- [x] **Badge sem prova social inventada.** A referência traz "+1.500 vídeos
      editados"; não temos número de uso e não vamos criar um. Ficou "Roda no
      navegador · código aberto", que é verificável.
- [x] As três funcionalidades em destaque passaram a ser as que diferenciam de
      verdade: adaptação automática entre os formatos, placeholders para remontar
      em segundos, exportação dos três de uma vez.
- [x] Os cinco argumentos da §13 seguem na ordem registrada, de cima para baixo:
      1 na headline e na seção de funcionalidades; 2, 3, 4 e 5 na seção "por que é
      assim", com a ausência de IA declarada como decisão de produto.
- [x] SPEC §13 atualizada com o refinamento e com as três decisões de conteúdo.

### Verificado

- Contraste medido no navegador, texto por texto: headline 18.9:1, esmeralda da
  headline e dos eyebrows 10.3:1, corpo e legendas 8.3:1, badge 12.9:1. Um caso
  reprovou — as dimensões sob os mockups usavam `text-faint`, 4.18:1 — e passou
  para `text-mute`.
- `prefers-reduced-motion`: as três regras compilam. O carrossel para de vez
  (`animation: none`, porque a regra global só encurta a duração e o deixaria
  parado na segunda cópia); o spotlight e o hover dos cards perdem a transição.
- Celular (375px): sem rolagem horizontal (`scrollWidth` = 375), links do header
  escondidos, mockups reduzidos, molduras verticais só a partir de `lg`.
- Zero requisição externa: 222 recursos carregados, nenhum fora do localhost.
- Editor e dashboard conferidos depois da mudança no `Button` compartilhado — o
  `Exportar os 3` continua com o CTA contido, sem shiny.
- `npm run typecheck`, `npm test` (147), `npm run test:visual` (8) e
  `npm run build` passando.

**Decisão que vale para o futuro:** o shiny e os cards premium são da **landing**,
não do editor. Numa página de produto o botão é o assunto; numa tela de trabalho
ele competiria com o criativo, onde vale a hierarquia por exceção.

---

## FASE 7 — Acabamento e publicação  ✅ concluída — **v1 COMPLETO**

### Feito

- [x] **Landing page** em rota própria (`#/`), com o posicionamento definido pelo
      usuário: um criativo/três formatos → nada sai do navegador → sem cadastro →
      grátis e MIT → só o necessário. Botão de entrada direta ("Abrir o editor"),
      nunca "criar conta". Mockup dos formatos em CSS puro — zero requisição
      externa. Dashboard passou para `#/projetos`; o logo volta para a landing.
- [x] Configurações (`Cmd+,`): tema, **safe zones editáveis por formato** com
      perfil Reels e "voltar ao padrão" (pendência da §7 desde a Fase 2 — agora o
      motor de adaptação, o overlay, o snapping e o checklist usam os valores do
      usuário), padrão de nome do export com prévia ao vivo, qualidade JPG.
- [x] Modal de atalhos (`?`) renderizado de `config/shortcuts.ts` — a mesma tabela
      que o código usa, então nunca diverge. O que ainda não existe aparece como
      "em breve" em vez de mentir (paleta de comandos e guias/réguas → pós-v1).
- [x] Armazenamento: cota real no diálogo, e o aviso do dashboard muda de tom
      acima de 80% (passa a ser sempre visível, com atalho para o backup).
- [x] **"Exportar todos"**: um ZIP com um `.criativo` por projeto, com progresso e
      desambiguação de nomes repetidos.
- [x] **Modo leitura no celular** (§13): abaixo de 768px o editor vira visualizador
      — três formatos empilhados pelo mesmo FormatStage, exportação disponível,
      edição não oferecida (com o motivo explicado).
- [x] README reescrito (o que faz, o que não faz, scripts, deploy genérico, onde
      ficam os dados, como contribuir) + CI de typecheck/testes/build.
- [x] Script anti-flash de tema no `index.html`, `<title>`/description da marca.

### Aceite (§15) — ✅ verificado com clone limpo

`git clone` num diretório novo → `npm install` → `npm run dev` → **HTTP 200**, e os
modelos de fábrica são servidos (`/templates/index.json` 200). `npm run build`
também passa no clone. Nenhum `.env`, nenhuma chave, nenhuma configuração.

### Bug real encontrado na verificação

`#root { height: 100% }` (herdado da Fase 0, quando só existia o editor) fazia a
landing rolar dentro de um contêiner do tamanho da tela e quebrava o layout. Agora
`html` tem altura fixa, `body`/`#root` usam `min-height`, e o editor pede
`h-screen` explicitamente — cada tela declara o que precisa.

### Pós-v1 (registrado, fora de escopo agora)

PWA instalável, remoção de fundo local, tamanho custom — nesta ordem (§15). Além
disso: paleta de comandos (`Cmd+/`), réguas e guias arrastáveis (`Shift+G`),
snapping de espaçamento igual entre 3+ objetos, diálogo de cota que lista projetos
por tamanho ao falhar uma gravação, e CI rodando a regressão visual (precisa
vendorizar os TTF para a rasterização bater fora do macOS).

---

## FASE 6 — Marca e modelos  ✅ concluída

### Feito

- [x] `lib/brand/tokens.ts` — `brand.<id>` (cor) e `brand.display`/`brand.body`
      (fonte) resolvidos NO RENDER (§6). O token de FONTE é extensão nossa da
      mesma filosofia: sem ele, "trocar a marca e ver as fontes atualizarem"
      (o aceite) seria impossível, porque `fontFamily` é string no modelo.
- [x] Store do kit ativo com duas faces: hook zustand (o canvas redesenha ao
      trocar de kit) + espelho module-level (o medidor de texto e a invariante de
      altura rodam fora do React e precisam da mesma resolução).
- [x] CRUD de kits; múltiplos, um ativo por projeto; apagar um kit desvincula os
      projetos que o usavam (tokens caem no fallback, nada quebra).
- [x] BrandPanel: cores nomeadas (add/remover/renomear), fontes por papel, logos
      (com "inserir no criativo"), estilos de texto salvos da seleção e aplicáveis
      em um clique. Arquivo `.marca` (ZIP com kit + logos embutidos) export/import
      com ids regenerados.
- [x] Cores da marca EM DESTAQUE no topo do seletor de cor (§8) — clicar aplica o
      TOKEN, não o hex; o campo passa a mostrar o nome da cor em vez de um hex
      opaco, deixando visível que a camada segue a marca.
- [x] 12 modelos de fábrica em `/public/templates` (3 por objetivo), gerados por
      `scripts/gen-templates.mjs`. Só o layout 4:5 é descrito: ao aplicar, o motor
      da Fase 2 deriva 1:1 e 9:16 — nada de layout duplicado no arquivo.
- [x] Modelos do usuário (IndexedDB, aba "Meus"), aplicar modelo herdando a marca
      ativa e abrindo com o primeiro placeholder selecionado (§8), ação escondida
      "Exportar como modelo de fábrica" (aparece com Alt).
- [x] Miniatura dos modelos pela MESMA StageScene do editor/export em escala
      reduzida — sem segundo caminho de desenho.
- [x] 23 testes novos (tokens, estilos, aplicar modelo) + validação dos 12 JSONs
      contra o schema zod, cobrindo o contrato "toda imagem é placeholder rotulado
      e toda cor é token". 143 unitários + 8 visuais.

### Aceite (§15) — ✅ verificado no navegador E no export

Modelo "Oferta em destaque" aplicado, duas marcas criadas. Ao trocar de kit no
painel, o criativo inteiro mudou de uma vez: cores (fundo, faixa, botão) e FONTE
do título (Montserrat → Bebas Neue), em todas as camadas, sem tocar em nenhuma.
Provado também nos pixels do EXPORT: o mesmo botão sai `rgb(16,184,132)` com a
Marca 1 (primary `#10b981`) e `rgb(220,38,37)` com a Marca 2 (primary `#dc2626`)
— a diferença de 1 é a compressão JPEG do preview. Round-trip do `.marca`
preservou cores e fontes com id novo.

### Notas

- Miniaturas dos modelos aparecem em cinza sem marca ativa: é o fallback dos
  tokens funcionando, não um bug — ganham cor assim que existe um kit.
- Estilo de texto guarda só aparência (fonte, tamanho, cor, marca-texto…),
  nunca geometria ou conteúdo — mover a camada não a marca como "modificada".
- O ponto único de risco desta fase é a resolução fora do React: qualquer novo
  código que leia `fontFamily`/cor sem passar por `fontStack`/`resolveColor`
  ignoraria a marca. Todos os caminhos atuais passam.

---

## FASE 5 — Tipografia e cor  ✅ concluída

### Feito

- [x] Curadoria de 29 famílias via fontsource (17 Títulos + 12 Corpo incl. Geist),
      todas com peso pesado ou display de peso único, empacotadas no bundle
      (dist ~8.9MB; @font-face carrega o woff2 local só quando a família é usada).
      Teste de integridade confere curated.ts ↔ curated-imports.ts.
- [x] Busca no Google Fonts SEM chave de API: catálogo (1941 famílias, 81KB)
      vendorizado no repo como DADO — a busca funciona offline; só o carregamento
      da fonte escolhida vai à rede (css2 público, a exceção que a §16 permite),
      com timeout e mensagem clara em falha (§3).
- [x] Upload .ttf/.otf/.woff2 → Asset kind 'font' + FontFace; família a partir do
      nome do arquivo; registro na abertura do projeto. Loader classifica cada
      família usada (curada/sistema/usuário/google) e recarrega as do Google por
      nome ao reabrir o projeto.
- [x] Texto completo na UI: seletor agrupado (Títulos/Corpo/Minhas fontes/Google
      da sessão/Sistema), pesos DINÂMICOS por família (peso indisponível ajusta
      sozinho), sublinhado, lista, alinhamento vertical.
- [x] Seletor de cor próprio: área SV + matiz + alfa (hex de 8 dígitos quando
      alfa < 100%), campo hex, conta-gotas via EyeDropper (botão some onde a API
      não existe — §8), em TODOS os campos de cor via ColorField.
- [x] Extração de paleta por median cut próprio (ignora pixels transparentes,
      deduplica caixas convergentes): cores dominantes das imagens do criativo
      como sugestão no seletor. "Adicionar ao brand kit" chega na Fase 6.
- [x] 19 testes novos (paleta, catálogo/busca/css2, integridade da curadoria,
      classificação do loader, nome de família) — 120 unitários + 8 visuais.

### Aceite (§15) — ✅ verificado no navegador

Identidade completa aplicada no projeto de QA: título em fonte DISPLAY da curadoria
(Anton, do bundle), depois em fonte do GOOGLE buscada e carregada ao vivo (Lobster,
css2 sem chave), e por fim na FONTE PRÓPRIA enviada (.woff2 real → "Fonte Da
Marca"), pintado com a cor #0e7490 clicada na paleta EXTRAÍDA da imagem da marca.
document.fonts confirmou cada família; o dado persistiu no projeto.

### Notas

- Nomes de família de fonte enviada vêm do arquivo (não da tabela name do
  binário) — simples e previsível; refinamento fica anotado para o futuro.
- Fixture visual com fonte enviada entra quando houver TTF vendorizado para CI
  (pendência já registrada); em jsdom o @font-face CSS não carrega.
- Correção de robustez no outside-click do picker (target não-Node).

---

## Correção pós-Fase 4 — Texto multilinha sumindo  ✅

**Sintoma:** camada com 2 linhas perdia a última (o dado ficava, o desenho não).

**Mecanismo (provado por teste de diagnóstico):** Konva.Text com altura fixa não
recorta — **derruba linhas inteiras** que não cabem; `frame.h` 3px curto apaga a
2ª linha. **Origem da altura curta:** o confirmar da edição media via
`scrollHeight` do `<textarea>` — inteiro em px de TELA (zoom ~35%) — e devolvia ao
espaço do documento perdendo até ~3px, somado à quebra de linha DOM ≠ Konva que a
§8 já avisava. O arraste não alterava nada; era só quando o Konva reassumia o
desenho no lugar do textarea.

**Correção na raiz:** invariante única `normalizeTextHeights` (lib/layout/adapt):
texto sem auto-fit sempre tem `frame.h ≥` altura medida pelo PRÓPRIO motor Konva.
Roda dentro de `propagateProject` — ou seja, em TODO commit e no load — então
sobrevive a arrastar, redimensionar (o commit do resize restaura o mínimo), trocar
de formato, recarregar e reabrir/importar. A medição por scrollHeight foi removida
do confirmar (fonte do erro). Auto-fit segue com o contrato inverso (caixa fixa,
fonte encolhe) e fica fora da invariante.

**Export:** usa o mesmo estado normalizado — coberto pela fixture visual nova
`texto-multilinha` (2 linhas por quebra automática + 3 por \n, criadas com altura
curta de propósito e corrigidas pelo pipeline real; a ref acusa linha derrubada).
Teste de diagnóstico do comportamento do Konva mantido como guarda permanente.
4 testes de invariante + diagnóstico + fixture = caso real do usuário verificado
renderizando as duas linhas após reabrir o projeto. 101 unitários + 8 visuais.

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

## Pendências registradas durante a Fase 4  — ✅ resolvidas na Fase 7

Mantido como histórico; o estado atual das pendências está no topo do arquivo,
em "Pós-v1", dentro da Fase 7.

- ~~Landing page~~ → feita na Fase 7 (registrada na SPEC §13 em 2026-08-07).
- ~~"Exportar todos" (backup completo, §12)~~ → feito na Fase 7.
- Réguas + guias arrastáveis (`Shift+G` reservado) — **segue pós-v1**.
- Snapping de espaçamento igual entre 3+ objetos — **segue pós-v1**.
- CI com refs visuais pinadas (vendorizar TTF) — **segue pós-v1**.

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
