# PROGRESS

Registro de progresso por fase. Atualizado ao fim de cada fase, conforme SPEC §15.
As fases aparecem da mais recente para a mais antiga.

## Estado atual

**v1 completo e aprovado.** As oito fases (0 a 7) da SPEC §15 estão implementadas
e **todas aprovadas pelo usuário** — a Fase 7 em 2026-08-11. `main` está
sincronizada com `origin/main`. Verificação a cada fase: `npm run typecheck`,
`npm test` (147), `npm run test:visual` (8) e `npm run build`.

**Modo guiado "Criativo rápido" (SPEC §18) concluído** em 2026-08-11, nos três
blocos combinados: roteiro dos modelos, casca com os passos 1 a 4, e o passo 5
com o checklist traduzido e o download dos três.

Próximos passos possíveis, em ordem de valor (§15): PWA instalável, remoção de fundo local,
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

## Papéis nome e cargo (2026-08-13) ✅

Preparação para o "Depoimento" desenhado à mão, pela receita do preco/selo:
enum em types/schema, telas de texto do passo 4, nomes amigáveis ("o nome de
quem falou", "o cargo ou a empresa") e regras de inferência (Nome→nome,
Cargo/Empresa→cargo; antes caíam em subtitulo). Tabela de convenção da SPEC §18
atualizada. O depoimento GERADO continua com roteiro autoral em subtitulo —
válido; o desenhado vai substituí-lo. 215 testes.

---

## Guiado: auto-ajuste de fonte ao digitar (2026-08-17) ✅

Texto digitado mais comprido que o exemplo quebrava em mais linhas do que a
caixa e o Konva derrubava as de baixo — a pessoa via só metade do título no
preview. Causa: o auto-fit rodava na derivação e no editor completo (overlay ao
confirmar), mas o `escreverTexto` do guiado só gravava o conteúdo. Correção no
MOTOR (vale para os quatro modelos e para o "trocar texto" do passo 4/conferir):
a cada tecla, `fontSize` parte do teto do desenho (`autoFit.max`) e desce via
`fitFontSize` até caber — apagar texto devolve a fonte ao tamanho original em
vez de ficar presa no menor já usado. Reproduzido e conferido no navegador com
o caso real ("Conversão Extrema ao vivo em 2 dias" no Motivos para comprar:
81→80, duas linhas, título inteiro no preview). 212 testes.

---

## Guiado: 4 passos, check de concluído, logo→home, header preto (2026-08-17) ✅

Quatro ajustes de interface pedidos pelo usuário, todos conferidos na tela:

- [x] **Escolher o modelo virou porta de entrada, sem número.** O fluxo abre em
      "Passo 1 de 4" (antes "Passo 2 de 5", que lia como algo pulado).
      `TOTAL_PASSOS=4`, `NOME_DO_PASSO` (morto) removido, SPEC §18 reescrita
      ("A entrada e os quatro passos").
