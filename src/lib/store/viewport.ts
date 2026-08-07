import { create } from 'zustand';

// Estado de zoom/pan do canvas. Separado do editor porque não faz parte do
// histórico nem é persistido — é só a câmera sobre o criativo.

const MIN_SCALE = 0.05;
const MAX_SCALE = 8;
const FIT_MARGIN = 0.92;

function clampScale(s: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
}

interface ViewportState {
  scale: number;
  x: number;
  y: number;
  container: { w: number; h: number };
  content: { w: number; h: number };

  setContainer: (w: number, h: number) => void;
  setContent: (w: number, h: number) => void;
  fit: () => void;
  reset100: () => void;
  zoomBy: (factor: number, center?: { x: number; y: number }) => void;
  setPan: (x: number, y: number) => void;
}

function centered(scale: number, container: { w: number; h: number }, content: { w: number; h: number }) {
  return {
    x: (container.w - content.w * scale) / 2,
    y: (container.h - content.h * scale) / 2,
  };
}

export const useViewport = create<ViewportState>((set, get) => ({
  scale: 1,
  x: 0,
  y: 0,
  container: { w: 1, h: 1 },
  content: { w: 1080, h: 1350 },

  setContainer: (w, h) => set({ container: { w, h } }),
  setContent: (w, h) => set({ content: { w, h } }),

  fit: () => {
    const { container, content } = get();
    const scale = clampScale(Math.min(container.w / content.w, container.h / content.h) * FIT_MARGIN);
    set({ scale, ...centered(scale, container, content) });
  },
  reset100: () => {
    const { container, content } = get();
    set({ scale: 1, ...centered(1, container, content) });
  },
  zoomBy: (factor, center) => {
    const { scale, x, y, container } = get();
    const next = clampScale(scale * factor);
    const c = center ?? { x: container.w / 2, y: container.h / 2 };
    // Mantém o ponto sob o cursor fixo ao ampliar/reduzir.
    const ratio = next / scale;
    set({ scale: next, x: c.x - (c.x - x) * ratio, y: c.y - (c.y - y) * ratio });
  },
  setPan: (x, y) => set({ x, y }),
}));
