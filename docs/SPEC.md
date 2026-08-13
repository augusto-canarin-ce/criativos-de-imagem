# SPEC — Editor de Criativos para Anúncios

> **Como usar:** salve este arquivo como `docs/SPEC.md` na raiz do projeto vazio e abra o Claude Code ali. Primeira mensagem: *"Leia `docs/SPEC.md`. Implemente a FASE 0 e a FASE 1. Não avance de fase sem eu aprovar."* Em qualquer sessão futura, referencie com `@docs/SPEC.md`.

---

## 1. A TESE

O Canva faz tudo e por isso é lento para fazer uma coisa. Este editor faz **uma coisa**: criativo estático de anúncio, nos formatos que a Meta pede.

Isso não é uma limitação a ser contornada — é o produto. Toda decisão de escopo se resolve com a mesma pergunta: *isso ajuda a sair de "tenho uma ideia" para "tenho três arquivos prontos para subir" mais rápido?* Se a resposta for "às vezes, para alguns usuários", fica de fora.

Consequência prática para quem for implementar: **nunca adicione uma opção "por completude".** Se uma propriedade tem 12 valores possíveis mas só 3 aparecem em anúncio, exponha os 3. Menos escolhas é a funcionalidade.

---

## 2. A SIMPLIFICAÇÃO QUE OS TRÊS FORMATOS PERMITEM

Os três formatos têm exatamente **1080px de largura**. Só a altura muda: 1080 → 1350 → 1920.

Com o tamanho custom fora do escopo, isso deixa de ser uma curiosidade e vira a fundação do sistema: **a adaptação entre formatos é um problema puramente vertical.** Não existe reescala horizontal, não existe recálculo de tamanho de fonte, não existe reflow de largura de caixa de texto.

Não construa um sistema genérico de layout responsivo. Construa um sistema de âncoras verticais: é uma fração do código, é testável de verdade, e produz o resultado que um designer faria à mão — o texto sai exatamente do mesmo tamanho nos três formatos, mudando só onde ele se apoia.

Se um dia entrar tamanho custom, o caminho é adicionar uma escala horizontal por cima deste motor, não reescrevê-lo. Mas não escreva esse código agora.

## 3. ESCOPO

### Entra

Camadas de imagem, texto, forma e gradiente. **Placeholders de imagem.** Três formatos fixos da Meta. Adaptação automática entre formatos com override manual. Brand kit. Modelos. Exportação PNG/JPG individual ou em ZIP. Projetos salvos localmente com backup em arquivo. Undo/redo, guias, atalhos.

### Não entra (nem por iniciativa própria, nem "só um botãozinho")

Vídeo, animação, GIF. Colaboração em tempo real. Qualquer forma de IA. CMYK, sangria, marcas de corte, qualquer coisa de impressão. Carrossel multi-slide. Login, contas, nuvem, backend. Comentários, aprovação, versionamento colaborativo. Fundo transparente na exportação. Texto em curva. **Tamanho custom de criativo.** **Banco de imagens integrado** (Unsplash, Pexels e afins) — o usuário sobe as próprias fotos, e é isso que mantém o app sem nenhuma chave de API, sem rate limit e sem termos de terceiros a cumprir.

Remoção de fundo fica **fora do v1** por decisão do briefing, mas o modelo de dados já prevê o campo (`ImageLayer.bgRemoved`) para não exigir migração depois.

---

### Publicação, licença e privacidade

Repositório: **`criativos-de-imagem`**, no GitHub, sob licença **MIT** — arquivo `LICENSE` na raiz desde o primeiro commit, e o campo `license` no `package.json`.

Hospedagem ainda não decidida. Isso não bloqueia nada: um SPA estático sobe igual em GitHub Pages, Netlify, Vercel ou Cloudflare Pages. **Não acople o build a nenhuma delas** — nada de adaptador, nada de arquivo de configuração específico de plataforma, nada de caminho absoluto assumindo domínio. Configure `base` no Vite por variável para que o app funcione tanto em raiz quanto em subdiretório (que é o caso do GitHub Pages).

**Zero telemetria.** Nenhum analytics, nenhum pixel, nenhuma requisição de rede que não seja carregar fontes. Declare isso no README em uma linha, de forma verificável: *"Este app não faz nenhuma requisição a servidores além do carregamento de fontes. Seus projetos e imagens nunca saem do seu navegador."* Num editor onde as pessoas sobem material de clientes, essa frase vale mais que qualquer funcionalidade.

**Funcionamento offline.** Depois do primeiro acesso, tudo o que é essencial funciona sem internet: editar, salvar, exportar e as fontes da curadoria. Só a busca no catálogo do Google Fonts exige conexão, e quando ela falha o app diz isso claramente em vez de ficar carregando. Empacote a curadoria via fontsource no bundle; não a carregue por rede.

**PWA instalável fica para depois do v1.** O trabalho de service worker e manifest é pequeno, mas invalidação de cache mal feita gera bug de versão antiga que é péssimo de diagnosticar. Deixe para quando o app estiver estável.

## 4. STACK (decidido — implemente, não questione)

| Camada | Escolha | Por quê |
|---|---|---|
| Build | **Vite + React 19 + TypeScript `strict`** | SPA puro, sem servidor. Deploy estático em GitHub Pages, Netlify ou Vercel, tudo no plano gratuito |
| Canvas | **Konva + react-konva** | Saída em pixel determinística, transformer pronto, suporta gradiente em texto e blend modes nativamente |
| Estado | **Zustand + Immer** | Simples, e os patches do Immer dão undo/redo quase de graça |
| Persistência | **Dexie (IndexedDB)** | Projetos em JSON, imagens como Blob |
| UI | **Tailwind + shadcn/ui + lucide-react** | Velocidade de construção |
| Fontes | **fontsource** para a curadoria + Google Fonts API para a busca | Curadoria fica offline no bundle; busca é opcional |
| ZIP | `jszip` + `file-saver` | — |
| Cor | `colord` | Conversão, contraste, manipulação |
| Paleta | `node-vibrant` ou quantização própria | Extrair cores de imagem |
| Validação | `zod` | Todo dado que cruza fronteira |
| Testes | `vitest` | Obrigatório em `lib/layout` e `lib/render` |

**Sem Next.js.** Não há rota de API, não há SSR, não há nada para renderizar no servidor. Um SPA estático é mais simples, mais barato e mais fácil de outra pessoa hospedar — o que importa, já que o app é aberto.

**Sem `localStorage` para dados de projeto.** Só para preferências pequenas (tema, último formato usado, estado dos painéis). Projetos vivem no IndexedDB.

---

## 5. ESTRUTURA DE PASTAS

```
/src
  /components
    /canvas          Stage, renderizadores por tipo de camada, transformer, guias, snapping
    /panels          LayersPanel, Inspector, AssetsPanel, TemplatesPanel, BrandPanel
    /inspector       um arquivo por tipo de camada: TextInspector, ImageInspector…
    /toolbar
    /dialogs         Export, Configurações, Atalhos, Novo projeto
    /ui              shadcn
  /lib
    /model           types.ts, schema.ts (zod), migrations.ts
    /layout          adapt.ts, anchors.ts, safeArea.ts, autoFit.ts, snapping.ts
    /render          renderStage.ts  ← motor único, preview e export
    /export          encode.ts, naming.ts, zip.ts
    /db              dexie.ts, projects.ts, assets.ts, brand.ts, templates.ts
    /assets          upload.ts, paste.ts, svg.ts, palette.ts, placeholder.ts
    /fonts           curated.ts, loader.ts, googleFonts.ts, userFonts.ts
    /history         patches.ts
    /store           slices do zustand
  /config
    formats.ts       os três, e só os três
    safeAreas.ts
    shortcuts.ts
  /styles
/public
  /templates         JSON dos templates que vêm de fábrica
/docs
  SPEC.md            este arquivo
  PROGRESS.md        atualizado ao fim de cada fase
```

