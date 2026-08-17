import type Konva from 'konva';
import { SUPERSAMPLE } from './encode';

// Rasterização do palco de export (SPEC §11). Um caminho só: diálogo de export,
// export em lote e testes visuais passam por aqui.

/**
 * Canvas final de um formato, no tamanho nativo da Meta.
 *
 * Com `fator > 1` o palco é rasterizado ampliado e reduzido de volta com
 * `imageSmoothingQuality: 'high'` — supersampling. O ganho está no que é
 * VETORIAL (texto, cantos arredondados, traços): a borda de cada glifo passa a
 * ser calculada com mais amostras por pixel. Foto não perde nada: reduzir de
 * volta ao tamanho de origem é uma operação neutra.
 *
 * Os testes visuais chamam com `fator = 1` — eles conferem a composição da cena,
 * não a reamostragem, e o ambiente headless não garante a mesma suavização do
 * navegador.
 */
export function rasterizeStage(
  stage: Konva.Stage,
  width: number,
  height: number,
  fator: number = SUPERSAMPLE,
): HTMLCanvasElement {
  const bruto = stage.toCanvas({ pixelRatio: fator });
  if (fator === 1) return bruto;

  const destino = document.createElement('canvas');
  destino.width = width;
  destino.height = height;
  const ctx = destino.getContext('2d');
  if (!ctx) return bruto; // sem contexto 2d não há como reduzir; entrega o bruto
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bruto, 0, 0, width, height);
  return destino;
}
