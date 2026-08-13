import { z } from 'zod';

// Schemas zod espelhando `types.ts`. SPEC §16: valide com zod tudo que cruza
// fronteira — arquivo de projeto importado, dado lido do IndexedDB, JSON de modelo.
// A tipagem estática vem de `types.ts`; aqui garantimos a validação em runtime.

export const formatIdSchema = z.enum(['4:5', '1:1', '9:16']);

export const safeAreaSchema = z.object({
  top: z.number(),
  right: z.number(),
  bottom: z.number(),
  left: z.number(),
});

export const blendModeSchema = z.enum([
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
]);

export const frameSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

export const anchorSchema = z.object({
  v: z.enum(['top', 'center', 'bottom', 'stretch']),
});

export const effectsSchema = z.object({
  shadow: z
    .object({
      x: z.number(),
      y: z.number(),
      blur: z.number(),
      color: z.string(),
      opacity: z.number(),
    })
    .optional(),
  stroke: z
    .object({
      width: z.number(),
      color: z.string(),
      position: z.enum(['inside', 'center', 'outside']),
    })
    .optional(),
  blur: z.number().optional(),
});

export const stopSchema = z.object({
  offset: z.number().min(0).max(1),
  color: z.string(),
});

export const fillSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('solid'), color: z.string() }),
  z.object({ kind: z.literal('linear'), stops: z.array(stopSchema), angle: z.number() }),
  z.object({
    kind: z.literal('radial'),
    stops: z.array(stopSchema),
    cx: z.number(),
    cy: z.number(),
    r: z.number(),
  }),
]);

// Roteiro do modo guiado (§18). Opcional: projeto e modelo anteriores a ele
// continuam válidos, então o `schemaVersion` não muda.
export const guideRoleSchema = z.enum([
  'foto-principal',
  'foto-secundaria',
  'logo',
  'titulo',
  'subtitulo',
  'botao',
]);

/** Estado do fluxo guiado, guardado no próprio projeto (§18). */
export const guidedStateSchema = z.object({
  screen: z.number().int().min(0),
  templateId: z.string(),
});

export const guideSlotSchema = z.object({
  role: guideRoleSchema,
  question: z.string().min(1),
  hint: z.string().optional(),
  order: z.number(),
  optional: z.boolean().optional(),
});

const layerBaseShape = {
  id: z.string(),
  name: z.string(),
  visible: z.boolean(),
  locked: z.boolean(),
  opacity: z.number().min(0).max(1),
  rotation: z.number(),
  blendMode: blendModeSchema,
  frame: frameSchema,
  anchor: anchorSchema,
  overriddenIn: z.array(formatIdSchema),
  effects: effectsSchema,
  guide: guideSlotSchema.optional(),
};

export const textLayerSchema = z.object({
  ...layerBaseShape,
  type: z.literal('text'),
  content: z.string(),
  fontFamily: z.string(),
  fontWeight: z.number(),
  fontSize: z.number(),
  lineHeight: z.number(),
  letterSpacing: z.number(),
  align: z.enum(['left', 'center', 'right']),
  vAlign: z.enum(['top', 'middle', 'bottom']),
  transform: z.enum(['none', 'uppercase']),
  underline: z.boolean(),
  bullet: z.boolean(),
  fill: fillSchema,
  highlight: z
    .object({
      fill: fillSchema,
      padH: z.number(),
      padV: z.number(),
      radius: z.number(),
    })
    .optional(),
  autoFit: z.object({ enabled: z.boolean(), min: z.number(), max: z.number() }),
});

export const imageLayerSchema = z.object({
  ...layerBaseShape,
  type: z.literal('image'),
  assetId: z.string().nullable(),
  placeholder: z.object({ label: z.string(), note: z.string().optional() }),
  fit: z.enum(['cover', 'contain']),
  focalPoint: z.object({ x: z.number(), y: z.number() }),
  crop: frameSchema.optional(),
  adjust: z.object({
    brightness: z.number(),
    contrast: z.number(),
    saturation: z.number(),
    blur: z.number(),
  }),
  mask: z.object({ shape: z.enum(['rect', 'ellipse']), radius: z.number().optional() }).optional(),
  bgRemoved: z.boolean().optional(),
});

export const shapeLayerSchema = z.object({
  ...layerBaseShape,
  type: z.literal('shape'),
  shape: z.enum(['rect', 'ellipse', 'line', 'arrow']),
  fill: fillSchema,
  radius: z.number().optional(),
  arrowHead: z.enum(['end', 'both']).optional(),
});

// GroupLayer é recursivo (children: Layer[]), então usamos z.lazy.
export const layerSchema: z.ZodType<import('./types').Layer> = z.lazy(() =>
  z.discriminatedUnion('type', [
    textLayerSchema,
    imageLayerSchema,
    shapeLayerSchema,
    groupLayerSchema,
  ]),
);

export const groupLayerSchema = z.object({
  ...layerBaseShape,
  type: z.literal('group'),
  children: z.array(layerSchema),
});

export const layoutSchema = z.object({
  formatId: formatIdSchema,
  background: fillSchema,
  layers: z.array(layerSchema),
  detached: z.boolean(),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  schemaVersion: z.number().int(),
  brandKitId: z.string().optional(),
  baseFormat: formatIdSchema,
  layouts: z.object({
    '4:5': layoutSchema,
    '1:1': layoutSchema,
    '9:16': layoutSchema,
  }),
  assets: z.array(z.string()),
  createdAt: z.number(),
  updatedAt: z.number(),
  guided: guidedStateSchema.optional(),
});

/** Modelo (§10): projeto serializado sem id/timestamps do projeto. */
export const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  builtin: z.boolean(),
  schemaVersion: z.number().int(),
  createdAt: z.number(),
  project: projectSchema.omit({ id: true, createdAt: true, updatedAt: true }),
});

export const brandKitSchema = z.object({
  id: z.string(),
  name: z.string(),
  colors: z.array(z.object({ id: z.string(), name: z.string(), hex: z.string() })),
  fonts: z.array(
    z.object({
      role: z.enum(['display', 'body']),
      family: z.string(),
      weights: z.array(z.number()),
      userFontId: z.string().optional(),
    }),
  ),
  logos: z.array(z.object({ id: z.string(), assetId: z.string(), label: z.string() })),
  textStyles: z.record(z.string(), z.record(z.string(), z.unknown())),
});

// O Blob não é validável estruturalmente pelo zod; checamos a instância.
export const assetSchema = z.object({
  id: z.string(),
  kind: z.enum(['raster', 'svg', 'font']),
  blob: z.instanceof(Blob),
  mime: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  name: z.string(),
});
