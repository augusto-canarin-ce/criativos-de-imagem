import { create } from 'zustand';
import type { SnapGuide } from '@/lib/layout/snapping';

// Guias de snapping transitórias — aparecem SÓ durante o arraste (§8). Fora do
// histórico e fora do estado do editor: é feedback de gesto, não dado.

interface SnapGuidesState {
  guides: SnapGuide[];
}

export const useSnapGuides = create<SnapGuidesState>(() => ({ guides: [] }));

export function setSnapGuides(guides: SnapGuide[]): void {
  useSnapGuides.setState({ guides });
}

export function clearSnapGuides(): void {
  if (useSnapGuides.getState().guides.length) useSnapGuides.setState({ guides: [] });
}
