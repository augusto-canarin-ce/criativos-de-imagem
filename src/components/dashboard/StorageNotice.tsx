import { useEffect, useState } from 'react';
import { HardDrive, TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUi } from '@/lib/store/ui';
import { formatBytes } from '@/components/dialogs/SettingsDialog';

const KEY = 'criativos:storage-notice-dismissed';
const QUOTA_WARN_PCT = 80;

// Aviso honesto na primeira execução, não escondido nas configurações (§12): os
// projetos ficam neste navegador, limpar os dados apaga tudo, e existe backup.
// Uma linha, sem alarmismo, com o caminho para a exportação.
//
// Acima de 80% da cota, o aviso muda de tom e passa a ser sempre visível — nesse
// ponto o risco deixou de ser teórico (§12).

export function StorageNotice({ onExportAll }: { onExportAll?: () => void }) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(KEY) === '1');
  const [quota, setQuota] = useState<{ usage: number; quota: number } | null>(null);

  useEffect(() => {
    void navigator.storage?.estimate?.().then((e) => {
      if (e.usage != null && e.quota != null) setQuota({ usage: e.usage, quota: e.quota });
    });
  }, []);

  const pct = quota && quota.quota > 0 ? (quota.usage / quota.quota) * 100 : 0;
  const nearFull = pct >= QUOTA_WARN_PCT;

  if (dismissed && !nearFull) return null;

  function dismiss() {
    localStorage.setItem(KEY, '1');
    setDismissed(true);
  }

  if (nearFull) {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning-soft p-3 text-sm">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-deep" />
        <div className="flex-1">
          <p className="text-warning-deep">
            O armazenamento deste navegador está em {pct.toFixed(0)}% (
            {formatBytes(quota!.usage)} de {formatBytes(quota!.quota)}). Guarde uma cópia
            dos projetos antes que o navegador comece a recusar gravações.
          </p>
          {onExportAll && (
            <Button variant="outline" size="sm" className="mt-2" onClick={onExportAll}>
              Exportar todos agora
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-hairline bg-elevated/60 p-3 text-sm">
      <HardDrive className="mt-0.5 size-4 shrink-0 text-mute" />
      <p className="flex-1 text-mute">
        Seus projetos ficam salvos <strong className="text-ink">neste navegador</strong> e
        nunca saem dele. Limpar os dados do site apaga tudo —{' '}
        <button
          className="text-emerald-deep underline underline-offset-2"
          onClick={onExportAll}
        >
          exportar todos
        </button>{' '}
        guarda uma cópia fora daqui.{' '}
        <button
          className="text-emerald-deep underline underline-offset-2"
          onClick={() => useUi.getState().setSettingsOpen(true)}
        >
          Ver espaço usado
        </button>
        .
      </p>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        onClick={dismiss}
        aria-label="Dispensar aviso"
      >
        <X />
      </Button>
    </div>
  );
}
