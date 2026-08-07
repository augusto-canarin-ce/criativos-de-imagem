// Seleção de arquivo de imagem por diálogo do sistema. O armazenamento em si fica
// em `lib/db/assets` (saveImageAsset). O pipeline completo da SPEC §12 (resize,
// dedup por hash, miniatura) entra na fase de imagens.

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/avif';

/** Abre o seletor de arquivo e resolve com os arquivos escolhidos (ou vazio). */
export function pickImageFiles(multiple = false): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPT;
    input.multiple = multiple;
    input.style.display = 'none';
    let settled = false;
    const done = (files: File[]) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(files);
    };
    input.addEventListener('change', () => done(input.files ? Array.from(input.files) : []));
    // Se o usuário cancelar, não há 'change'; resolvemos vazio ao focar de volta.
    window.addEventListener('focus', () => setTimeout(() => done([]), 300), { once: true });
    document.body.appendChild(input);
    input.click();
  });
}
