import { useEffect } from 'react';
import { useEditor, selectProject } from '@/lib/store/editor';
import { setActiveBrandKit } from '@/lib/store/brand';
import { getBrandKit } from '@/lib/db/brand';
import { loadFontsForFamilies } from '@/lib/fonts/loader';

// Mantém o brand kit ATIVO em sincronia com `project.brandKitId` (§10: múltiplos
// kits, um ativo por projeto). Ao trocar de kit, também garante que as fontes dos
// papéis estejam carregadas — senão o texto com token `brand.display` cairia no
// fallback silenciosamente, que é o pior bug possível deste app (§9).

export function useActiveBrandKit(): void {
  const brandKitId = useEditor((s) => selectProject(s)?.brandKitId);

  useEffect(() => {
    let cancelled = false;
    if (!brandKitId) {
      setActiveBrandKit(null);
      return;
    }
    void (async () => {
      const kit = await getBrandKit(brandKitId);
      if (cancelled) return;
      setActiveBrandKit(kit ?? null);
      if (kit) await loadFontsForFamilies(kit.fonts.map((f) => f.family));
    })();
    return () => {
      cancelled = true;
    };
  }, [brandKitId]);
}
