import type { TextSpan } from './types';

// Trechos coloridos de um texto (2026-09-22): "seleciono uma parte do título e
// troco só a cor dela". Funções puras sobre índices de `content` — o render, o
// editor e a inferência de modelos consomem daqui.

/** Ordena, funde vizinhos da mesma cor e descarta vazios. `undefined` quando
 *  não sobra nada — a camada volta ao estado "uma cor só". */
function normalizar(spans: TextSpan[]): TextSpan[] | undefined {
  const ordenados = spans
    .filter((s) => s.end > s.start)
    .sort((a, b) => a.start - b.start);
  const out: TextSpan[] = [];
  for (const s of ordenados) {
    const ultimo = out[out.length - 1];
    if (ultimo && ultimo.end === s.start && ultimo.color === s.color) ultimo.end = s.end;
    else out.push({ ...s });
  }
  return out.length ? out : undefined;
}

/** Pinta [start, end) com `color`, recortando o que já existia por baixo. */
export function aplicarCor(
  spans: TextSpan[] | undefined,
  start: number,
  end: number,
  color: string,
): TextSpan[] | undefined {
  if (end <= start) return spans;
  const out: TextSpan[] = [];
  for (const s of spans ?? []) {
    if (s.end <= start || s.start >= end) {
      out.push({ ...s });
      continue;
    }
    if (s.start < start) out.push({ start: s.start, end: start, color: s.color });
    if (s.end > end) out.push({ start: end, end: s.end, color: s.color });
  }
  out.push({ start, end, color });
  return normalizar(out);
}

/** Cor do trecho que cobre o índice `idx`, se houver. */
export function corEm(spans: TextSpan[] | undefined, idx: number): string | undefined {
  return spans?.find((s) => s.start <= idx && idx < s.end)?.color;
}

/**
 * Reposiciona os trechos depois de uma edição de conteúdo. Acha o prefixo e o
 * sufixo comuns; o miolo é a região editada. Trecho antes dela fica, trecho
 * depois desliza pelo delta, trecho que a atravessa mantém só as partes de fora.
 */
export function remapSpans(
  spans: TextSpan[] | undefined,
  oldText: string,
  newText: string,
): TextSpan[] | undefined {
  if (!spans?.length || oldText === newText) return spans;
  const maxP = Math.min(oldText.length, newText.length);
  let p = 0;
  while (p < maxP && oldText[p] === newText[p]) p++;
  let s = 0;
  while (s < maxP - p && oldText[oldText.length - 1 - s] === newText[newText.length - 1 - s]) s++;
  const oldEnd = oldText.length - s;
  const newEnd = newText.length - s;
  const delta = newEnd - oldEnd;

  const out: TextSpan[] = [];
  for (const sp of spans) {
    if (sp.end <= p) out.push({ ...sp });
    else if (sp.start >= oldEnd) out.push({ start: sp.start + delta, end: sp.end + delta, color: sp.color });
    else {
      if (sp.start < p) out.push({ start: sp.start, end: p, color: sp.color });
      if (sp.end > oldEnd) out.push({ start: newEnd, end: sp.end + delta, color: sp.color });
    }
  }
  const n = newText.length;
  return normalizar(
    out.map((x) => ({ ...x, start: Math.min(x.start, n), end: Math.min(x.end, n) })),
  );
}

export interface Trecho {
  start: number;
  end: number;
  /** `null` = sem cor própria, usa o preenchimento da camada. */
  color: string | null;
}

/** Divide [inicio, fim) em trechos contíguos: os com cor própria e os "buracos"
 *  entre eles. É a unidade de desenho de uma linha. */
export function trechosDe(inicio: number, fim: number, spans: TextSpan[] | undefined): Trecho[] {
  const out: Trecho[] = [];
  let cursor = inicio;
  const dentro = (spans ?? [])
    .filter((s) => s.end > inicio && s.start < fim)
    .sort((a, b) => a.start - b.start);
  for (const s of dentro) {
    const a = Math.max(s.start, inicio);
    const b = Math.min(s.end, fim);
    if (a > cursor) out.push({ start: cursor, end: a, color: null });
    if (b > a) out.push({ start: a, end: b, color: s.color });
    cursor = Math.max(cursor, b);
  }
  if (cursor < fim) out.push({ start: cursor, end: fim, color: null });
  return out;
}

/**
 * Índice em `content` → índice no texto EXIBIDO. O bullet acrescenta "•  " no
 * começo de cada linha não vazia, e os trechos precisam acompanhar esse
 * deslocamento para pintar as letras certas. Caixa alta não muda o tamanho.
 * Devolve `content.length + 1` posições (a última é o fim do texto).
 */
export function mapaParaExibicao(content: string, bullet: boolean): number[] {
  const mapa = new Array<number>(content.length + 1);
  if (!bullet) {
    for (let i = 0; i <= content.length; i++) mapa[i] = i;
    return mapa;
  }
  const PREFIXO = 3; // "•  "
  let offset = 0;
  for (let i = 0; i <= content.length; i++) {
    const inicioDeLinha = i === 0 || content[i - 1] === '\n';
    const linhaNaoVazia = i < content.length && content[i] !== '\n';
    if (inicioDeLinha && linhaNaoVazia) offset += PREFIXO;
    mapa[i] = i + offset;
  }
  return mapa;
}
