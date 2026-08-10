import { useState } from 'react';
import { Loader2, Search, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  searchGoogleCatalog,
  loadGoogleFont,
  type GoogleFontEntry,
} from '@/lib/fonts/googleFonts';
import { saveFontAsset } from '@/lib/fonts/userFonts';

// Busca no Google Fonts (§9) + envio de fonte própria. A busca filtra o catálogo
// LOCAL (vendorizado — funciona offline); só o carregamento da fonte escolhida vai
// à rede, e quando falha a mensagem é clara e imediata (§3).

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPicked: (family: string, weights: number[]) => void;
}

export function FontSearchDialog({ open, onOpenChange, onPicked }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const results = searchGoogleCatalog(query);

  async function choose(entry: GoogleFontEntry) {
    setError(null);
    setLoading(entry.family);
    try {
      // Carrega um conjunto útil: regular + os pesados disponíveis.
      const wanted = [400, 700, 800, 900].filter((w) => entry.weights.includes(w));
      const weights = wanted.length ? wanted : entry.weights.slice(0, 2);
      await loadGoogleFont(entry.family, weights);
      onPicked(entry.family, weights);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar a fonte.');
    } finally {
      setLoading(null);
    }
  }

  function uploadFont() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ttf,.otf,.woff,.woff2';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setError(null);
      try {
        const asset = await saveFontAsset(file);
        onPicked(asset.name, [400]);
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fonte inválida.');
      }
    };
    input.click();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buscar fonte</DialogTitle>
          <DialogDescription>
            Catálogo do Google Fonts — o download acontece só ao escolher. Ou envie a sua
            (.ttf, .otf, .woff2).
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-mute" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex.: Lobster, Archivo, Cabin…"
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="sm" onClick={uploadFont} title="Enviar fonte própria">
            <Upload /> Enviar
          </Button>
        </div>

        {error && (
          <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger-deep">{error}</p>
        )}

        <ul className="max-h-64 overflow-y-auto">
          {results.map((entry) => (
            <li key={entry.family}>
              <button
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-ink/10 disabled:opacity-50"
                disabled={loading !== null}
                onClick={() => void choose(entry)}
              >
                <span>{entry.family}</span>
                <span className="flex items-center gap-2 text-xs text-mute">
                  {entry.category}
                  {loading === entry.family && <Loader2 className="size-3.5 animate-spin" />}
                </span>
              </button>
            </li>
          ))}
          {query.trim().length >= 2 && results.length === 0 && (
            <li className="px-2 py-3 text-sm text-mute">Nada encontrado para “{query}”.</li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
