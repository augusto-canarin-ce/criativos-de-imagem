// Sanitização de SVG (SPEC §12): SVG de terceiros é vetor de ataque. Remove
// <script>, <foreignObject>, atributos on* e URLs javascript:. Roda no browser
// (DOMParser); o arquivo é guardado já limpo.

export function sanitizeSvg(text: string): string {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('SVG inválido ou corrompido.');
  }

  doc.querySelectorAll('script, foreignObject').forEach((n) => n.remove());

  for (const el of Array.from(doc.querySelectorAll('*'))) {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith('on')) el.removeAttribute(attr.name);
      else if ((name === 'href' || name === 'xlink:href') && value.startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    }
  }

  return new XMLSerializer().serializeToString(doc);
}