- [x] **Confirmação inconfundível ao concluir**: a área da foto vira estado
      verde com check central ("Concluída! A imagem já está no criativo ao
      lado." + Trocar); o campo de texto ganha check assim que há conteúdo.
      Sem auto-avanço — Continuar segue sendo a decisão da pessoa.
- [x] **Logo "Criador Extremo" sempre clicável → página inicial.** Dashboard e
      landing já eram; os dois headers do guiado ganharam o clique.
- [x] **Header sempre preto nos dois temas** (landing, dashboard, guiado):
      classe `dark` no próprio header re-escopa os tokens do tema, então
      botões/ícones se ajustam sozinhos — conferido no tema claro (fundo
      #fafafa, header rgb(0,0,0), controles legíveis).

212 testes + typecheck. Fluxo completo verificado no navegador: card → "Passo
1 de 4 · foto 1 de 2" (4 barras), upload → estado concluído, texto → check,
logo → `#/`.

---

## Miniaturas sem rótulo de placeholder (2026-08-13) ✅

Nos modelos com foto de fundo do tamanho do quadro (Oferta e preço, Motivos
para comprar), o rótulo "Foto do produto" caía no centro da miniatura, por
cima do título. As duas miniaturas (passo 1 do guiado e painel de Modelos) usam
a MESMA StageScene — um interruptor cobriu os dois: prop `placeholderLabels`
(default true) descendo StageScene → LayerNode → ImageShape; as miniaturas
passam `false`. Só o TEXTO sai — o quadro tracejado fica, ainda demarca a
área. Editor, preview do guiado e export intocados (default). 212 testes +
8 visuais; conferido na tela: passo 1 e painel limpos, canvas do editor com
o rótulo.

---

## Modelos gerados removidos: ficam só os quatro desenhados (2026-08-13) ✅

Os 11 gerados por script saíram (eram 11, não 12 — o antes-e-depois já tinha
saído da geração quando virou desenhado). Com os quatro objetivos do passo 1
resolvendo para modelos desenhados, nenhum precisava de reserva.

- [x] 11 `.json` apagados; `index.json` com 4 entradas, na ordem dos objetivos
      do passo 1, e **mantido à mão** daqui em diante (aceito pelo usuário; o
      contrato pune entrada errada ou arquivo faltando).
- [x] `gen-templates.mjs` e a lista HANDMADE apagados — a lista só existia para
      proteger os desenhados do script.
- [x] Objetivos com um id cada (fallbacks gerados removidos); lista de um
      elemento é o caso do antes-e-depois desde o primeiro dia.
- [x] Testes: contagem vira asserção EXATA dos 4 arquivos; fixtures repontadas
      (produto-em-destaque substitui oferta-em-destaque; "Fundo do botão"
      substitui o "Sombreado" como decorativa); os casos "texto opcional" e
      "logo não pulável" viram mutações inline — o comportamento é do motor,
      não de arquivo; teste da logo voltou a cobrar os TRÊS formatos (a
      ressalva dos derivados vazios era coisa de modelo gerado). 212 testes.
- [x] Projetos existentes não quebram: cópia independente, e o único vínculo
      (`guided.templateId`) é gravado e nunca relido.
- [x] SPEC §10/§18 atualizadas (quatro desenhados como fábrica, index à mão,
      candidatos de um id); §15/Fase 6 fica como registro histórico.

---

## "Motivos para comprar" integrado — os QUATRO modelos desenhados completos (2026-08-13) ✅

Quarto e último modelo desenhado à mão (`builtin-lista-de-beneficios`, 15
modelos no total). Passo 4 rende seis telas: título → apoio → três motivos
(papel `beneficio`, perguntas e ordens distintas) → botão. Duas intervenções
minhas, reportadas:

- [x] **Ids unificados** (bug do conversor, fora da lista de propósitos do
      usuário): "Foto do produto" e "Véu" vinham com UUID diferente por
      formato. A adaptação casa POR ID — na primeira propagação a base seria
      re-derivada por cima (foto de 1350px vazando o quadro) e a cópia com
      override viraria "camada só do destino" no topo da pilha, cobrindo o
      conteúdo e fora do alcance do preenchimento do passo 2. Os ids da base
      mandam. Contrato ganhou o teste "a mesma camada tem o MESMO id nos três
      formatos" (layout derivado vazio segue legal).
- [x] **Véu convertido a gradiente** (pedido do usuário): sólido `#0a0a0a` a
      55% → `{ kind: 'linear', angle: 180, stops: [#0a0a0a00 @0, #0a0a0a @1] }`
      com opacity 0.75 — transparente no topo, preto na base, convenção CSS de
      ângulo. Formato documentado para o conversor do usuário.
- [x] Literais deliberados declarados (`#a1a1a1`; `#0a0a0a` por futuro — hoje o
      Véu é gradiente e stops ficam fora da checagem de sólidos).
- [x] 223 testes; verificado no navegador: objetivo resolve para o novo id,
      seis telas de texto com subcontador, véu em gradiente, ids iguais nos
      três formatos, cartão do passo 1 renderizando.

**Marco: os quatro modelos do passo 1 são 100% desenhados à mão** (Produto em
destaque, Oferta e preço, Antes e Depois, Motivos para comprar). Modelos
gerados por script seguem no editor completo.

---

## Papel beneficio + objetivo "Motivos para comprar" (2026-08-13) ✅

O quarto modelo desenhado mudou: em vez de Depoimento, lista de benefícios
(título, apoio e três itens curtos). Preparação:

- [x] Papel `beneficio` pela receita: enum, telas do passo 4, prioridade da
      inferência (após subtitulo), nome amigável "um item da lista", regras
      com os sinônimos Benefício/Item/Motivo/Vantagem, linha na tabela da SPEC.
      Ele se REPETE na mesma peça (três camadas) — permitido como qualquer
      papel de texto; a distinção entre os itens vem da pergunta/ordem de cada
      um. Os guardas novos cobraram sozinhos cada ponto da receita (compilador:
      PRIORIDADE_TEXTO e PAPEIS_DE_TEXTO; contrato: linha da SPEC).
- [x] Objetivo do passo 1 renomeado: id `lista-de-beneficios`, rótulo
      "Motivos para comprar", descrição "Para listar três razões de escolher
      você.", candidatos ['builtin-lista-de-beneficios', 'builtin-depoimento'].
      O depoimento gerado segue no editor e segura a ponta até o arquivo
      desenhado chegar (verificado no navegador: cartão novo na tela,
      resolvendo para o fallback).

---

## Convenção de nomes executável: SPEC §18 ↔ regras ↔ enum (2026-08-13) ✅

A porta que mordeu duas vezes (preco/selo, nome/cargo) fechou em duas camadas:

**Contrato** (`convencao.test.ts`, 6 testes): lê a tabela de convenção da SPEC
§18 e cobra — papel citado ∈ enum; todo termo tem regra com o papel prometido;
toda regra está documentada; nenhum papel órfão no enum; toda regra produz
papel válido. Mensagens de falha dizem O QUE FAZER (qual arquivo, qual ação),
não só o que divergiu. As duas linhas estruturais de foto (família aberta
"Foto/Imagem + …" e "ANTES · DEPOIS") ficam numa lista visível no teste com o
porquê, sob checagem frouxa (termos existem nas regras de imagem). Fricção
aceita: reformatar a tabela quebra o teste. Se o parse do markdown virar dor,
o combinado é inverter — convenção mora no código e a seção da SPEC é gerada.
Provado com sabotagem: remover a linha "Condição" derruba com a mensagem certa
(e de quebra o teste já pegou uma divergência real na estreia: a regra
`condicao` não estava documentada — linha adicionada à tabela).

**Compilador**: `GuideTextRole` (Exclude sobre GuideRole) + dois Records
exaustivos — `PRIORIDADE_TEXTO` no templatize (papel de texto sem prioridade
não compila; antes a comparação virava NaN e a hierarquia degradava para
posição em silêncio) e `PAPEIS_DE_TEXTO` no buildScreens (papel não
classificado não compila; antes a pergunta simplesmente não aparecia no
passo 4). 221 testes.

---

## "Oferta e preço" v2: foto de fundo no tamanho do quadro (2026-08-13) ✅

Reexport do usuário: a foto sangrada (1619×2428 em −28/−107) fazia o rótulo do
placeholder renderizar gigante, atravessando o botão. Agora a camada é
exatamente o quadro em cada formato (1080×1350 / ×1080 / ×1920, âncora top,
opacidade 0.66, primeira da pilha) — por isso ganhou override no 1:1 e no 9:16
(alturas diferentes não derivam); as outras sete camadas seguem sem override.
Detalhe: o arquivo entregue voltou com letterSpacing 0.08 (a conversão de origem
reintroduziu o valor em em) — reapliquei 0.08→2.4 nas três ocorrências, avisado
ao usuário. Contrato verde (215), cartão do passo 1 conferido sem o rótulo
estourado.

---

## "Oferta e preço" desenhado à mão integrado + papéis preco/selo (2026-08-13) ✅

Terceiro dos quatro modelos. O arquivo estreia **dois papéis novos de roteiro**,
`preco` e `selo`, que passaram a existir de verdade: enum em types/schema, telas
de texto do passo 4 (`buildScreens`), nomes amigáveis ("o preço", "a etiqueta")
e regras de inferência do templatize atualizadas (antes preco/selo/etiqueta
caíam em `subtitulo`). Passo 4 do guiado agora rende cinco telas na ordem do
autor: selo → título → preço → subtítulo → botão ("Passo 4 de 5 · texto 3 de 5"
conferido no navegador).

- [x] Arquivo em `public/templates/`, index (14 entradas) e HANDMADE; contagem
      do contrato 13→14. Objetivo do guiado resolve para o novo id (candidato
      já registrado; `builtin-preco-em-selo` vira fallback inerte).
- [x] **letterSpacing é px** no editor (tipo, Konva e CSS) — o 0.08 (em, do
      Figma) virou **2.4** (0.08 × 30px) nas três ocorrências do Selo. Única
      mudança minha no arquivo.
- [x] Literais deliberados (`#0a0a0a` fundo, `#a1a1a1` em Subtítulo/Selo)
      mantidos; o contrato ganhou a lista `LITERAIS_DELIBERADOS` — literal
      declarado passa, literal acidental continua acusando.
- [x] 215 testes verdes.
- [x] Observado de passagem e corrigido em seguida (pedido do usuário):
      miniaturas do PASSO 1 do guiado renderizavam tokens no cinza de fallback
      (tela sem projeto → nenhum kit ativo). O `EscolherModelo` agora ativa na
      montagem o MESMO kit com que o projeto vai nascer (`kitPreferido`: kit
      próprio não-padrão vence, senão o de fábrica — uma função só para
      miniatura e clique, "o que se vê é o que se cria") e carrega as fontes
      dele. O editor completo não muda: `useActiveBrandKit` põe o kit do
      projeto por cima assim que qualquer projeto abre.

Falta só o **Depoimento** (substitui o arquivo do `builtin-depoimento`).

---

## "Produto em destaque" final: três formatos com overrides do usuário (2026-08-13) ✅

Reexport do usuário substituiu o arquivo (byte-idêntico, sem nenhum ajuste meu):
4:5 com a foto encurtada (y81/h533), 1:1 com as seis camadas em override
(conteúdo fecha em 956px, dentro dos 960 úteis), 9:16 só com a foto em override
(y250/h649) — as demais seguem derivadas, incluindo o botão em y1497, que é a
derivação COM a correção automática de safe area (1747 bruto recuado 250px para
encostar no limite dos 340 de baixo). Fundo `#fafafa` literal mantido por
decisão do usuário. Contrato verde (214) e aplicação conferida no navegador.
**Segundo dos quatro modelos desenhados 100% concluído.** Faltam Oferta e preço
e Depoimento.

---

## Kit padrão de fábrica + logo sempre vem (2026-08-13) ✅

Dois ajustes aprovados em plano único.

**1. Brand kit padrão "Conversao Extrema"** — id fixo `brand-conversao-extrema`
em código (`lib/brand/defaultKit.ts`), 10 cores (5 papéis + 5 da paleta, nomes
do usuário), Geist Sans nos dois papéis (curadoria do bundle, offline).
`ensureDefaultBrandKit()` no mount: semeia se ausente (kit editado nunca é
sobrescrito; apagado renasce — decisão do usuário) e estampa projetos sem marca
**uma vez** (flag `default-brand-stamped` em settings; "sem marca" escolhido
depois é respeitado). `createProject` nasce com o kit; `projectFromTemplate` e o
passo 1 do guiado caem nele quando não há herança (kit próprio não-padrão vence
no guiado). Resultado visível: miniaturas e canvas com cor de verdade num
navegador limpo — fim do cinza `#888888` de token não resolvido.

**2. Logo sempre vem (reversão da regra de 2026-08-12)** — `projectFromTemplate`
aplica o arquivo como está, nos três caminhos; `isSkippableLogo`/
`layersAsApplied` e a opção `guided` deletados. Quem não quer logo apaga a
camada. "Usar completo" deixou de existir (os dois modos convergiram); o **Alt
continua** no painel com sua função de manutenção: revelar o "Exportar como
modelo de fábrica". Pular a logo DENTRO do fluxo guiado segue removendo no
encerramento, como antes.

Verificação: typecheck limpo, 214 testes (5 novos da semente; 3 da regra antiga
de logo reescritos em 1), e ao vivo no navegador — kit semeado com papéis e hex
exatos, projeto cinza estampado, miniaturas coloridas, logo presente nos três
formatos ao aplicar o Produto em destaque.

---

## "Produto em destaque" desenhado à mão integrado (2026-08-13) ✅

Segundo dos quatro modelos desenhados (convertido de SVG do Figma fora do
repositório). Entregue já no envelope certo, com roteiro autoral completo e os
três layouts derivados por âncora (conferido: os frames de 1:1/9:16 batem com o
que o motor produz — Δ −135/+285 center, −270/+570 bottom).

- [x] `public/templates/produto-em-destaque.json` byte-idêntico ao entregue;
      entrada no index e na lista HANDMADE (rodei o gerador e confirmei que ele
      não toca o arquivo; churn de UUID dos gerados revertido).
- [x] Contrato verde (211 testes; contagens atualizadas para 13 modelos).
- [x] Passo 1 do guiado: o objetivo "Produto em destaque" já listava
      `builtin-produto-em-destaque` como primeiro candidato — com o arquivo
      carregado ele vence sozinho, sem mudança de código (verificado no
      navegador). O `builtin-oferta-em-destaque` vira fallback inerte.
- [x] Fundo `#fafafa` literal mantido por decisão do usuário (a cor existe no
      kit mas não ocupa papel padrão; o contrato só exige token nos fills de
      camada, não no fundo do layout).
- [ ] 1:1 nasce com a foto estourando para cima (y = −76, derivação pura) — o
      usuário vai ajustar à mão no editor e reexportar, como fez no Antes e
      Depois.

---

## Modelos sem categoria: campo `category` removido (2026-08-13) ✅

Com uma dúzia de modelos, agrupar atrapalhava mais do que ajudava (decisão do
usuário). O painel já era uma lista única — a categoria era só um subtítulo no
cartão e um prompt a mais no Alt+export; nada consultava o campo (o passo 1 do
guiado resolve por **id**, e o índice `category` do Dexie nunca teve query).

- [x] `Template.category`/`TemplateCategory` fora de types, schema (zod),
      `TemplateIndexEntry`, `CATEGORY_LABELS`, `saveProjectAsTemplate` e
      `templateFileJson`. O Alt+export agora só pergunta o nome.
- [x] Dexie `version(2)`: `templates: 'id, name'` — índice morto removido, sem
      migração de dados (registros antigos com `category` residual continuam
      válidos: o zod descarta chaves desconhecidas).
- [x] Os 12 `.json` + `index.json` editados cirurgicamente (só a linha da chave,
      diff de 24 deleções — zero churn de UUID, o Antes e Depois desenhado à mão
      intacto). `gen-templates.mjs` alinhado para futuras regenerações.
- [x] SPEC §10 e §18 atualizadas; de passagem, o passo 1 do §18 deixou de listar
      os objetivos antigos ("Promoção", …) e passou a apontar para os quatro
      vigentes de "Modelos desenhados à mão".
- [x] Verificação: typecheck limpo, 210 testes, e no navegador — upgrade do Dexie
      confirmado num banco v1 existente (índices restantes: só `name`), os 12
      modelos passando no schema, painel com lista única sem rótulo, guiado
      resolvendo os 4 objetivos.

---

## "Antes e Depois" final: três layouts com overrides do usuário (2026-08-13) ✅

O usuário fechou o ciclo completo de manutenção: Alt+"Usar completo" → ajustes
nos três formatos no editor → Alt+"Exportar como modelo de fábrica". O arquivo
re-exportado entrou com os três layouts e overrides (`overriddenIn`) por camada.

- [x] Arquivo substituído; dois desencontros de 2px do arrasto manual corrigidos
      SÓ no 1:1 (Botão 935→937 alinhado ao fundo; Subtítulo 862→872, abaixo do
      fim do Título em 864). 4:5, 9:16 e roteiro conferidos intactos por diff.
- [x] Metadados do export divergiam do index (nome "Antes e Depois", categoria
      "institucional" vs "lancamento") — index e HANDMADE alinhados ao arquivo,
      que é a fonte de verdade; reportado ao usuário caso a categoria tenha sido
      acidental. O passo 1 do guiado resolve por id, não é afetado.
- [x] Contrato completo passando (210); aplicação verificada: 11 camadas no 1:1,
      todas com override, Botão/Fundo em 937..1020, Subtítulo 872..920.

Primeiro dos quatro modelos desenhados 100% concluído. Faltam: Produto em
destaque, Oferta e preço, Depoimento.

---

## Manutenção de modelo: "Usar completo" + roteiro autoral intocável (2026-08-13) ✅

Necessidade real do usuário ao ajustar o "Antes e depois" nos derivados: a logo
não vem no editor completo (regra de 2026-08-11), mas quem MANTÉM o modelo
precisa dela para posicionar nos três formatos e re-exportar.

- [x] **Alt + "Usar"** no painel de modelos vira **"Usar completo"**: aplica o
      modelo como está no arquivo, com o espaço de logo. Mesmo padrão do Alt que
      já esconde o "Exportar como modelo de fábrica" — ação de manutenção, fora
      do caminho de quem só usa. O projeto abre no editor normal (sem
      `project.guided`).
- [x] **Defeito real corrigido no caminho:** `inferGuides` sobrescrevia roteiro
      existente — no ciclo aplicar → ajustar → re-exportar, as perguntas
      autorais do modelo ("Qual a foto do ANTES?", dicas) seriam trocadas pelas
      inferidas por nome. Agora camada que já tem `guide` é intocável; a
      inferência só preenche o que chegou sem roteiro, continuando a numeração
      e respeitando papéis únicos já ocupados (logo, foto-principal).
- [x] Coberto por teste com o arquivo real: re-export do "Antes e depois"
      aplicado preserva pergunta, dica, papel e ordem autorais; camada nova
      entra em sequência sem mexer nas existentes. 210 testes no total.

---

## "Antes e depois" v2 integrado (2026-08-12) ✅

O usuário entregou a v2 com as âncoras calculadas (bloco visual em center, botão
em bottom) e a logo realocada para entre as fotos e o título. Tokens já vieram
nos ids padrão. Integrada com o mesmo envelope; contrato completo passando (208).

Derivação verificada no navegador:
- **9:16 perfeito**: fotos 344..1017, etiquetas com o offset de 35px, título
  1175..1365, botão 1497..1580 — tudo na área útil, sem avisos além do empurrão
  informativo do botão.
- **1:1 com o estrago previsto** (fotos de 673px por decisão do usuário): fotos
  sangram 76px acima do canvas (-76..597), etiquetas descolam das fotos
  (empurradas para 60), título 755..945 sobrepõe o botão 907..990 em 38px, e o
  subtítulo empurrado (972..1020) sobrepõe o botão em 18px.
- **4:5 fiel ao desenho**; fotos começam 21px acima da área segura (y=59 <
  80) — decisão de sangria do próprio desenho, gera aviso não-bloqueante.

Resposta dada: o override por formato resolve o 1:1 sem redesenhar o 4:5 — a
camada marcada `overriddenIn: ['1:1']` para de seguir a base só ali; mas dentro
do 1:1 as fotos precisam encolher (~500px), porque 994px de conteúdo sólido não
cabem em 960px úteis por deslocamento nenhum.

---

## Papéis padrão do brand kit + âncoras do 9:16 (2026-08-12) ✅

Consequências do diagnóstico do "Antes e depois": a raiz das miniaturas cinzas e
o conserto do formato derivado que era só configuração.

### 1. Papéis padrão de cor (a raiz)

- [x] `src/lib/brand/roles.ts`: os cinco papéis (`primary/secondary/accent/
      surface/ink`) viram invariante do kit. `claimStandardRoles` renomeia ids
      de cores existentes casando pelo nome (duas passadas: exata, depois
      "contém" — "Esmeralda claro" vira accent ANTES de "esmeralda" reivindicar
      primary); papel sem candidata ganha a cor default.
- [x] **Renomear id quebraria referências** — o ColorPicker grava `brand.<id>`
      nas camadas. Por isso `migrateBrandKitRoles` também reescreve os tokens em
      todos os projetos e modelos do usuário QUE USAM o kit (`rewriteColorTokens`
      em fills, stops, highlight e fundo). Projeto de outro kit com token
      homônimo não é tocado — coberto por teste.
- [x] Migração roda na abertura do app (no-op quando íntegro). Kit importado
      (.marca) também passa pela garantia.
- [x] O painel de marca **não deixa mais apagar** uma cor de papel padrão
      (cadeado no lugar da lixeira, com explicação) — sem isso a migração seria
      enxugar gelo. Trocar a COR do papel continua livre.
- [x] **Verificado ao vivo**: o kit "Conversao Extrema" do navegador de teste
      migrou sozinho no load — Esmeralda→primary, Esmeralda claro→accent,
      Grafite→ink, Cinza→secondary, Branco→surface, o mapeamento pedido.

### 2. Âncoras do "Antes e depois" (9:16)

- [x] Fotos, etiquetas, rótulos, título e subtítulo → `center`; botão continua
      `bottom`, logo `top`. Derivação verificada no navegador: fotos 441..1114,
      etiquetas mantendo os 35px de offset, título 1165..1355, botão em
      1497..1580 — tudo dentro da área útil (250..1580), sem buraco morto.
- [x] O 1:1 continua com a colisão estrutural — aguarda o redesenho das fotos
      (número entregue ao usuário: ver abaixo).
- [x] **`gen-templates.mjs` não pode mais atropelar modelo desenhado**: o
      "Antes e depois" saiu da lista gerada e entrou numa lista `HANDMADE` que
      só alimenta o index. Rodar o script preserva o arquivo à mão — verificado
      rodando e conferindo a âncora center intacta.

### 3. O número para o redesenho do 1:1 (entregue, sem mexer)

Com as âncoras acima e a logo no topo: **fotos de 380px de altura, começando em
y=300** (máximo matemático 405 — 380 deixa 55px de folga acima do botão no 1:1).
Alternativa com a logo na base: fotos de até **480px começando em y=195**.
A conta: conteúdo sólido (fotos + título 190 + subtítulo 48 + botão 83 + vãos
51/20) precisa caber nos 960px úteis do 1:1, com o deslocamento de −135 do
center e a logo ocupando o topo até y=140.

**Testes:** 208 (8 novos de roles/migração).

---

## Modelos desenhados à mão — 1 de 4 integrado (2026-08-12)

**"Antes e depois" entregue** (desenhado no Figma, convertido a JSON) e integrado
em `public/templates/antes-e-depois.json`, substituindo o gerado por script.
Contrato completo passando contra ele (31 testes do guiado + 200 no total).

**Ajustes feitos no arquivo para bater com o formato** (reportados ao usuário):

- Embrulhado no envelope de modelo (`builtin/createdAt/project{...}`) com os
  layouts 1:1 e 9:16 vazios — o motor os deriva ao aplicar.
- `category: "antes-e-depois"` não existe; ficou `lancamento` (é só o rótulo de
  agrupamento no painel do editor).
- **Tokens de cor remapeados para os ids padrão do kit**: `brand.grafite` →
  `brand.secondary`, `brand.esmeralda` → `brand.primary`, `brand.cinza-claro` e
  `#ffffff` → `brand.surface`. Os ids originais não existem em kit nenhum e
  renderizariam na cor de token não resolvido (#888888).
- Logo movida de y=55 para y=80 (o topo da área segura do 4:5).

**Curadoria estendida no fluxo guiado:** `fonte-pequena` e `contraste` presos a
camada decorativa do modelo (sem roteiro) não viram aviso — as etiquetas
ANTES/DEPOIS usam 20px de propósito e a pessoa não pode mudá-las no fluxo. Mesmo
princípio da área segura; coberto por teste.

**Verificado no navegador:** "Passo 2 de 5 · foto 1 de 2 → Qual a foto do
ANTES?" e "foto 2 de 2 → E a foto do DEPOIS?", nesta ordem; logo pulável no
passo 3; passo 5 sem ruído de fonte pequena.

**Dois achados reportados, sem mudança:**

1. No 9:16 derivado, as duas fotos (ancoradas no topo, y=156) entram na faixa
   que o Stories cobre (topo = 250) — todo criativo deste modelo nasce com dois
   avisos "puxe para o centro" no passo 5, com correção de um clique. Imagem não
   entra na correção automática de área segura (só texto e forma, por design).
2. Kit de marca sem os ids padrão (`primary/secondary/accent/surface/ink`) — o
   caso do kit criado por extração de paleta — resolve os tokens do modelo para
   a cor de "não resolvido". Com o kit padrão do app, o modelo renderiza como
   desenhado (grafite/esmeralda). Fica como possível melhoria: o editor de marca
   preservar os cinco papéis padrão.

Faltam: Produto em destaque, Oferta e preço, Depoimento.

---

## Modelos desenhados à mão — preparação estrutural (2026-08-12) ✅

Os modelos gerados por script ficaram visualmente fracos; o usuário vai desenhar
os quatro do passo 1 no próprio editor. Este bloco é SÓ a preparação — nenhum
modelo foi regerado, e o modo guiado continua funcionando com os atuais.

### Feito

- [x] **Os quatro objetivos novos** do passo 1 (SPEC §18): Produto em destaque,
      Oferta e preço, Depoimento, Antes e depois — com as descrições do briefing.
- [x] **Resolução com fallback** (`resolveObjectiveTemplate`): cada objetivo
      lista ids candidatos e o primeiro carregado vence. Enquanto o desenhado não
      chega, o gerado por script mais próximo segura a ponta; quando o arquivo
      novo entrar com o id da frente, assume sozinho. `GuidedObjective` perdeu o
      campo `category` — os objetivos novos não são mais um por categoria.
- [x] **`templatizeProject`** ([templatize.ts](src/lib/model/templatize.ts)), o
      inverso da resolução de tokens, ligado ao `templateFileJson`:
      imagem → placeholder rotulado (assetId, crop e ajustes zerados); cor que
      bate com o kit ativo → `brand.<id>` (sólidas, stops de gradiente, fundo,
      highlight); fonte dos papéis do kit → `brand.display`/`brand.body`;
      **nome da camada → roteiro**, pela convenção documentada na SPEC §18.
      Roteiro copiado para os formatos derivados pelo id (sem isso a remoção da
      logo pulável deixaria pilhas diferentes entre formatos). A conversão
      trabalha numa cópia — o projeto aberto não muda.
- [x] Convenção de nomes documentada na SPEC (tabela termo → papel → pergunta),
      com as regras de segurança: só a primeira foto é principal, só a primeira
      logo tem roteiro, título pergunta antes de apoio e de botão, e imagem
      consulta nome E rótulo (imagem inserida nasce com nome "Imagem").
- [x] Ordem de perguntas por hierarquia do anúncio, não por posição: o preço num
      selo fica no topo do desenho, mas não é a primeira pergunta.
- [x] Id do arquivo e do modelo usam o MESMO `slugify` ("Oferta e preço" →
      `builtin-oferta-e-preco`, arquivo `oferta-e-preco.json`).

### Validado

- O contrato do "Antes e depois" tem teste literal: duas telas de foto, papéis
  principal/secundária, perguntas contendo ANTES e DEPOIS, nesta ordem.
- A exportação foi exercitada **no navegador**, pelo mesmo caminho do botão:
  saiu `builtin-oferta-e-preco` com placeholder, `brand.primary`,
  `brand.display` e o roteiro completo com a logo pulável.
- Três bugs de inferência pegos pelos testes antes de chegarem ao usuário:
  "Subtítulo" contém "titulo" e virava título (ordem das regras); o nome padrão
  "Imagem" vencia o rótulo "Logo" (passou a consultar os dois); e o slug com
  acento gerava id errado.
- 199 testes (15 novos), 8 visuais, typecheck e build passando.

### O que fica para o usuário (registrado para a próxima sessão)

Desenhar os quatro no editor **(só no 4:5** — o motor deriva 1:1 e 9:16; ajuste
manual nos derivados é exportado junto**)**, com o brand kit ativo no projeto e
as camadas nomeadas pela convenção. Exportar: painel Modelos → segurar Alt →
"Exportar como modelo de fábrica". O `.json` baixado vai para
`/public/templates/` com uma entrada em `index.json`.

---

## MODO GUIADO "Criativo rápido" (2026-08-11) — ✅ completo

Funcionalidade pós-v1 pedida pelo usuário. Especificada na **SPEC §18**. Plano
aprovado; implementada em três blocos, com aprovação ao fim de cada um. Os cinco
passos estão de pé e o fluxo entrega os três arquivos.

### Bloco 1 — fundação: o roteiro dos modelos ✅ concluído

- [x] `LayerBase.guide` (`role`, `question`, `hint`, `order`, `optional`), com
      schema zod espelhado. Opcional: `CURRENT_SCHEMA_VERSION` continua 1 e
      nenhum projeto antigo migra.
- [x] Os **doze modelos regerados** com roteiro: pergunta em português claro,
      dica prática e ordem. Camada sem `guide` não vira pergunta — é o que
      mantém "LANÇAMENTO", "AVISO" e as aspas do depoimento fora do fluxo sem
      lista negra.
- [x] **Espaço de logo opcional em todos os doze** (antes só dois tinham), dentro
      da área segura.
- [x] `src/config/guided.ts`: os quatro objetivos do passo 1. O institucional
      aponta para "Equipe", não para "Marca em destaque" — neste a logo é o
      modelo inteiro e não haveria foto para pedir no passo 2.
- [x] `projectFromTemplate(t, { guided })`: **fora do fluxo guiado o espaço de
      logo pulável não vem junto.** Decisão do usuário — quem usa o editor
      completo sabe inserir um logo, e não deve receber quadro tracejado extra
      mais aviso recorrente no checklist por algo que não pediu. Logo NÃO
      pulável (o "Marca em destaque") fica: removê-la esvaziaria o modelo.
- [x] A miniatura do painel de modelos usa a mesma função (`layersAsApplied`):
      o que se vê é o que se aplica.

**Verificado:** aplicar "Oferta em destaque" no editor dá 6 camadas, um único
placeholder vazio e 13 avisos — nenhum deles sobre logo, idêntico ao que era
antes da mudança. No caminho guiado a camada aparece.

**Testes:** 12 novos (159 no total). O contrato dos modelos ficou coberto: nada
de jargão em pergunta ou dica, toda pergunta terminando em "?", ordem sem empate
por passo, no máximo uma foto principal e uma logo por modelo, papel de foto só
em camada de imagem, os quatro modelos do passo 1 com roteiro completo e logo
pulável, e toda logo dentro da área segura. **O teste foi verificado sabotando um
modelo de propósito** — acusou o jargão e a logo fora da margem com a mensagem
certa, em vez de passar em silêncio.

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
- **Pular o logo tira a camada do anúncio** — na construção isso virou "esconde
  na hora, remove ao encerrar", para o "Voltar" continuar funcionando.
- O modo guiado **não usa o escopo `.ds-app`** — ele densifica a interface para
  trabalho, e aqui vale o contrário.

### Bloco 2 — a casca e os passos 1 a 4 ✅ concluído

- [x] `Project.guided` (`screen`, `templateId`), opcional — o
      estado do fluxo mora no projeto, então salvamento automático e "fechar e
      voltar depois" saem de graça. **Verificado recarregando a página no meio do
      fluxo: voltou no passo 4.**
- [x] `amendPresent` no histórico: muda o presente **sem criar passo de
      desfazer**. Navegar não é editar — sem isso, "Desfazer" no editor voltaria
      telas do fluxo em vez do trabalho. Coberto por teste.
- [x] Rota `#/rapido` e `#/rapido/:id`, com teste de parsing (inclusive id com
      caractere especial e hash desconhecido caindo na landing).
- [x] `buildScreens`: a lista de telas é **derivada do roteiro**, não escrita à
      mão. "Um campo por tela" e o modelo de duas fotos caem fora sozinhos.
- [x] `GuidedFlow` é uma **casca sobre o store do editor**, não um sistema
      paralelo: reusa `useAutosave`, `useActiveBrandKit`, `replaceImageOnLayer` e
      a propagação para os três formatos.
- [x] Passos 1 a 4 com preview ao vivo (mesma `StageScene` do editor e do
      export), contador de cinco passos com subcontador, voltar sempre
      disponível, e saída para o editor a qualquer momento.
- [x] Entradas na landing (ao lado de "Abrir o editor") e no dashboard (ao lado
      de "Novo projeto"). Em tela pequena o fluxo mostra o aviso de computador em
      vez de quebrar.
- [x] Passo 5 provisório ("Abrir no editor completo") — o bloco 3 o substitui.

**Decisões tomadas durante a construção, com o motivo:**

- **Pular esconde, não apaga.** A camada some do preview na hora (quem clicou em
  "pular" não pode continuar vendo o quadro tracejado), mas continua no projeto
  para o "Voltar" funcionar. A remoção definitiva é ao encerrar o fluxo.
  **Verificado no IndexedDB:** ao sair para o editor, `guided` sumiu, a camada de
  logo sumiu dos três formatos e o projeto ficou com zero placeholder vazio.
- **O texto de exemplo nunca vira anúncio.** O campo abre vazio e o exemplo do
  modelo vira sugestão dentro dele; texto obrigatório em branco não avança.
- **Os dois botões do passo opcional têm o mesmo peso visual** enquanto a etapa
  está sem resposta — pular não pode parecer a escolha menor. Depois de
  respondida, "Continuar" vira o principal.

**Dois bugs encontrados e corrigidos na verificação:**

1. `GuidedPreview` retornava `null` antes de o projeto carregar, então o
   `ResizeObserver` (deps `[]`) observava um ref nulo e nunca mais media — o
   preview ficava em branco dependendo da ordem de montagem.
2. Medir só por `ResizeObserver` não basta: **em página oculta o callback dele
   não é entregue**, mesma armadilha do `requestAnimationFrame` que já custou o
   export travado. A medida inicial passou a ser síncrona no layout.

**Testes:** 177 no total (+18 no bloco). Cobrem a derivação das telas, o
contador, o índice salvo fora da faixa, o texto obrigatório em branco, a logo
pulável, o histórico que não registra navegação e o parsing das rotas.

### Bloco 3 — o passo 5: conferir e baixar ✅ concluído

- [x] Os três formatos lado a lado (mesmo `FormatStage` do modo comparar), com
      nome e dica em português simples: "Feed vertical", "Feed quadrado",
      "Stories e Reels".
- [x] **`plainLanguage.ts`: o checklist da §11 traduzido**, não reinventado. A
      tradução é um `Record` por `kind` — **aviso novo no checklist quebra a
      compilação** até alguém escrever a versão leiga. Sem isso o jargão volta
      pela porta dos fundos.
- [x] Duas decisões de curadoria, porque lista longa de aviso técnico assusta
      exatamente quem este fluxo existe para atender:
      **(1)** aviso de área segura só vale para o que a pessoa colocou — véu
      decorativo que sangra até a borda foi desenhado assim de propósito;
      **(2)** o mesmo problema nos três formatos vira uma linha, não três.
- [x] Correção de um clique para a área segura ("Puxar para dentro"), aplicada
      **no formato do aviso**, marcando override — o problema costuma ser só do
      Stories, e mexer nos três para consertar um seria pior que o defeito.
- [x] Ajustes simples: trocar texto, trocar cor (paleta da marca + branco e
      preto) e subir/descer. Mover é só vertical — a adaptação entre formatos é
      um problema puramente vertical (§2), e soltar o horizontal estraga um
      layout pronto.
- [x] "Baixar os três" reusa o caminho de export do editor (ExportStage →
      toCanvas → ZIP), o mesmo coberto pela regressão visual. Sem opções: JPG na
      qualidade padrão, os três num arquivo.
- [x] Abrir o projeto no editor **encerra** um fluxo que ficou aberto — quem
      baixou e fechou a aba não deve reencontrar a camada de logo pulada,
      escondida, no painel de camadas.
- [x] `GuidedState.completedAt` foi removido: declarado e nunca lido. Campo que
      ninguém consome é peso morto (§1).

**Verificado no navegador, ponta a ponta:**

- A frase do Stories saiu exatamente como pedida: *"No Stories, o topo e a base
  ficam escondidos pelos botões do Instagram — o título está nessa faixa e pode
  não aparecer inteiro. Puxe um pouco para o centro."*
- "Puxar para dentro" levou a borda inferior de 1620 para **exatamente 1580** (o
  limite), deixou o 4:5 intacto em y=700 e o aviso sumiu.
- Subir/descer marcou `overriddenIn: ["9:16"]` e não mexeu na base.
- Foto pequena de propósito (300×300) gerou o aviso de "vai sair borrada" já no
  passo 2, e de novo no passo 5 agrupado nos três formatos.
- "Baixar os três" produziu um ZIP real de 148 KB (`application/zip`).
- Reabrir no editor: `guided` apagado e camada de logo fora do projeto.

**Testes:** 184 no total (+7 no bloco), cobrindo a tradução de todos os sete
tipos de aviso, a ausência de jargão, o agrupamento por formato, o filtro do
enfeite decorativo e a nomeação por papel.

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