---

## 6. MODELO DE DADOS

Em `lib/model/types.ts`, com schemas zod espelhados. **Versione desde o primeiro commit** (`schemaVersion`) e escreva as migrações em `migrations.ts` — o app salva na máquina do usuário, então quebrar o formato é perder o trabalho dele.

```ts
// ---------- formatos ----------

export type FormatId = '4:5' | '1:1' | '9:16';

export interface FormatDef {
  id: FormatId;
  label: string;                               // "Feed Vertical", "Stories/Reels"
  width: 1080;                                 // invariante do sistema — os três compartilham
  height: number;                              // 1350 | 1080 | 1920
  safeArea: SafeArea;
}

export interface SafeArea { top: number; right: number; bottom: number; left: number }

// ---------- projeto ----------

export interface Project {
  id: string;
  name: string;
  schemaVersion: number;
  brandKitId?: string;
  baseFormat: FormatId;                        // onde o usuário desenha primeiro
  layouts: Record<FormatId, Layout>;
  assets: string[];                            // ids na tabela de assets
  createdAt: number;
  updatedAt: number;
}

export interface Layout {
  formatId: FormatId;
  background: Fill;                            // cor sólida ou gradiente; nunca transparente
  layers: Layer[];                             // índice 0 = fundo da pilha
  detached: boolean;                           // true = parou de seguir o formato base
}

// ---------- camadas ----------

export type Layer = ImageLayer | TextLayer | ShapeLayer | GroupLayer;

export type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten'
  | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light'
  | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

export interface LayerBase {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  opacity: number;                             // 0–1
  rotation: number;                            // graus
  blendMode: BlendMode;
  frame: Frame;                                // px, no espaço do formato
  anchor: Anchor;                              // como se comporta ao mudar de formato
  overriddenIn: FormatId[];                    // onde o usuário editou na mão
  effects: Effects;
}

export interface Frame { x: number; y: number; w: number; h: number }

export interface Anchor {
  v: 'top' | 'center' | 'bottom' | 'stretch';  // não há âncora horizontal: a largura nunca muda
}

export interface Effects {
  shadow?: { x: number; y: number; blur: number; color: string; opacity: number };
  stroke?: { width: number; color: string; position: 'inside' | 'center' | 'outside' };
  blur?: number;
}

// ---------- preenchimento ----------

export type Fill =
  | { kind: 'solid'; color: string }                                   // hex ou token 'brand.primary'
  | { kind: 'linear'; stops: Stop[]; angle: number }                   // graus
  | { kind: 'radial'; stops: Stop[]; cx: number; cy: number; r: number };  // 0–1 relativo à caixa

export interface Stop { offset: number; color: string }                // offset 0–1

// ---------- tipos concretos ----------

export interface TextLayer extends LayerBase {
  type: 'text';
  content: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number;                          // múltiplo, ex.: 1.15
  letterSpacing: number;                       // px
  align: 'left' | 'center' | 'right';
  vAlign: 'top' | 'middle' | 'bottom';
  transform: 'none' | 'uppercase';
  underline: boolean;
  bullet: boolean;                             // lista simples, um nível
  fill: Fill;                                  // gradiente em texto é suportado
  highlight?: { fill: Fill; padH: number; padV: number; radius: number };
  autoFit: { enabled: boolean; min: number; max: number };
}

export interface ImageLayer extends LayerBase {
  type: 'image';
  assetId: string | null;                       // null = placeholder vazio, ainda não preenchido
  placeholder: { label: string; note?: string };// rótulo mostrado no quadro vazio
  fit: 'cover' | 'contain';
  focalPoint: { x: number; y: number };         // 0–1, guia o reenquadre entre formatos
  crop?: Frame;                                 // px na imagem original
  adjust: { brightness: number; contrast: number; saturation: number; blur: number };
  mask?: { shape: 'rect' | 'ellipse'; radius?: number };
  bgRemoved?: boolean;                          // reservado, fora do v1
}

export interface ShapeLayer extends LayerBase {
  type: 'shape';
  shape: 'rect' | 'ellipse' | 'line' | 'arrow';
  fill: Fill;
  radius?: number;                              // só rect
  arrowHead?: 'end' | 'both';                   // só arrow
}

export interface GroupLayer extends LayerBase {
  type: 'group';
  children: Layer[];
}

// ---------- marca e biblioteca ----------

export interface BrandKit {
  id: string;
  name: string;
  colors: { id: string; name: string; hex: string }[];
  fonts: { role: 'display' | 'body'; family: string; weights: number[]; userFontId?: string }[];
  logos: { id: string; assetId: string; label: string }[];
  textStyles: Record<string, Partial<TextLayer>>;   // "Título", "Subtítulo", "CTA"
}

export interface Asset {
  id: string;
  kind: 'raster' | 'svg' | 'font';
  blob: Blob;
  mime: string;
  width?: number;
  height?: number;
  name: string;
}
```

**Tokens de marca.** Qualquer campo de cor aceita tanto `#RRGGBB` quanto `brand.<id>`. A resolução acontece no render, nunca no modelo. É isso que permite trocar o brand kit e ver o criativo inteiro atualizar.

---

## 7. FORMATOS E ADAPTAÇÃO

### Formatos de fábrica

```ts
export const BUILTIN_FORMATS: FormatDef[] = [
  { id:'4:5',  label:'Feed Vertical',  width:1080, height:1350, builtin:true,
    safeArea:{ top:80,  right:60,  bottom:80,  left:60 } },
  { id:'1:1',  label:'Feed Quadrado',  width:1080, height:1080, builtin:true,
    safeArea:{ top:60,  right:60,  bottom:60,  left:60 } },
  { id:'9:16', label:'Stories/Reels',  width:1080, height:1920, builtin:true,
    safeArea:{ top:250, right:60,  bottom:340, left:60 } },
];
```

As safe zones são **editáveis nas configurações**. A Meta muda a interface dos apps com frequência; tratar esses números como verdade eterna envelhece mal. Existe um segundo perfil aplicável ao 9:16 para quem anuncia sobretudo em Reels, onde a interface cobre bem mais da base e a lateral direita.

São só esses três. Sem tela de "novo tamanho", sem campo de largura e altura, sem `id` dinâmico. `FormatId` é uma união literal de três strings, e o TypeScript passa a garantir que nenhum caminho do código precise lidar com um formato que não existe.

### O algoritmo

`adaptLayout(origem: Layout, de: FormatDef, para: FormatDef): Layout`

```
1. Se para.detached === true → não faz nada, retorna o layout de destino intacto.

2. Fundo:
   - Fill sólido ou gradiente → copiado direto (gradiente radial recalcula r pelo novo diagonal).
   - Camada de imagem de fundo → reenquadre 'cover' preservando o focalPoint:
     escala = max(destino.w / img.w, destino.h / img.h)
     posiciona de modo que o focalPoint caia no mesmo ponto relativo do quadro.
     NUNCA distorcer. Se sobrar área, é problema de enquadramento, não de esticar.

3. Redistribuição vertical:
   Δ = para.height − de.height
   Para cada camada não sobrescrita, conforme anchor.v:
     'top'     → y inalterado
     'bottom'  → y += Δ
     'center'  → y += Δ / 2
     'stretch' → h += Δ   (usado por gradiente de legibilidade, faixas, overlays)
   x, w, fontSize, tracking, raio de canto, sombra e blur ficam INTACTOS.
   É exatamente por não mexer neles que o resultado sai limpo.

4. Placeholders vazios recebem o mesmo tratamento das camadas de imagem
   preenchidas — o quadro se move, o rótulo continua centralizado nele.

5. Auto-fit de texto:
   Para cada TextLayer com autoFit.enabled, reduz fontSize dentro de [min, max]
   até o texto caber na caixa. Nunca aumenta além do valor original.

6. Correção de safe zone:
   Camadas de texto, forma e logo que invadirem a safe area são empurradas
   para dentro pelo caminho mais curto. Camadas de imagem de fundo são ignoradas
   nesta etapa (elas devem mesmo sangrar até a borda).
   Cada correção registra um aviso não bloqueante no painel de validação.
```

