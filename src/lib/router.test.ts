import { describe, expect, it } from 'vitest';
import { parseRoute } from './router';

// O hash é o que faz recarregar a página cair no mesmo lugar — inclusive no meio
// do modo guiado (§18), onde "fechar e voltar depois" é requisito.

describe('rotas', () => {
  it('reconhece as quatro telas', () => {
    expect(parseRoute('')).toEqual({ name: 'landing' });
    expect(parseRoute('#/')).toEqual({ name: 'landing' });
    expect(parseRoute('#/projetos')).toEqual({ name: 'dashboard' });
    expect(parseRoute('#/projetos/')).toEqual({ name: 'dashboard' });
    expect(parseRoute('#/p/abc-123')).toEqual({ name: 'editor', projectId: 'abc-123' });
  });

  it('modo guiado funciona com e sem projeto', () => {
    expect(parseRoute('#/rapido')).toEqual({ name: 'guided', projectId: null });
    expect(parseRoute('#/rapido/')).toEqual({ name: 'guided', projectId: null });
    expect(parseRoute('#/rapido/abc-123')).toEqual({ name: 'guided', projectId: 'abc-123' });
  });

  it('id com caractere especial sobrevive à ida e volta', () => {
    const id = 'a b/c';
    const rota = parseRoute(`#/rapido/${encodeURIComponent(id)}`);
    expect(rota).toEqual({ name: 'guided', projectId: id });
  });

  it('hash desconhecido cai na landing em vez de quebrar', () => {
    expect(parseRoute('#/qualquer-coisa')).toEqual({ name: 'landing' });
    expect(parseRoute('#/rapido/a/b/c')).toEqual({ name: 'landing' });
  });
});
