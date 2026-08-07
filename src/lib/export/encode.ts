// Codificação do canvas final (SPEC §11). PNG sem perdas; JPG com qualidade 0.92
// e fallback progressivo 0.85 → 0.80 enquanto o arquivo passar de 30MB (limite da
// Meta). Sem fundo transparente — o background do Layout é sempre opaco.

export const META_MAX_BYTES = 30 * 1024 * 1024;
const JPG_QUALITY_LADDER = [0.92, 0.85, 0.8];

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao codificar a imagem.'))),
      type,
      quality,
    );
  });
}

export async function encodePng(canvas: HTMLCanvasElement): Promise<Blob> {
  return canvasToBlob(canvas, 'image/png');
}

/** JPG na qualidade pedida, ou — sem qualidade explícita — descendo a escada
 *  0.92/0.85/0.80 até caber nos 30MB. Nunca lança por tamanho: devolve o menor. */
export async function encodeJpg(canvas: HTMLCanvasElement, quality?: number): Promise<Blob> {
  if (quality !== undefined) return canvasToBlob(canvas, 'image/jpeg', quality);
  let last: Blob | null = null;
  for (const q of JPG_QUALITY_LADDER) {
    last = await canvasToBlob(canvas, 'image/jpeg', q);
    if (last.size <= META_MAX_BYTES) return last;
  }
  return last!;
}