### Override manual

Editar uma camada em um formato derivado marca `overriddenIn.push(formatId)` e a camada para de receber adaptações naquele formato. Na interface: um marcador discreto na camada e um botão **"Voltar a seguir o 4:5"**. No cabeçalho do formato, quando houver qualquer override: **"3 camadas editadas neste formato"** com opção de reconectar todas.

`detached: true` no Layout inteiro é o botão de escape: aquele formato vira independente e nunca mais é tocado pela adaptação.

---

### Trocar o formato base

O usuário desenha no 4:5, e em algum momento decide que o 9:16 deve virar a referência. O app permite, **sempre avisando antes o que vai acontecer**.

Ao acionar "Usar este formato como base", abre uma confirmação que lista, em texto, exatamente o efeito:

> *Passar a base para Stories/Reels. O 9:16 vira a referência e o 4:5 e o 1:1 passam a se adaptar a ele. Duas camadas com edição manual no 4:5 vão perder o ajuste. O 1:1, que você desconectou, não será afetado.*

Regras:

1. O layout do novo formato base é preservado **integralmente**. Ele passa a ser a fonte da verdade.
2. Formatos com `detached: true` **não são tocados**, nem agora nem depois. Desconectar é uma decisão do usuário e a troca de base não a desfaz.
3. Formatos conectados são reprojetados a partir da nova base pelo mesmo `adaptLayout`. Os `overriddenIn` desses formatos são limpos — e é por isso que a confirmação precisa dizer quantas camadas serão afetadas, com número exato.
4. A operação inteira é **um único passo de undo**. Se o resultado não agradar, `Cmd+Z` devolve o estado anterior completo.

## 8. FERRAMENTAS DO EDITOR

### Canvas

Zoom por scroll com `Ctrl`/`Cmd`, e nos botões. Pan com barra de espaço arrastando, ou scroll de dois dedos. `Shift+1` ajusta à tela, `Shift+0` volta a 100%.

Seleção simples, com `Shift` para múltipla, e laço retangular arrastando no vazio. Transformer com alças de redimensionamento e rotação; `Shift` trava a proporção; `Alt` redimensiona a partir do centro.

**Snapping** é o que separa amador de profissional, então trate como funcionalidade central e não como polimento: encaixe no centro do canvas nos dois eixos, nas bordas da safe area, nas bordas e centros das outras camadas, e em espaçamento igual entre três ou mais objetos. Tolerância de 6px na escala de tela (não na escala do documento). Guias vermelhas finas aparecem só durante o arraste. Segurar `Alt` desativa temporariamente.

Réguas nas duas bordas e guias arrastáveis a partir delas.

### Camadas

Painel em árvore, com arrastar para reordenar, entrar em grupos, renomear com duplo clique, olho de visibilidade e cadeado. Miniatura de 24px por camada ajuda muito e é barato de gerar.

Atalhos de organização: duplicar, agrupar, desagrupar, mover uma posição para cima ou para baixo na pilha, mandar para frente ou para trás de tudo.

Alinhar e distribuir na barra superior: seis botões de alinhamento mais dois de distribuição. Quando há uma seleção só, alinha em relação ao canvas; com múltipla, em relação à seleção.

### Texto

Tudo o que foi pedido no briefing: entrelinha, tracking, caixa alta, alinhamento horizontal e vertical, marca-texto com preenchimento próprio e raio de canto, sublinhado, lista com bullet de um nível.

Sobre **gradiente em texto**: o Konva suporta via `fillLinearGradientColorStops` e `fillRadialGradientColorStops`. Duas armadilhas — o gradiente é calculado no espaço da caixa do nó, então precisa ser recalculado quando a caixa muda de tamanho; e gradiente combinado com contorno exige desenhar o contorno primeiro. Cubra isso com teste.

**Auto-fit** é por camada, desligado por padrão. Ao ligar, o usuário define o piso e o teto de tamanho. A busca é binária sobre `fontSize` medindo com `measureText` até caber na caixa.

Estilos de texto do brand kit ("Título", "Subtítulo", "CTA") aplicáveis em um clique, com indicação visual quando a camada foi modificada em relação ao estilo.

### Edição de texto no canvas

Duplo clique na camada e o cursor aparece no lugar, como no Canva e no Figma. O Konva não tem editor de texto, então isso é implementado sobrepondo um `<textarea>` HTML posicionado exatamente sobre o nó. É a parte mais trabalhosa do projeto — reserve tempo e escreva teste.

**O que precisa bater exatamente**, ou o texto "pula" ao entrar e sair da edição: família, peso e tamanho da fonte multiplicado pela escala do stage; entrelinha; tracking; cor; alinhamento; caixa alta; e a largura da caixa. Qualquer divergência aqui aparece como um salto visual que passa a impressão de app quebrado.

**Posicionamento.** Use `node.getAbsolutePosition()` convertido para coordenadas do contêiner, aplicando a escala do stage. Rotação vai por `transform: rotate()` no CSS com `transform-origin: top left`. O nó do Konva fica `visible(false)` durante a edição, para não renderizar duas vezes.

**Armadilhas reais:**

- A quebra de linha do `<textarea>` e a do Konva `Text` não são idênticas. Fixe a largura nos dois e teste com palavra longa sem espaço, com emoji e com texto em caixa alta.
- **Acentuação.** O português usa teclas mortas e o navegador dispara eventos de composição. Não intercepte `keydown` enquanto `isComposing` for verdadeiro, ou o usuário digita "ã" e sai errado. Teste com `ã`, `ç`, `ô` e `à` antes de considerar pronto.
- O auto-fit fica **desligado durante a edição** e é reaplicado ao confirmar. Reajustar o tamanho da fonte a cada tecla é desorientador.
- A sessão de edição inteira é **um passo de undo**, não um por tecla.

**Encerramento.** Clicar fora confirma. `Esc` cancela e restaura o texto anterior. `Enter` insere quebra de linha; `Cmd/Ctrl+Enter` e `Tab` confirmam. Ao confirmar, remeça a caixa e atualize `frame.h` se o texto cresceu.

### Imagens

Entrada por upload, `Ctrl+V` e arrastar arquivo para a tela. Toda imagem vira um `Asset` no IndexedDB; a camada guarda só o `assetId`. Se a mesma imagem for usada em três formatos, é um asset só.

Crop com proporção livre ou travada, incluindo atalhos para as três proporções da Meta. O crop é não destrutivo: guarda o retângulo, mantém o original.

Ajustes de brilho, contraste, saturação e blur via filtros do Konva. Aplicar filtro exige `cache()` no nó — sem isso o filtro não aparece. Invalide o cache ao mudar qualquer parâmetro, e faça debounce de uns 120ms nos sliders para não travar.

**Focal point**: um alvo arrastável sobre a miniatura no inspector. É o que faz a mesma foto ficar bem enquadrada no 4:5 e no 9:16. Explique isso na interface em uma linha — é a funcionalidade menos óbvia e mais valiosa do app.

