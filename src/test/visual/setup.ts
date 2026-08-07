// Setup da suíte visual: jsdom usa o pacote `canvas` (node-canvas) como
// implementação do <canvas>, então o Konva desenha DE VERDADE. Garante rAF
// (o ExportStage sincroniza a prontidão por dois quadros).

if (typeof globalThis.requestAnimationFrame !== 'function') {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number =>
    setTimeout(() => cb(performance.now()), 0) as unknown as number;
  globalThis.cancelAnimationFrame = (id: number): void => clearTimeout(id);
}
