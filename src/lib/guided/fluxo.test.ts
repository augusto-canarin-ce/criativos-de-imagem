import { describe, expect, it } from 'vitest';
import { initHistory, commit, amendPresent, undo, canUndo } from '@/lib/history/patches';

// O estado do fluxo guiado mora no projeto (§18) para sobreviver a fechar a aba.
// Mas NAVEGAR não é editar: se cada tela virasse passo de histórico, "Desfazer"
// no editor voltaria telas do fluxo em vez de desfazer o trabalho.

interface Doc {
  guided?: { screen: number };
  texto: string;
}

describe('estado do fluxo guiado no histórico', () => {
  it('mudar de tela não cria passo de desfazer', () => {
    let h = initHistory<Doc>({ guided: { screen: 0 }, texto: 'a' });
    h = amendPresent(h, (d) => {
      if (d.guided) d.guided.screen = 3;
    });
    expect(h.present.guided?.screen).toBe(3);
    expect(canUndo(h)).toBe(false);
    expect(h.undo).toHaveLength(0);
  });

  it('desfazer uma edição não arrasta a tela atual junto', () => {
    let h = initHistory<Doc>({ guided: { screen: 0 }, texto: 'a' });
    h = commit(h, (d) => {
      d.texto = 'b';
    });
    h = amendPresent(h, (d) => {
      if (d.guided) d.guided.screen = 4;
    });

    h = undo(h);
    // O texto voltou…
    expect(h.present.texto).toBe('a');
    // …e a pessoa continua na mesma tela do fluxo.
    expect(h.present.guided?.screen).toBe(4);
  });

  it('sem mudança efetiva, o presente permanece o mesmo objeto', () => {
    const h = initHistory<Doc>({ guided: { screen: 2 }, texto: 'a' });
    const igual = amendPresent(h, (d) => {
      if (d.guided) d.guided.screen = 2;
    });
    expect(igual.present).toBe(h.present);
  });

  it('encerrar o fluxo apaga o estado sem virar passo de histórico', () => {
    let h = initHistory<Doc>({ guided: { screen: 2 }, texto: 'a' });
    h = amendPresent(h, (d) => {
      delete d.guided;
    });
    expect(h.present.guided).toBeUndefined();
    expect(canUndo(h)).toBe(false);
  });
});