Máscara por forma: retângulo com raio ou elipse, via `clipFunc` do grupo.

### Placeholders de imagem

Um placeholder **não é um tipo novo de camada** — é uma `ImageLayer` com `assetId: null`. Isso é deliberado: o quadro, o crop, a máscara, o focal point, os ajustes e o comportamento de adaptação entre formatos já existem e funcionam igual, preenchido ou vazio. Um tipo separado duplicaria tudo isso, e as duas cópias divergiriam na primeira semana.

**Estado vazio.** Retângulo com contorno tracejado, preenchimento cinza sutil, ícone de imagem ao centro e o `placeholder.label` logo abaixo. O rótulo é escrito por quem monta o criativo: "Foto do produto", "Print do depoimento", "Logo do cliente". É isso que faz um modelo se explicar sozinho — quem abre entende o que vai onde sem precisar de instrução.

**Preencher.** Arrastar um arquivo sobre o quadro, ou selecionar e usar "Escolher imagem". A imagem entra em `cover`, centralizada, com `focalPoint` em (0.5, 0.5), preservando o quadro exatamente como estava. O ajuste de enquadramento vem depois, pelo focal point, sem redesenhar nada.

**Esvaziar.** Qualquer camada de imagem preenchida volta a ser placeholder por "Remover imagem", que zera o `assetId` e mantém quadro, máscara, efeitos e rótulo. É a operação que transforma um criativo pronto em modelo reutilizável — deixe a um clique de distância.

**Substituir.** Numa camada já preenchida, troca só o asset e mantém quadro, máscara, crop relativo e efeitos. É a operação mais usada do app inteiro quando se produz variação; deixe no menu de contexto e como botão de destaque no inspector.

**Onde fica a ferramenta.** Criar placeholder é uma ação do menu "Inserir", sem tecla dedicada — não é operação de alta frequência o bastante para ocupar uma letra do teclado. Preencher, esvaziar e substituir são ações do inspector e do menu de contexto da camada.

**Preenchimento em lote.** Arrastando várias imagens de uma vez sobre a tela, preencha os placeholders vazios na ordem de leitura, de cima para baixo. Sobrando imagens, entram como camadas novas soltas.

**Relação com os modelos.** Um modelo de fábrica é, por definição, um projeto onde toda imagem é placeholder rotulado. Ao aplicar, o app já abre com o primeiro placeholder vazio selecionado. Esse é o fluxo que faz o produto valer o clique: escolher modelo → arrastar duas fotos → trocar dois textos → exportar os três formatos.

**Validação.** Placeholder vazio na hora de exportar é aviso, não bloqueio — mas é o aviso mais destacado da lista, porque publicar um anúncio com quadro tracejado no meio é um erro que só se descobre depois de no ar.

SVG importado é rasterizado no tamanho de uso com margem de 2× para não borrar em logo grande, mas o original fica guardado para re-rasterizar se o usuário aumentar.

### Cores

Seletor com HSV, campo hex, opacidade, e as cores do brand kit em destaque no topo. Conta-gotas via `EyeDropper` API onde disponível (Chrome, Edge); onde não houver, o botão fica escondido em vez de dar erro.

Extração de paleta: ao importar uma imagem, oferecer as 5 cores dominantes como sugestão, com um clique para adicionar ao brand kit.

Editor de gradiente com paradas arrastáveis numa barra, controle de ângulo para linear e alças de centro e raio na tela para radial.

### Formas

Retângulo com raio de canto ajustável (um valor para todos os cantos; quatro valores independentes é complexidade sem retorno em anúncio), elipse, linha e seta. Todas aceitam preenchimento sólido ou gradiente, contorno e os efeitos padrão.

### Blend modes

Conjunto completo, mas **organizado em grupos** no seletor (Escurecer, Clarear, Contraste, Comparar, Cor), não uma lista corrida de 16 itens. E `normal` sempre no topo, fora dos grupos.

Aviso importante para a implementação: `globalCompositeOperation` no Konva funciona em relação ao que já foi desenhado abaixo no mesmo `Layer` do Konva. Se você colocar cada camada do projeto em um `Layer` separado do Konva, os blend modes não funcionam. Use **um único `Layer` do Konva** com `Group`s dentro. Isso também é melhor para performance.

---

## 9. FONTES

Curadoria de cerca de 30 famílias empacotadas via fontsource, escolhidas para anúncio: alto contraste em peso, boa legibilidade em tamanho grande, e pelo menos um peso pesado em cada. Divida em "Títulos" e "Corpo" no seletor.

Busca no catálogo do Google Fonts como camada secundária, carregada sob demanda. Se a busca falhar por qualquer motivo, a curadoria continua funcionando.

Upload de fonte própria em `.ttf`, `.otf` ou `.woff2`, guardada como `Asset` do tipo `font` e registrada via `FontFace` na inicialização do projeto.

**Regra inviolável do export:** antes de qualquer renderização final, `await document.fonts.ready` e confirmação de que todas as famílias usadas no projeto estão carregadas. Exportar com fonte substituída é o pior bug possível neste app, porque passa despercebido até o anúncio estar no ar.

---

## 10. TEMPLATES E BRAND KIT

Templates são projetos serializados em `/public/templates/*.json`, com uma miniatura ao lado. Você desenha de 8 a 12 no próprio editor e usa uma ação escondida ("Exportar como template de fábrica") para gerar o arquivo. Sem categorias: com uma dúzia de modelos, o painel é uma lista única — agrupar atrapalhava mais do que ajudava (decisão de 2026-08-13; o campo `category` foi removido do schema).

Ao aplicar um template, os tokens de marca são resolvidos contra o brand kit ativo, de modo que o template já nasce com as cores e fontes do usuário. O modelo é aplicado **como está no arquivo**, espaço de logo incluído, em qualquer caminho (decisão de 2026-08-13, revertendo a remoção fora do guiado): é mais fácil apagar uma camada do que descobrir que ela existia. O Alt no painel segue existindo com uma função só — revelar o "Exportar como modelo de fábrica".

**Brand kit padrão de fábrica** (decisão de 2026-08-13): o app abre com o kit "Conversao Extrema" ativo — id fixo `brand-conversao-extrema`, definido em código (`lib/brand/defaultKit.ts`), semeado na abertura quando ausente. Sem ele, todo token `brand.*` cairia no cinza de fallback e os modelos nasceriam cinzentos. Projeto novo nasce com esse kit; projetos antigos sem marca foram estampados uma única vez (flag em `settings` — "sem marca" escolhido depois é respeitado). Kit editado nunca é sobrescrito pela semente; kit apagado renasce na abertura seguinte, como todo padrão de fábrica. Fonte dos papéis: Geist Sans, curadoria do bundle — zero requisição externa.

O usuário salva os próprios templates, que vão para o IndexedDB e aparecem numa aba "Meus" ao lado de "De fábrica".

Brand kit: cores nomeadas, fontes por papel, logos e estilos de texto. Múltiplos brand kits, um ativo por projeto. Exportável e importável como arquivo, junto com os logos embutidos — é o que permite atender vários clientes.

---

## 11. EXPORTAÇÃO

### Motor único

O `Stage` do Konva é montado no tamanho real do formato (1080px de largura de verdade) e exibido com escala aplicada por transformação. O export chama `stage.toCanvas({ pixelRatio: 1 })` **sobre esse mesmo stage**.

Nunca escreva um segundo caminho de renderização para o export. É a causa número um de "ficou diferente do preview" e o bug mais caro de diagnosticar depois.

Sequência obrigatória antes de gerar o arquivo: fontes prontas, todas as imagens com `onload` resolvido, todos os nós com filtro re-cacheados, e um `stage.draw()` síncrono.

