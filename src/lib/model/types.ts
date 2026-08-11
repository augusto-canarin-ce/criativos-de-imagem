// Modelo de dados — SPEC §6. Schemas zod espelhados em `schema.ts`, migrações em
// `migrations.ts`. O app salva na máquina do usuário: quebrar o formato é perder o
// trabalho dele, então tudo aqui é versionado desde o primeiro commit.

// ---------- formatos ----------

export type FormatId = '4:5' | '1:1' | '9:16';

export interface FormatDef {
  id: FormatId;
  label: string; // "Feed Vertical", "Stories/Reels"
  width: 1080; // invariante do sistema — os três compartilham
  height: number; // 1350 | 1080 | 1920
  builtin: boolean;
  safeArea: SafeArea;
}

export interface SafeArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// ---------- projeto ----------

export interface Project {
  id: string;
  name: string;
  schemaVersion: number;
  brandKitId?: string;
  baseFormat: FormatId; // onde o usuário desenha primeiro
  layouts: Record<FormatId, Layout>;
  assets: string[]; // ids na tabela de assets
  createdAt: number;
  updatedAt: number;
  guided?: GuidedState; // fluxo "Criativo rápido" em andamento (§18)
}

// Estado do modo guiado. Mora AQUI, no projeto, e não num store à parte: o
// projeto já persiste no IndexedDB a cada mudança, então fechar a aba no passo 3
// e voltar amanhã cai no passo 3 sem nenhuma persistência extra.
//
// `screen` é o índice na lista de telas derivada do roteiro (lib/guided/steps).
export interface GuidedState {
  screen: number;
  templateId: string;
  completedAt?: number;
}

export interface Layout {
  formatId: FormatId;
  background: Fill; // cor sólida ou gradiente; nunca transparente
  layers: Layer[]; // índice 0 = fundo da pilha
  detached: boolean; // true = parou de seguir o formato base
}

// ---------- camadas ----------

export type Layer = ImageLayer | TextLayer | ShapeLayer | GroupLayer;

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export interface LayerBase {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0–1
  rotation: number; // graus
  blendMode: BlendMode;
  frame: Frame; // px, no espaço do formato
  anchor: Anchor; // como se comporta ao mudar de formato
  overriddenIn: FormatId[]; // onde o usuário editou na mão
  effects: Effects;
  guide?: GuideSlot; // roteiro do modo guiado (§18); ausente = não vira pergunta
}

// ---------- roteiro do modo guiado (SPEC §18) ----------
//
// O que transforma um MODELO em ROTEIRO. Os modelos de fábrica nomeiam as camadas
// por função interna ("Chamada", "Detalhe", "CTA", "Rótulo") — nomes que servem ao
// painel de camadas e não servem como pergunta para quem não é designer. `guide`
// declara o papel da camada, a pergunta em português claro e a ordem.
//
// Camada SEM `guide` não vira pergunta. É assim que o "Rótulo: LANÇAMENTO" fica
// de fora do fluxo sem precisar de lista negra em lugar nenhum.

export type GuideRole =
  | 'foto-principal'
  | 'foto-secundaria'
  | 'logo'
  | 'titulo'
  | 'subtitulo'
  | 'botao';

export interface GuideSlot {
  role: GuideRole;
  question: string; // a pergunta como ela aparece na tela, sem jargão
  hint?: string; // uma linha de orientação prática
  order: number; // ordem dentro do passo
  optional?: boolean; // true = a tela oferece pular
}

export interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Anchor {
  v: 'top' | 'center' | 'bottom' | 'stretch'; // não há âncora horizontal: a largura nunca muda
}

export interface Effects {
  shadow?: { x: number; y: number; blur: number; color: string; opacity: number };
  stroke?: { width: number; color: string; position: 'inside' | 'center' | 'outside' };
  blur?: number;
}

// ---------- preenchimento ----------

export type Fill =
  | { kind: 'solid'; color: string } // hex ou token 'brand.primary'
  | { kind: 'linear'; stops: Stop[]; angle: number } // graus
  | { kind: 'radial'; stops: Stop[]; cx: number; cy: number; r: number }; // 0–1 relativo à caixa

export interface Stop {
  offset: number; // 0–1
  color: string;
}

// ---------- tipos concretos ----------

export interface TextLayer extends LayerBase {
  type: 'text';
  content: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number; // múltiplo, ex.: 1.15
  letterSpacing: number; // px
  align: 'left' | 'center' | 'right';
  vAlign: 'top' | 'middle' | 'bottom';
  transform: 'none' | 'uppercase';
  underline: boolean;
  bullet: boolean; // lista simples, um nível
  fill: Fill; // gradiente em texto é suportado
  highlight?: { fill: Fill; padH: number; padV: number; radius: number };
  autoFit: { enabled: boolean; min: number; max: number };
}

export interface ImageLayer extends LayerBase {
  type: 'image';
  assetId: string | null; // null = placeholder vazio, ainda não preenchido
  placeholder: { label: string; note?: string }; // rótulo mostrado no quadro vazio
  fit: 'cover' | 'contain';
  focalPoint: { x: number; y: number }; // 0–1, guia o reenquadre entre formatos
  crop?: Frame; // px na imagem original
  adjust: { brightness: number; contrast: number; saturation: number; blur: number };
  mask?: { shape: 'rect' | 'ellipse'; radius?: number };
  bgRemoved?: boolean; // reservado, fora do v1
}

export interface ShapeLayer extends LayerBase {
  type: 'shape';
  shape: 'rect' | 'ellipse' | 'line' | 'arrow';
  fill: Fill;
  radius?: number; // só rect
  arrowHead?: 'end' | 'both'; // só arrow
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
  textStyles: Record<string, Partial<TextLayer>>; // "Título", "Subtítulo", "CTA"
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

// ---------- templates ----------

// Um modelo é um projeto serializado. Guardado no IndexedDB (aba "Meus") ou em
// `/public/templates/*.json` (de fábrica). SPEC §10.
export type TemplateCategory = 'promocao' | 'lancamento' | 'prova-social' | 'institucional';

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  builtin: boolean;
  schemaVersion: number;
  project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
  createdAt: number;
}
