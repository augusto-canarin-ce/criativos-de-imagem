import type { GroupLayer, Layer } from './types';
import { newId } from './factory';

// Agrupar/desagrupar (SPEC §8). Convenção do modelo: os frames dos FILHOS são
// RELATIVOS à origem do grupo — o Konva Group aplica x/y/rotação e os filhos
// desenham no espaço local. É o que faz a adaptação entre formatos mover o grupo
// como uma unidade (o frame do grupo adapta pela âncora; os filhos nem sabem).

/** Caixa envolvente de um conjunto de camadas (frames axis-aligned). */
function bbox(layers: Layer[]): { x: number; y: number; w: number; h: number } {
  const x1 = Math.min(...layers.map((l) => l.frame.x));
  const y1 = Math.min(...layers.map((l) => l.frame.y));
  const x2 = Math.max(...layers.map((l) => l.frame.x + l.frame.w));
  const y2 = Math.max(...layers.map((l) => l.frame.y + l.frame.h));
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

/** Cria um GroupLayer a partir de camadas (frames absolutos → filhos relativos). */
export function groupLayers(layers: Layer[]): GroupLayer {
  const box = bbox(layers);
  const children = layers.map((l) => ({
    ...l,
    frame: { ...l.frame, x: l.frame.x - box.x, y: l.frame.y - box.y },
  }));
  return {
    id: newId(),
    name: 'Grupo',
    type: 'group',
    visible: true,
    locked: false,
    opacity: 1,
    rotation: 0,
    blendMode: 'normal',
    frame: box,
    anchor: { v: 'top' },
    overriddenIn: [],
    effects: {},
    children,
  };
}

/**
 * Desfaz um grupo: filhos voltam a frames absolutos. Se o grupo estiver
 * rotacionado, a posição de cada filho é rotacionada em torno da origem do grupo
 * e a rotação soma — aproximação pelo canto do frame, suficiente na prática.
 */
export function ungroupLayer(group: GroupLayer): Layer[] {
  const rad = (group.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return group.children.map((child) => {
    const rx = child.frame.x * cos - child.frame.y * sin;
    const ry = child.frame.x * sin + child.frame.y * cos;
    return {
      ...child,
      frame: { ...child.frame, x: Math.round(group.frame.x + rx), y: Math.round(group.frame.y + ry) },
      rotation: child.rotation + group.rotation,
      opacity: child.opacity * group.opacity,
    };
  });
}

/**
 * Redimensionar um grupo escala a GEOMETRIA dos filhos (Figma-like): frames em
 * ambos os eixos e, em texto, o fontSize pela média das escalas. Recursivo.
 */
export function scaleGroupChildren(group: GroupLayer, sx: number, sy: number): void {
  for (const child of group.children) {
    child.frame.x *= sx;
    child.frame.y *= sy;
    child.frame.w *= sx;
    child.frame.h *= sy;
    if (child.type === 'text') {
      const s = (sx + sy) / 2;
      child.fontSize = Math.max(4, child.fontSize * s);
    }
    if (child.type === 'group') scaleGroupChildren(child, sx, sy);
  }
}

/** Percorre camadas em profundidade (grupos incluídos), no sentido da pilha. */
export function walkLayers(layers: Layer[], visit: (layer: Layer, parent: GroupLayer | null) => void): void {
  const walk = (list: Layer[], parent: GroupLayer | null) => {
    for (const layer of list) {
      visit(layer, parent);
      if (layer.type === 'group') walk(layer.children, layer);
    }
  };
  walk(layers, null);
}

/** Busca recursiva por id (topo e dentro de grupos). */
export function findLayerDeep(layers: Layer[], id: string): Layer | undefined {
  for (const layer of layers) {
    if (layer.id === id) return layer;
    if (layer.type === 'group') {
      const hit = findLayerDeep(layer.children, id);
      if (hit) return hit;
    }
  }
  return undefined;
}

/** Remove recursivamente por id. Retorna true se removeu. */
export function removeLayerDeep(layers: Layer[], id: string): boolean {
  const idx = layers.findIndex((l) => l.id === id);
  if (idx >= 0) {
    layers.splice(idx, 1);
    return true;
  }
  for (const layer of layers) {
    if (layer.type === 'group' && removeLayerDeep(layer.children, id)) return true;
  }
  return false;
}

/** Clona uma camada (grupo incluso) com ids NOVOS em toda a árvore. */
export function cloneLayerDeep(layer: Layer): Layer {
  const copy = structuredClone(layer);
  const renew = (l: Layer) => {
    l.id = newId();
    if (l.type === 'group') l.children.forEach(renew);
  };
  renew(copy);
  return copy;
}