### Saída

PNG e JPG. Sem fundo transparente — o `background` do Layout é sempre opaco, o que também simplifica o JPG.

Qualidade automática: JPG a 0.92, com fallback progressivo para 0.85 e 0.80 caso o arquivo passe de 30MB (limite da Meta). Um slider manual fica escondido atrás de "Avançado".

Nomenclatura padrão, configurável:

```
{projeto}_{formato}_v{n}.jpg
→ blackfriday-frete_1080x1350_v1.jpg
```

Botão **"Exportar os 3"** gera um ZIP:

```
blackfriday-frete_2026-08-06.zip
  blackfriday-frete_1080x1350_v1.jpg
  blackfriday-frete_1080x1080_v1.jpg
  blackfriday-frete_1080x1920_v1.jpg
```

### Checklist pré-export

Um painel discreto no rodapé, sempre visível, com contagem de avisos. Nunca bloqueia a exportação — informa.

- **Placeholder de imagem ainda vazio** — primeiro da lista, em destaque
- Texto ou logo fora da safe zone, por formato
- Contraste do texto abaixo de 4.5:1, calculado contra a luminância média dos pixels sob a caixa (não contra uma cor chapada, que dá falso positivo em cima de foto)
- Menor tamanho de fonte renderizado abaixo de 28px em 1080 de largura
- Imagem sendo exibida acima de 100% do tamanho original (vai sair borrada)
- Fonte não carregada
- Área ocupada por texto acima de 20% do criativo — só informativo, com a nota de que a Meta não bloqueia mais isso mas excesso de texto costuma reduzir entrega

---

## 12. PERSISTÊNCIA E ARQUIVO DE PROJETO

IndexedDB via Dexie, com salvamento automático debounced em 800ms. Tabelas: `projects`, `assets`, `brandKits`, `templates`, `settings`.

**Aviso honesto na primeira execução**, e não escondido nas configurações: os projetos ficam neste navegador, limpar os dados do site apaga tudo, e existe o botão de backup. Uma linha, sem alarmismo, com link para a exportação.

Arquivo de projeto `.criativo` (um ZIP com `project.json` mais os assets binários). Exportar e importar leva o projeto entre máquinas e navegadores, ou para outra pessoa. Também é o formato dos templates de fábrica.

Aba de "Projetos" no dashboard: grade de miniaturas, busca por nome, duplicar, renomear, apagar com confirmação, e um botão de **"Exportar todos"** para backup completo.

---

### Política de assets e cota do navegador

Sem isso, o app enche o armazenamento do navegador em poucas semanas de uso e trava sem explicar por quê.

**Na importação**, toda imagem raster passa por um pipeline fixo:

1. Redimensiona para no máximo **2560px** no maior lado, com filtro de alta qualidade. O criativo mais alto tem 1920px; 2560 dá margem confortável para crop e zoom sem guardar peso morto. O original **não** é preservado.
2. Recodifica: JPEG a 0.9 se a imagem for opaca, PNG se tiver canal alfa.
3. Calcula o hash SHA-256 do resultado. Se já existir um asset com o mesmo hash, **reaproveita**, incrementa o contador de referências e não grava nada. A mesma foto usada em cinco projetos ocupa espaço uma vez.
4. Gera e guarda junto uma miniatura de 320px, usada no painel de camadas e na grade de assets. Nunca renderize miniatura a partir do arquivo cheio.

SVG não passa por redimensionamento — é guardado como texto, sanitizado (remova `<script>`, `on*` e `<foreignObject>`: SVG de terceiros é vetor de ataque).

**Coleta de lixo.** Asset com contador de referências zerado é apagado quando o projeto que o usava é excluído. Rode uma varredura de consistência na inicialização, porque contador de referências sempre desincroniza em algum crash.

**Cota.** Consulte `navigator.storage.estimate()` na inicialização e depois de cada importação. Ao passar de 80% de uso, mostre um aviso não bloqueante. Ao falhar uma escrita por cota, abra um diálogo que **lista os projetos ordenados por tamanho ocupado**, com o peso de cada um e um botão para exportar antes de apagar. Nunca perca o trabalho do usuário sem oferecer a saída.

Peça `navigator.storage.persist()` na primeira execução — não garante nada, mas reduz a chance de o navegador limpar os dados sozinho sob pressão de espaço.

**Arquivo de projeto.** As imagens vão como estão guardadas, sem recompressão adicional. Elas já passaram pelo pipeline na importação; comprimir de novo degradaria sem ganho relevante. Mostre o tamanho estimado antes de gerar o arquivo.

## 13. INTERFACE

```
┌─────────────────────────────────────────────────────────────────┐
│ Projetos   Nome do projeto ▾    ↶ ↷      [Exportar os 3]  ⚙     │
├────────┬────────────────────────────────────┬───────────────────┤
│Camadas │  [4:5]  [1:1]  [9:16]    ⊞ Comparar│    Inspector      │
│        │                                     │                   │
│ ────── │                                     │  (muda conforme   │
│Imagens │             CANVAS                  │   a seleção)      │
│        │                                     │                   │
│ ────── │                                     │                   │
│Templates│                                    │                   │
│        │                                     │                   │
│ ────── │                                     │                   │
│ Marca  │                                     │                   │
├────────┴────────────────────────────────────┴───────────────────┤
│ ⚠ 2 avisos          Zoom 62%          1080×1350                 │
└─────────────────────────────────────────────────────────────────┘
```

Tema escuro por padrão, cinza neutro e dessaturado. Isso não é estética: qualquer matiz na interface contamina a percepção das cores do criativo. Ofereça tema claro nas configurações mas mantenha o escuro como padrão.

**Modo comparar** mostra os três formatos lado a lado, ao vivo e editáveis, com a edição no formato base propagando na hora. É a funcionalidade que mais diferencia este editor de um editor genérico — priorize e capriche.

Interface em português do Brasil. Termos consistentes: "camada", "formato", "criativo", "marca", "modelo" (não "template" no texto visível). Verbos no infinitivo nos botões, e o mesmo verbo do começo ao fim de um fluxo: se o botão diz "Exportar", a confirmação diz "Exportado".

No celular, o editor abre em modo leitura: o usuário navega pelos projetos, vê os três formatos e exporta. Tentar editar em tela pequena com este conjunto de ferramentas produziria uma experiência ruim; melhor não oferecer.

### Landing page (decisão de 2026-08-07 — construir na Fase 7)

Página inicial pública ANTES do dashboard, explicando o produto para quem chega sem
contexto. Estrutura: header com logo e botão; headline e subheadline; seção de
funcionalidades; seção "como funciona"; botão principal levando ao dashboard.

Requisitos: mesmo design system (tokens, Geist Sans, escala neutra, acento
esmeralda), tema escuro, rota separada, caminho claro de volta a partir do editor,
e **zero requisição externa** — a §3 vale aqui também.

**Posicionamento:** o texto reflete a tese da §1 — o app faz UMA coisa e faz
rápido. Não prometer versatilidade, automação nem IA; a ausência de IA é decisão de
produto, não limitação. Argumentos, em ordem de força:

1. Um criativo, três formatos da Meta, sem remontar do zero
2. Os arquivos nunca saem do navegador — sem servidor, sem upload
3. Sem cadastro nem login: o botão leva direto ao editor
4. Grátis e código aberto (MIT)
5. Só o necessário para um bom anúncio, nada além

O ponto 3 define o texto do botão principal: não é "criar conta" nem "começar
grátis" — é entrar direto.

