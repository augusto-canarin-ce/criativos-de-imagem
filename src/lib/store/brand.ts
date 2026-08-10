import { create } from 'zustand';
import type { BrandKit } from '@/lib/model/types';
import { resolveBrandColor, resolveBrandFont } from '@/lib/brand/tokens';

// Brand kit ATIVO do projeto aberto. Duas faces do mesmo dado:
//
// 1. store zustand — os componentes de render leem por hook, então trocar de kit
//    re-renderiza o canvas inteiro na hora (é o aceite da Fase 6).
// 2. espelho module-level — o medidor de texto (lib/render/measureText) e a
//    invariante de altura rodam FORA do React e precisam da mesma resolução.
//    Mantido em sincronia pelo próprio setter; nunca escreva nele direto.

interface BrandState {
  kit: BrandKit | null;
}

export const useBrandStore = create<BrandState>(() => ({ kit: null }));

let activeKit: BrandKit | null = null;

export function setActiveBrandKit(kit: BrandKit | null): void {
  activeKit = kit;
  useBrandStore.setState({ kit });
}

/** Kit ativo para código não-React (medidor de texto, funções puras de layout). */
export function getActiveBrandKit(): BrandKit | null {
  return activeKit;
}

/** Resolve cor considerando o kit ativo — versão não reativa. */
export function resolveColorNow(value: string): string {
  return resolveBrandColor(value, activeKit);
}

/** Resolve família considerando o kit ativo — versão não reativa (medidor). */
export function resolveFontNow(family: string): string {
  return resolveBrandFont(family, activeKit);
}

/** Hook reativo: componentes de render usam para o Konva reagir à troca de kit. */
export function useBrandKit(): BrandKit | null {
  return useBrandStore((s) => s.kit);
}
