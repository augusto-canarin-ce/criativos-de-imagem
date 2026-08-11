import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Stage, Layer as KonvaLayer } from 'react-konva';
import type { Template } from '@/lib/model/types';
import { loadBuiltinTemplates, projectFromTemplate } from '@/lib/db/templates';
import { GUIDED_OBJECTIVES } from '@/config/guided';
import { getFormat } from '@/config/formats';
import { StageScene } from '@/components/canvas/StageScene';
import { db } from '@/lib/db/dexie';
import { listBrandKits } from '@/lib/db/brand';
import { goToGuided } from '@/lib/router';
import { Pergunta } from '../GuidedChrome';

// PASSO 1 (§18): quatro objetivos, um modelo cada — não os doze. Uma decisão por
// tela vale aqui também, e uma grade de doze é o que faz este público desistir.
//
// O projeto NASCE aqui. Do passo 2 em diante já é um projeto normal, listado no
// dashboard, e sair para o editor a qualquer momento não perde nada.

const THUMB_W = 168;

function Miniatura({ template }: { template: Template }) {
  const layout = template.project.layouts[template.project.baseFormat];
  const format = getFormat(layout.formatId);
  const scale = THUMB_W / format.width;
  return (
    <Stage width={THUMB_W} height={format.height * scale} listening={false}>
      <KonvaLayer scaleX={scale} scaleY={scale}>
        <StageScene
          format={format}
          layout={layout}
          showSafeArea={false}
          interactive={false}
          chrome={false}
        />
      </KonvaLayer>
    </Stage>
  );
}

export function EscolherModelo() {
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    void loadBuiltinTemplates()
      .then(setTemplates)
      .catch(() => {
        setTemplates([]);
        setErro('Não consegui carregar os modelos. Recarregue a página e tente de novo.');
      });
  }, []);

  async function escolher(template: Template) {
    if (criando) return;
    setCriando(true);
    try {
      // Aqui não há projeto aberto de onde herdar a marca; se a pessoa já tem
      // uma marca salva, o criativo já nasce com as cores e fontes dela (§10).
      const kits = await listBrandKits().catch(() => []);
      const { project } = projectFromTemplate(template, {
        guided: true,
        brandKitId: kits[0]?.id,
      });
      project.guided = { screen: 0, templateId: template.id };
      await db.projects.add(project);
      goToGuided(project.id);
    } catch {
      setErro('Não consegui começar o criativo. Tente de novo.');
      setCriando(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Pergunta dica="Escolha o que mais parece com o que você quer anunciar. Dá para trocar tudo depois.">
        O que você quer anunciar?
      </Pergunta>

      {erro && (
        <p className="mb-6 rounded-lg bg-danger-soft px-4 py-3 text-base text-danger-deep">{erro}</p>
      )}

      {templates === null ? (
        <p className="flex items-center gap-2 py-10 text-lg text-mute">
          <Loader2 className="size-5 animate-spin" /> Carregando…
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {GUIDED_OBJECTIVES.map((objetivo) => {
            const template = templates.find((t) => t.id === objetivo.templateId);
            if (!template) return null;
            return (
              <li key={objetivo.category}>
                <button
                  type="button"
                  disabled={criando}
                  aria-label={`${objetivo.label} — ${objetivo.description}`}
                  onClick={() => void escolher(template)}
                  className="group flex h-full w-full flex-col items-center gap-4 rounded-2xl border border-hairline bg-surface p-5 text-center transition-all hover:-translate-y-0.5 hover:border-emerald hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/50 disabled:opacity-50"
                >
                  <span className="overflow-hidden rounded-lg ring-1 ring-hairline">
                    <Miniatura template={template} />
                  </span>
                  <span>
                    <span className="block text-xl font-semibold text-ink">{objetivo.label}</span>
                    <span className="mt-1.5 block text-base leading-snug text-mute">
                      {objetivo.description}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