**Refinamento visual (decisão de 2026-08-10).** A landing adota a linguagem de
página de produto do design system — dot-grid no fundo, duas linhas verticais
emoldurando a coluna, badge em pílula, headline com a segunda linha em esmeralda
sobre brilho radial, cards premium com spotlight, botão shiny, carrossel. Essas
utilities tinham ficado de fora quando o DS foi aplicado (nada no editor as
usava) e voltaram aqui. Elas continuam **fora do editor**: numa tela de trabalho
o destaque compete com o criativo, e lá vale a hierarquia por exceção (um `cta`
contido por tela).

Três decisões de conteúdo que a semelhança visual com outras landings não pode
atropelar:

- **Nada de prova social numérica.** O produto não tem números de uso, e inventar
  um é mentir. Onde a referência traria "+1.500 clientes", aqui vai um fato
  verificável e curto ou não vai nada.
- **O card de destaque do hero é a demonstração dos três formatos**, em CSS puro:
  os mockups na mesma escala, com a mesma largura e alturas diferentes, as peças
  do mesmo tamanho nos três mudando só de apoio. É o argumento 1 desenhado, não
  decoração.
- **As três funcionalidades em destaque são as que diferenciam de verdade**:
  adaptação automática entre os formatos, placeholders para remontar em segundos,
  e exportação dos três de uma vez.

Piso de qualidade da página: contraste ≥ 4.5:1, `prefers-reduced-motion`
respeitado em toda animação, e funcionar bem no celular.

---

## 14. ATALHOS

Modal com `?`. Conjunto mínimo:

> **Revisão 2026-08-07 (decisão do usuário):** onde o Figma tem atalho equivalente,
> o padrão do Figma vence a tabela original. Mudou: elipse `E`→`O`, imagem
> `I`→`Cmd+Shift+K`, exportar `Cmd+E`→`Cmd+Shift+E`, comandos `Cmd+K`→`Cmd+/`.
> Sem equivalente no Figma, mantém-se o original. Fonte única da tabela no código:
> `src/config/shortcuts.ts` (o modal da Fase 7 renderiza a partir dela).

| | |
|---|---|
| `V` seleção · `T` texto · `R` retângulo · `O` elipse · `L` linha · `Cmd+Shift+K` imagem | ferramentas |
| `Cmd/Ctrl+Z` · `Cmd+Shift+Z` | desfazer, refazer |
| `Cmd+D` duplicar · `Cmd+G` agrupar · `Cmd+Shift+G` desagrupar | |
| `Cmd+]` `Cmd+[` uma posição · `Cmd+Shift+]` `Cmd+Shift+[` para o topo/fundo | pilha |
| setas 1px · `Shift`+setas 10px | mover |
| `Cmd+C` `Cmd+V` · `Cmd+Alt+C` `Cmd+Alt+V` | copiar objeto, copiar estilo |
| `Shift+S` safe zones · `Shift+G` guias · `Shift+1` ajustar · `Shift+0` 100% | visualização |
| `Cmd+Shift+E` exportar os 3 | |
| `Cmd+/` | paleta de comandos |

No redimensionamento pelo transformer (padrão Figma/Photoshop): `Shift` trava a
proporção, `Option/Alt` redimensiona a partir do centro, `Shift+Option` faz os dois.

Undo/redo com pilha de patches do Immer, limite de 100 passos. Agrupe operações contínuas (arrastar, slider) em um único passo — desfazer um arraste deve voltar tudo, não pixel por pixel.

---

## 15. FASES

Pare ao fim de cada uma, rode o app, mostre e espere aprovação.

**FASE 0 — Fundação.** Vite + React + TS strict + Tailwind + shadcn. Tipos e schemas zod. `config/formats.ts` e `safeAreas.ts`. Dexie com CRUD de projetos. Dashboard com grade de projetos. Sem canvas ainda.
*Aceite:* criar, renomear, duplicar e apagar projetos; sobrevive ao reload.

**FASE 1 — Canvas e edição.** Konva em um único Layer com Groups. Fundo, imagem, texto e retângulo. Seleção, transformer, painel de camadas, inspector básico, undo/redo, salvamento automático.
*Aceite:* montar um criativo 4:5 com foto de fundo, título e um botão retangular; recarregar e encontrar tudo idêntico.

**FASE 2 — Multiformato.** `adaptLayout`, âncoras, overlay de safe zone, modo comparar, override por camada, `detached` por formato, auto-fit, focal point.
*Aceite:* desenhar no 4:5 e ver 1:1 e 9:16 corretos sem tocar em nada; ajustar o 9:16 na mão e confirmar que os outros dois não se mexeram.

**FASE 3 — Exportação.** Render em tamanho real, PNG e JPG, checklist de validação, nomenclatura, ZIP dos três, arquivo `.criativo` de export e import. **Monte aqui a suíte de regressão visual** — ela precisa nascer junto com o export, não depois.
*Aceite:* exportar os três, conferir dimensões exatas e comparar pixel a pixel com o preview.

**FASE 4 — Ferramentas completas.** Elipse, linha, seta, gradientes linear e radial em forma, fundo e texto, todos os blend modes, efeitos, máscara, crop, ajustes de imagem, agrupar, alinhar e distribuir, snapping completo, todos os atalhos. **Placeholders completos:** criar, rotular, preencher arrastando, esvaziar, substituir e preencher em lote.
*Aceite:* reproduzir três anúncios reais que você já rodou, sem sair do app; depois esvaziar as imagens de um deles e remontá-lo em menos de um minuto só arrastando fotos novas.

**FASE 5 — Tipografia e cor.** Curadoria de fontes, busca no Google Fonts, upload de fonte, recursos completos de texto, seletor de cor, conta-gotas, extração de paleta.
*Aceite:* aplicar a identidade completa de uma marca sua.

**FASE 6 — Marca e modelos.** Brand kit com tokens, estilos de texto, seus 8 a 12 modelos de fábrica, modelos do usuário.
*Aceite:* trocar o brand kit de um projeto e ver cores e fontes atualizarem em todas as camadas.

**FASE 7 — Acabamento e publicação.** **Landing page** (ver §13 — página pública antes do dashboard, com o posicionamento da tese). Tela de configurações, modal de atalhos, aviso de armazenamento local, estados vazios e de erro revisados, README e deploy estático.
*Aceite:* outra pessoa clona o repositório, roda `npm install && npm run dev` e tem o app completo — sem chave de API, sem variável de ambiente, sem configurar absolutamente nada.

**Depois do v1, em ordem de valor:** **modo guiado "Criativo rápido" (§18)**, PWA instalável com service worker, remoção de fundo local, tamanho custom de criativo. Nada disso entra antes da Fase 7 estar aprovada — e ela foi aprovada em 2026-08-11.

---

## 16. ENGENHARIA, PERFORMANCE E TESTES

**Faça**

TypeScript `strict`, sem `any` — use `unknown` mais type guard quando precisar escapar. Valide com zod tudo que cruza fronteira: arquivo de projeto importado, dado lido do IndexedDB, JSON de modelo, fonte enviada pelo usuário.

Funções puras em `lib/layout`, `lib/render` e `lib/export`, com teste unitário. `adaptLayout` precisa de cobertura real, incluindo os dois caminhos, override, `detached` e correção de safe zone — é o coração do produto e o lugar onde uma regressão passa despercebida.

Componentes abaixo de 200 linhas. Um arquivo de inspector por tipo de camada.

Toda operação que possa demorar tem estado de carregamento, erro visível e forma de cancelar. Erros dizem o que aconteceu e o que fazer, na voz da interface, nunca "algo deu errado".

Piso de qualidade sem anunciar: foco de teclado visível, `prefers-reduced-motion` respeitado, contraste da própria interface acima de 4.5:1.

Nenhuma requisição de rede além do carregamento de fontes. Se você se pegar escrevendo um `fetch` para outro fim, pare e releia a seção 3.

