import type { FormatId, Project } from '@/lib/model/types';
import { getFormat, FORMAT_IDS } from '@/config/formats';
import { propagateProject, type AdaptWarning } from './adapt';
import type { TextMeasurer } from './autoFit';

// Troca de formato base — SPEC §7 "Trocar o formato base".
// 1. O layout do novo base é preservado INTEGRALMENTE (vira a fonte da verdade).
// 2. Formatos detached não são tocados, nem agora nem depois.
// 3. Formatos conectados são reprojetados; seus overrides são limpos — por isso a
//    confirmação precisa dizer quantas camadas serão afetadas, com número exato.
// 4. A operação inteira é UM único passo de undo (garantido pelo chamador/store).

export interface RebaseEffects {
  newBase: FormatId;
  /** Camadas com edição manual que serão perdidas, por formato conectado. */
  overridesLost: { formatId: FormatId; count: number }[];
  /** Formatos desconectados, que não serão afetados. */
  detachedUntouched: FormatId[];
}

/** Efeitos da troca, para a confirmação listar exatamente o que vai acontecer. */
export function countRebaseEffects(project: Project, newBase: FormatId): RebaseEffects {
  const overridesLost: RebaseEffects['overridesLost'] = [];
  const detachedUntouched: FormatId[] = [];
  for (const id of FORMAT_IDS) {
    if (id === newBase) continue;
    const layout = project.layouts[id];
    if (layout.detached) {
      detachedUntouched.push(id);
      continue;
    }
    const count = layout.layers.filter((l) => l.overriddenIn.includes(id)).length;
    if (count > 0) overridesLost.push({ formatId: id, count });
  }
  return { newBase, overridesLost, detachedUntouched };
}

/** Texto da confirmação, no formato do exemplo da SPEC §7. */
export function describeRebase(project: Project, newBase: FormatId): string {
  const effects = countRebaseEffects(project, newBase);
  const label = getFormat(newBase).label;
  const others = FORMAT_IDS.filter(
    (id) => id !== newBase && !project.layouts[id].detached,
  );
  const parts: string[] = [
    `Passar a base para ${label}. O ${newBase} vira a referência` +
      (others.length > 0 ? ` e o ${others.join(' e o ')} passam a se adaptar a ele.` : '.'),
  ];
  for (const { formatId, count } of effects.overridesLost) {
    parts.push(
      count === 1
        ? `Uma camada com edição manual no ${formatId} vai perder o ajuste.`
        : `${count} camadas com edição manual no ${formatId} vão perder o ajuste.`,
    );
  }
  for (const id of effects.detachedUntouched) {
    parts.push(`O ${id}, que você desconectou, não será afetado.`);
  }
  return parts.join(' ');
}

/**
 * Executa a troca. MUTA o projeto (para rodar dentro de uma receita do Immer).
 * Limpa os overrides dos formatos conectados e reprojeta a partir da nova base.
 */
export function rebaseProject(
  project: Project,
  newBase: FormatId,
  measure?: TextMeasurer,
): AdaptWarning[] {
  project.baseFormat = newBase;
  for (const id of FORMAT_IDS) {
    if (id === newBase) {
      // Geometria preservada integralmente; só as marcas auto-referentes saem —
      // uma camada não pode estar "sobrescrita" no formato que agora é a base.
      for (const layer of project.layouts[id].layers) {
        layer.overriddenIn = layer.overriddenIn.filter((f) => f !== id);
      }
      continue;
    }
    const layout = project.layouts[id];
    if (layout.detached) continue;
    for (const layer of layout.layers) {
      layer.overriddenIn = layer.overriddenIn.filter((f) => f !== id);
    }
  }
  return propagateProject(project, measure);
}
