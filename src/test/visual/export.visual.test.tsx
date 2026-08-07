import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createRoot } from 'react-dom/client';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import type Konva from 'konva';
import type { FormatId, Layout } from '@/lib/model/types';
import { getFormat } from '@/config/formats';
import { ExportStage } from '@/components/canvas/ExportStage';
import { FIXTURES, seedFixtureAssets } from './fixtures';

// Regressão visual do export (SPEC §16). Renderiza o ExportStage REAL (a mesma
// cena do preview), compara pixel a pixel com a referência no repositório.
// Tolerância: 0.1% dos pixels. Falha = alguém mudou o render — se foi de
// propósito, rode `npm run test:visual:update` e revise o diff da imagem no git.

const REFS_DIR = path.join(__dirname, '__refs__');
const UPDATE = process.env.UPDATE_REFS === '1';
const TOLERANCE = 0.001; // 0.1%

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = false;

async function renderFixture(formatId: FormatId, layout: Layout): Promise<Konva.Stage> {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  const stage = await new Promise<Konva.Stage>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('ExportStage não ficou pronto em 15s')), 15_000);
    root.render(
      <ExportStage
        formatId={formatId}
        layout={layout}
        onReady={(_, s) => {
          clearTimeout(timeout);
          resolve(s);
        }}
      />,
    );
  });
  return stage;
}

function pixelsOf(canvas: HTMLCanvasElement): { data: Uint8ClampedArray; w: number; h: number } {
  const ctx = canvas.getContext('2d')!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { data: img.data, w: canvas.width, h: canvas.height };
}

function writeRef(name: string, data: Uint8ClampedArray, w: number, h: number): void {
  const png = new PNG({ width: w, height: h });
  png.data = Buffer.from(data);
  fs.mkdirSync(REFS_DIR, { recursive: true });
  fs.writeFileSync(path.join(REFS_DIR, `${name}.png`), PNG.sync.write(png));
}

beforeAll(() => {
  seedFixtureAssets();
});

describe('regressão visual do export (4:5, tamanho real)', () => {
  for (const { name, build } of FIXTURES) {
    it(name, async () => {
      const stage = await renderFixture('4:5', build());
      const canvas = stage.toCanvas({ pixelRatio: 1 });

      // Aceite da Fase 3: dimensões EXATAS do formato.
      const format = getFormat('4:5');
      expect(canvas.width).toBe(format.width);
      expect(canvas.height).toBe(format.height);

      const { data, w, h } = pixelsOf(canvas);

      const refPath = path.join(REFS_DIR, `${name}.png`);
      if (UPDATE || !fs.existsSync(refPath)) {
        writeRef(name, data, w, h);
        if (!UPDATE) {
          throw new Error(
            `Referência "${name}.png" não existia — foi gerada agora. Revise a imagem e comite.`,
          );
        }
        return;
      }

      const ref = PNG.sync.read(fs.readFileSync(refPath));
      expect(ref.width).toBe(w);
      expect(ref.height).toBe(h);

      const diffPixels = pixelmatch(ref.data, Buffer.from(data), undefined, w, h, {
        threshold: 0.1,
      });
      const ratio = diffPixels / (w * h);
      if (ratio > TOLERANCE) {
        writeRef(`${name}.actual`, data, w, h);
        throw new Error(
          `"${name}" divergiu ${(ratio * 100).toFixed(3)}% dos pixels (limite 0.1%). ` +
            `Compare __refs__/${name}.png com __refs__/${name}.actual.png.`,
        );
      }
    });
  }

  it('os três formatos exportam nas dimensões exatas', async () => {
    for (const id of ['4:5', '1:1', '9:16'] as const) {
      const stage = await renderFixture(id, FIXTURES[0].build());
      const canvas = stage.toCanvas({ pixelRatio: 1 });
      const f = getFormat(id);
      expect([canvas.width, canvas.height]).toEqual([f.width, f.height]);
    }
  });
});