Commits pequenos e descritivos. Ao fim de cada fase, atualize `docs/PROGRESS.md` com o que foi feito, o que ficou pendente e as decisões tomadas no caminho.

**Não faça**

Não crie um segundo caminho de renderização para o export. Não coloque cada camada do projeto em um `Layer` separado do Konva — quebra os blend modes. Não distorça imagem em nenhuma adaptação automática. Não crie um tipo de camada separado para placeholder. Não escreva código de escala horizontal na adaptação — a largura é 1080 nos três formatos, e tratá-la como variável só adiciona caminhos que ninguém testa. Não use `localStorage` para projeto. Não implemente nada da lista do item 3 por iniciativa própria. Não peça para escolher stack — a seção 4 está fechada. Não adicione uma opção só porque a biblioteca a oferece: releia a seção 1 antes de expor qualquer controle novo.

### Performance

Alvo: arrastar uma camada a 60fps com 25 camadas na tela e três filtros ativos. Se cair disso, é bug, não característica.

- Todas as camadas do projeto vivem em **um único `Layer` do Konva**, dentro de `Group`s. Isso é requisito dos blend modes e também é o que mantém a performance.
- `cache()` só nos nós que têm filtro, e invalidação apenas quando o parâmetro muda. Debounce de 120ms nos sliders de ajuste.
- `listening(false)` em camadas travadas e em elementos decorativos que nunca recebem clique.
- `perfectDrawEnabled(false)` onde não houver combinação de contorno com opacidade.
- Camadas de imagem usam, na tela, um bitmap reduzido para a escala de exibição. O arquivo em resolução plena entra **só no momento do export**. Sem isso, três fotos de 2560px numa tela em 60% de zoom já engasgam.
- No **modo comparar**, os dois formatos derivados renderizam com `pixelRatio` reduzido e só se atualizam ao confirmar a operação, não durante o arraste. O formato em foco continua em tempo real.

### Testes

`adaptLayout` precisa de cobertura real, não simbólica: cada valor de âncora, camada sobrescrita, formato desconectado, correção de safe zone, auto-fit, e troca de formato base. É o coração do produto e o lugar onde uma regressão passa despercebida por semanas.

**Regressão visual do export, a partir da Fase 3.** Um conjunto de projetos-fixture cobrindo texto com gradiente, imagem com filtro, blend mode, máscara, placeholder vazio e fonte enviada pelo usuário. Rode o export headless, compare com o PNG de referência usando `pixelmatch`, tolerância de 0.1% dos pixels, e falhe o CI na diferença. Guarde as imagens de referência no repositório.

Este teste existe por um motivo específico: os bugs mais caros deste app — fonte substituída silenciosamente, filtro que não foi re-cacheado, gradiente recalculado errado — **não quebram nada**. O app não dá erro, o export sai, e o problema só aparece com o anúncio no ar. Comparação de pixel é a única coisa que os pega.

Um teste dedicado deve afirmar que toda família de fonte usada no projeto está em `document.fonts` e com status `loaded` antes de qualquer renderização final.

---

## 17. PRIMEIRA TAREFA

Comece pela FASE 0.

1. Liste as tarefas da fase em `docs/PROGRESS.md`.
2. Levante dúvidas apenas se algo nesta spec estiver ambíguo ou contraditório — não peça confirmação de decisões já tomadas.
3. Implemente, rode `npm run dev` e mostre o dashboard funcionando.

O repositório já existe: **`criativos-de-imagem`**. Inicialize o projeto dentro dele e crie o `LICENSE` (MIT) no primeiro commit.

Ao terminar, escreva o `README.md` com instalação, deploy estático genérico (sem acoplar a nenhuma plataforma) e — em destaque — as duas frases que são argumento de adoção: nenhuma chave de API ou variável de ambiente é necessária, e nenhum dado sai do navegador do usuário.

---

## 18. MODO GUIADO — "CRIATIVO RÁPIDO" (pós-v1, decisão de 2026-08-11)

### O problema

O público real deste app não é designer. São pessoas de 50 anos para cima que já
desistiram do Canva, do Figma e do Photoshop. Para elas o editor completo não é
"poderoso": é intimidante. A ferramenta que resolve o problema delas só resolve se
elas chegarem ao fim.

### O que é

Um fluxo passo a passo que leva do zero ao criativo pronto sem exigir que a pessoa
entenda o editor. **Não é um sistema paralelo.** Ele monta um projeto normal,
usando os modelos de fábrica que já existem, e termina com a pessoa dentro do
editor completo — ou com os três arquivos na mão. O projeto que sai daqui é
indistinguível de um feito à mão: mesmo schema, mesmo export, mesmo tudo.

Nome na interface: **"Criativo rápido"**. Nunca "modo iniciante", "modo simples"
ou "para quem não sabe" — para este público o rótulo confirma a insegurança antes
de começar.

### Os cinco passos

1. **Escolher o modelo** — **quatro** miniaturas grandes renderizadas pela
   `StageScene`, uma por objetivo, em linguagem de quem anuncia (os quatro
   objetivos vigentes estão em "Modelos desenhados à mão", abaixo). Um modelo
   por objetivo, não três: uma decisão por tela vale também aqui, e uma grade de
   doze é exatamente o que faz este público desistir. Os outros oito continuam
   disponíveis no editor completo, para quem quiser trocar depois. O projeto
   nasce aqui.
2. **Foto principal** — área de arrastar grande e botão de escolher arquivo.
   Preenche o placeholder principal do modelo, com resultado ao vivo. Reenquadre
   pelo focal point, explicado em uma linha e sem jargão.
3. **Logo (opcional)** — "Pular esta etapa" com o mesmo peso visual do botão de
   avançar. Se a marca ativa já tem logo salvo, ele aparece como opção de um
   toque.
