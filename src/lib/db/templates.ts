import { db } from './dexie';
import type { Layer, Project, Template } from '@/lib/model/types';
import { templateSchema } from '@/lib/model/schema';
import { newId, createProject } from '@/lib/model/factory';
import { cloneLayerDeep } from '@/lib/model/groups';
import { CURRENT_SCHEMA_VERSION } from '@/lib/model/migrations';
import { templatizeProject } from '@/lib/model/templatize';
import { getActiveBrandKit } from '@/lib/store/brand';
import { slugify } from '@/lib/export/naming';

// Modelos (SPEC §10). De FÁBRICA: JSON em /public/templates, carregados sob
// demanda e validados com zod (dado que cruza fronteira, §16). DO USUÁRIO:
// IndexedDB, aba "Meus". Aplicar um modelo cria um PROJETO novo — os tokens de
// marca resolvem contra o kit ativo no render, então o modelo já nasce com as
// cores e fontes do usuário.

export interface TemplateIndexEntry {
  id: string;
  name: string;
  category: Template['category'];
  file: string;
}

export const CATEGORY_LABELS: Record<Template['category'], string> = {
  promocao: 'Promoção',
  lancamento: 'Lançamento',
  'prova-social': 'Prova social',
  institucional: 'Institucional',
};

function templatesBase(): string {
  // `base` do Vite é relativo por padrão (deploy em raiz OU subdiretório, §3).
  return `${import.meta.env.BASE_URL ?? '/'}templates/`;
}

let builtinCache: Template[] | null = null;

export async function loadBuiltinTemplates(): Promise<Template[]> {
  if (builtinCache) return builtinCache;
  const base = templatesBase();
  const index: TemplateIndexEntry[] = await fetch(`${base}index.json`).then((r) => {
    if (!r.ok) throw new Error('Não foi possível carregar os modelos de fábrica.');
    return r.json();
  });
  const out: Template[] = [];
  for (const entry of index) {
    try {
      const raw = await fetch(`${base}${entry.file}`).then((r) => r.json());
      out.push(templateSchema.parse(raw) as Template);
    } catch (err) {
      console.error(`Modelo de fábrica "${entry.name}" inválido:`, err);
    }
  }
  builtinCache = out;
  return out;
}

export async function listUserTemplates(): Promise<Template[]> {
  const rows = await db.templates.toArray();
  return rows.filter((r) => templateSchema.safeParse(r).success);
}

/** "Salvar como modelo": congela o projeto atual como modelo do usuário. */
export async function saveProjectAsTemplate(
  project: Project,
  name: string,
  category: Template['category'],
): Promise<Template> {
  const template: Template = {
    id: newId(),
    name: name.trim() || project.name,
    category,
    builtin: false,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: Date.now(),
    project: {
      name: name.trim() || project.name,
      schemaVersion: project.schemaVersion,
      baseFormat: project.baseFormat,
      brandKitId: project.brandKitId,
      layouts: structuredClone(project.layouts),
      assets: [...project.assets],
    },
  };
  await db.templates.add(template);
  return template;
}

export async function deleteUserTemplate(id: string): Promise<void> {
  await db.templates.delete(id);
}

/** O espaço de logo PULÁVEL existe para o passo 3 do modo guiado (§18). Fora do
 *  fluxo ele é ruído: quem abre um modelo no editor completo sabe inserir um logo
 *  se quiser, e não deve ganhar um quadro tracejado a mais nem um aviso recorrente
 *  no checklist por algo que não pediu.
 *
 *  Logo NÃO pulável (o "Marca em destaque", onde a logo é o modelo inteiro) fica:
 *  removê-la esvaziaria o modelo. */
function isSkippableLogo(layer: Layer): boolean {
  return layer.guide?.role === 'logo' && layer.guide.optional === true;
}

/** As camadas que o editor completo vai receber deste modelo. A miniatura usa a
 *  mesma função de `projectFromTemplate`: o que se vê é o que se aplica. */
export function layersAsApplied(layers: Layer[]): Layer[] {
  return layers.filter((l) => !isSkippableLogo(l));
}

/**
 * Cria um PROJETO a partir de um modelo. Ids de camada são renovados (o modelo
 * pode ser aplicado várias vezes sem colisão); o brand kit ativo do usuário é
 * herdado, então os tokens do modelo resolvem para a marca dele já na abertura.
 * Devolve também o id do primeiro placeholder vazio — a UI abre com ele
 * selecionado (§8: "o fluxo que faz o produto valer o clique").
 *
 * `guided: true` preserva o espaço de logo pulável, que o passo 3 vai perguntar.
 */
export function projectFromTemplate(
  template: Template,
  opts: { name?: string; brandKitId?: string; guided?: boolean } = {},
): { project: Project; firstPlaceholderId: string | null } {
  const fresh = createProject({
    name: opts.name?.trim() || template.name,
    baseFormat: template.project.baseFormat,
  });

  const layouts = structuredClone(template.project.layouts);
  if (!opts.guided) {
    for (const layout of Object.values(layouts)) {
      layout.layers = layersAsApplied(layout.layers);
    }
  }
  // Renova ids mantendo a MESMA identidade entre formatos: uma camada que existe
  // no 4:5 e no 9:16 precisa continuar sendo "a mesma" para a adaptação (§7).
  const idMap = new Map<string, string>();
  for (const layout of Object.values(layouts)) {
    layout.layers = layout.layers.map((layer) => {
      const copy = cloneLayerDeep(layer); // ids novos em toda a árvore
      const mapped = idMap.get(layer.id);
      if (mapped) copy.id = mapped;
      else idMap.set(layer.id, copy.id);
      return copy;
    });
  }

  const project: Project = {
    ...fresh,
    brandKitId: opts.brandKitId,
    layouts,
    assets: [],
  };

  const base = project.layouts[project.baseFormat].layers;
  const firstEmpty = base.find((l) => l.type === 'image' && l.assetId === null);
  return { project, firstPlaceholderId: firstEmpty?.id ?? null };
}

/** Ação escondida "Exportar como modelo de fábrica" (§10/§18): gera o JSON que
 *  vai para /public/templates, já convertido pela `templatizeProject` — imagens
 *  viram placeholders rotulados, cores e fontes que batem com o brand kit ativo
 *  viram tokens, e o nome das camadas vira roteiro do modo guiado. O projeto
 *  aberto não muda: a conversão trabalha numa cópia. */
export function templateFileJson(project: Project, name: string, category: Template['category']): string {
  // O mesmo slugify do nome do arquivo baixado: id e arquivo sempre casam.
  const template: Omit<Template, 'id'> & { id: string } = {
    id: `builtin-${slugify(name)}`,
    name,
    category,
    builtin: true,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: 0,
    project: {
      name,
      schemaVersion: project.schemaVersion,
      baseFormat: project.baseFormat,
      layouts: templatizeProject(project, getActiveBrandKit()),
      assets: [], // os assets eram do IndexedDB de quem desenhou; viraram placeholders
    },
  };
  return JSON.stringify(template, null, 2);
}
