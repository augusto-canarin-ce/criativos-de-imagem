import { describe, it, expect } from 'vitest';
import {
  initHistory,
  commit,
  commitLive,
  endLive,
  undo,
  redo,
  canUndo,
  canRedo,
  HISTORY_LIMIT,
} from './patches';

interface Doc {
  n: number;
  label: string;
}

describe('histórico por patches', () => {
  it('commit empilha e undo/redo restauram', () => {
    let h = initHistory<Doc>({ n: 0, label: 'a' });
    h = commit(h, (d) => (d.n = 1));
    h = commit(h, (d) => (d.n = 2));
    expect(h.present.n).toBe(2);
    expect(canUndo(h)).toBe(true);

    h = undo(h);
    expect(h.present.n).toBe(1);
    h = undo(h);
    expect(h.present.n).toBe(0);
    expect(canUndo(h)).toBe(false);

    h = redo(h);
    expect(h.present.n).toBe(1);
    expect(canRedo(h)).toBe(true);
  });

  it('commit sem mudança não cria passo', () => {
    let h = initHistory<Doc>({ n: 0, label: 'a' });
    h = commit(h, () => {});
    expect(canUndo(h)).toBe(false);
  });

  it('novo commit limpa a pilha de redo', () => {
    let h = initHistory<Doc>({ n: 0, label: 'a' });
    h = commit(h, (d) => (d.n = 1));
    h = undo(h);
    h = commit(h, (d) => (d.n = 5));
    expect(canRedo(h)).toBe(false);
    expect(h.present.n).toBe(5);
  });

  it('commitLive funde o mesmo grupo em UM passo (arraste/slider)', () => {
    let h = initHistory<Doc>({ n: 0, label: 'a' });
    h = commitLive(h, 'drag', (d) => (d.n = 1));
    h = commitLive(h, 'drag', (d) => (d.n = 2));
    h = commitLive(h, 'drag', (d) => (d.n = 3));
    expect(h.present.n).toBe(3);
    expect(h.undo.length).toBe(1); // um só passo

    h = undo(h);
    expect(h.present.n).toBe(0); // volta tudo, não parte
    h = redo(h);
    expect(h.present.n).toBe(3); // refaz até o fim
  });

  it('endLive fecha o grupo: a próxima mudança vira outro passo', () => {
    let h = initHistory<Doc>({ n: 0, label: 'a' });
    h = commitLive(h, 'drag', (d) => (d.n = 1));
    h = endLive(h);
    h = commitLive(h, 'drag', (d) => (d.n = 2));
    expect(h.undo.length).toBe(2);
  });

  it('respeita o limite de passos', () => {
    let h = initHistory<Doc>({ n: 0, label: 'a' });
    for (let i = 1; i <= HISTORY_LIMIT + 20; i++) h = commit(h, (d) => (d.n = i));
    expect(h.undo.length).toBe(HISTORY_LIMIT);
  });

  it('não muta o estado anterior (imutabilidade)', () => {
    const h0 = initHistory<Doc>({ n: 0, label: 'a' });
    const h1 = commit(h0, (d) => (d.n = 9));
    expect(h0.present.n).toBe(0);
    expect(h1.present.n).toBe(9);
  });
});