4. **Textos** — **um campo por tela**, cada um rotulado pela pergunta que o
   modelo declara. Sugestão de tamanho ("títulos curtos funcionam melhor — até 5
   palavras"). Preview ao vivo a cada tecla.
5. **Conferir os três formatos** — 4:5, 1:1 e 9:16 lado a lado, com dica curta por
   formato. Ajustes simples continuam guiados aqui (mover, trocar cor, trocar
   texto); o editor inteiro, não. Termina em "Baixar os três" e "Abrir no editor
   completo para ajustar mais".

### Regras de interface — não são preferência, são requisito do público

- **Uma decisão por tela.** Nunca dois pedidos no mesmo passo.
- Alvos de toque e botões grandes; tipografia maior que a do editor. O escopo
  `.ds-app` densifica a interface de trabalho — o modo guiado **não** o usa.
- **Indicador de progresso sempre visível, com cinco passos fixos e subcontador
  nos textos:** "Passo 4 de 5 · texto 2 de 3". O total não muda no meio do
  caminho conforme o modelo escolhido — barra que se estica quebra a confiança de
  quem já está inseguro.
- **Voltar sempre disponível**, sem perder o que já foi feito.
- **Zero jargão.** Proibidos na interface: "camada", "placeholder", "safe zone",
  "token", "âncora", "4:5". Os formatos se chamam "Feed vertical", "Feed
  quadrado" e "Stories e Reels".
- **Salvamento automático a cada passo.** A pessoa pode fechar e voltar depois.
- **Saída para o editor completo a qualquer momento**, sem perder nada.
- **Validação gentil**: explique a consequência prática, não o número. Imagem
  pequena demais não é "abaixo de 1080px" — é "essa foto vai sair borrada no
  anúncio; se tiver uma maior, ela fica melhor".

### O checklist traduzido

O modo guiado não inventa validação: ele **reusa o `staticChecklist` da §11** e
traduz cada `kind` para linguagem leiga. A regra é dizer o efeito no anúncio, não
o nome da regra. Exemplo obrigatório: `fora-da-safe-zone` no 9:16 não é "texto
fora da safe zone", é *"no Stories, o topo e a base ficam escondidos pelos botões
do Instagram — puxe o título um pouco para o centro"*. A tradução é exaustiva por
`kind`: se um `kind` novo entrar no checklist, o TypeScript quebra a tradução até
alguém escrever a versão leiga.

### O que muda no modelo de dados

Duas adições, ambas **opcionais** — projeto antigo continua válido e o
`schemaVersion` não muda:

1. `LayerBase.guide?: { role, question, hint?, order, optional? }`. Hoje os
   modelos de fábrica nomeiam as camadas de texto por função interna ("Chamada",
   "Detalhe", "CTA", "Rótulo", "Código", "Condição") — nomes que servem ao painel
   de camadas e **não servem como pergunta**. O campo `guide` é o que transforma
   um modelo em roteiro: declara o papel (`titulo`, `subtitulo`, `botao`,
   `foto-principal`, `foto-secundaria`, `logo`), a pergunta em português claro, a
   ordem, e se a etapa pode ser pulada. Camada sem `guide` não vira pergunta — é
   assim que o "Rótulo: LANÇAMENTO" fica de fora sem precisar de lista negra.
2. `Project.guided?: { screen, templateId }`. É onde o fluxo mora. Ele
   vive **no projeto**, não num store à parte, e é isso que dá o salvamento
   automático de graça: o projeto já persiste no Dexie a cada mudança, então
   fechar a aba no passo 3 e voltar no dia seguinte cai no passo 3.

### O que muda nos modelos de fábrica

- Todo modelo ganha `guide` nas camadas que viram pergunta, com a ordem e o texto
  da pergunta escritos para quem não é designer.
- **Todo modelo ganha um espaço de logo opcional** (`role: 'logo'`,
  `optional: true`), dentro da área segura. Hoje só 2 dos 12 têm — o passo 3 não
  teria onde colocar nos outros 10. Quando a pessoa pula o passo, a camada é
  **removida do projeto**, não deixada vazia: placeholder vazio vira aviso no
  checklist e quadro tracejado no anúncio.
- Modelos com duas fotos ("Antes e depois") declaram `foto-principal` e
  `foto-secundaria` — o passo 2 pergunta as duas, uma por tela, mantendo a regra
  de uma decisão por vez.

### Onde aparece

Botão destacado na landing ao lado de "Abrir o editor"; no dashboard junto de
"Novo projeto"; e dentro do editor num ponto visível que não atrapalhe quem já
sabe usar. Rota própria: `#/rapido` no passo 1 (ainda não há projeto) e
`#/rapido/:id` a partir do momento em que ele existe.

**Só no computador**, pela mesma regra do editor (§13): as ferramentas deste
fluxo precisam de tela grande. Consequência que **não pode ser esquecida** — a
landing é acessível no celular, então o botão "Criativo rápido" ali leva a uma
tela pequena. Ele precisa dizer isso antes do clique, e a rota precisa cair no
mesmo aviso de modo leitura em vez de num fluxo quebrado.

### O que não muda

O editor completo continua exatamente como está. O modo guiado é porta de entrada,
não substituição.

### Modelos desenhados à mão (decisão de 2026-08-12)

Os modelos gerados por script ficaram visualmente fracos. Os QUATRO do passo 1
serão **desenhados pelo dono do app, no próprio editor**, e exportados como
modelo de fábrica. Os objetivos passam a ser, nesta ordem:

1. **Produto em destaque** — "Para mostrar o produto ou serviço em primeiro plano."
2. **Oferta e preço** — "Para promoção, desconto e data comemorativa."
3. **Depoimento** — "Para mostrar o que um cliente falou sobre você."
4. **Antes e depois** — "Para serviços onde o resultado se vê: estética, reforma,
   odontologia, jardinagem."

Cada objetivo aponta para uma lista de ids candidatos e **o primeiro id carregado
vence** (`resolveObjectiveTemplate`): enquanto o modelo desenhado não chega, o
gerado por script mais próximo segura a ponta — o fluxo nunca quebra por modelo
faltando. Quando o arquivo novo entra em `/public/templates` com o id da frente
("Produto em destaque" → `builtin-produto-em-destaque`; "Depoimento" e "Antes e
depois" reusam o id atual e substituem o arquivo), ele assume sozinho.

**A exportação converte tudo automaticamente** (`templatizeProject`, o inverso da
resolução de tokens):

- toda **imagem vira placeholder rotulado** (o asset era do IndexedDB de quem
  desenhou — em outra máquina seria imagem quebrada);
- **cor que bate com o brand kit ativo vira token** `brand.<id>` (sólidas e stops
  de gradiente, camadas e fundo); fonte que bate com os papéis do kit vira
  `brand.display`/`brand.body`;
- **o nome da camada vira roteiro** (`guide`), pela convenção abaixo;
- os três layouts são preservados — quem ajustou o 9:16 na mão exporta o ajuste.

**Convenção de nomes** — nomeie a camada (painel Camadas) com um destes termos e
ela vira pergunta no fluxo guiado; camada sem termo reconhecido é decoração e não
pergunta nada:

| Termo no nome | Papel | Pergunta gerada |
|---|---|---|
| Título / Chamada / Mensagem | titulo | "Qual é a frase principal do anúncio?" |
| Depoimento | titulo | "O que o cliente disse?" |
| Subtítulo / Apoio / Detalhe / Legenda | subtitulo (opcional) | "Quer acrescentar um texto de apoio?" |
| Preço | preco | "Qual é o preço?" |
| Selo / Etiqueta | selo (opcional) | "O que escrever no selo/na etiqueta?" |
| Nome | nome | "Qual é o nome de quem falou?" |
| Cargo / Empresa | cargo (opcional) | "E o cargo ou a empresa dessa pessoa?" |
| Botão / CTA | botao | "O que escrever no botão?" |
| Foto/Imagem + Produto/Pessoa/… | foto-principal | pergunta específica do termo |
| ANTES · DEPOIS | foto-principal · foto-secundaria | "Qual é a foto do ANTES?" · "E a do DEPOIS?" |
| Logo | logo (opcional) | "Quer colocar a sua logo?" |

Os papéis `preco`, `selo`, `nome` e `cargo` são próprios desde 2026-08-13
(estreados pelos modelos desenhados à mão): entram nas telas de texto do passo 4
como qualquer texto, na ordem declarada pelo autor.

Regras de segurança da inferência: só a primeira foto vira principal (as demais
viram secundárias), só a primeira logo ganha roteiro, título pergunta antes de
apoio e apoio antes de botão, e a imagem consulta nome E rótulo do placeholder
(imagem inserida no editor nasce com nome "Imagem" e o significado no rótulo).

**Como exportar** (ação escondida, para quem mantém o app): painel **Modelos** →
segure **Alt** → "Exportar como modelo de fábrica" → nome → baixa o `.json` já
convertido. O arquivo vai para `/public/templates/` e ganha uma entrada em
`index.json` (`{ id, name, file }`). Modelos não têm categoria: com uma dúzia
deles, o painel é uma lista única — agrupar atrapalhava mais do que ajudava
(decisão de 2026-08-13).

Desenhe **só no 4:5** (o formato base): o motor deriva o 1:1 e o 9:16 ao aplicar,
como em qualquer projeto. Ajustes manuais feitos no 9:16/1:1 são exportados junto
(overrides preservados) — vale conferir os três antes de exportar, mas não é
obrigatório desenhá-los.
