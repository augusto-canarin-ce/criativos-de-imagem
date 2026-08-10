import { describe, it, expect } from 'vitest';
import { fontStack, SYSTEM_FONT_OPTIONS } from './stacks';

describe('fontStack', () => {
  it('sans termina em sans-serif (não cai para serifada)', () => {
    const s = fontStack('Inter');
    expect(s.startsWith('Inter,')).toBe(true);
    expect(s.endsWith('sans-serif')).toBe(true);
  });

  it('serifada usa fallback serifado', () => {
    expect(fontStack('Georgia').endsWith('serif')).toBe(true);
  });

  it('monoespaçada usa fallback monoespaçado', () => {
    expect(fontStack('Courier New').endsWith('monospace')).toBe(true);
  });

  it('família com espaço vem entre aspas', () => {
    expect(fontStack('Times New Roman').startsWith('"Times New Roman",')).toBe(true);
  });

  it('família desconhecida assume sans', () => {
    expect(fontStack('Fonte Que Não Existe').endsWith('sans-serif')).toBe(true);
  });

  it('toda opção do seletor resolve numa pilha com fallback', () => {
    for (const opt of SYSTEM_FONT_OPTIONS) {
      expect(fontStack(opt.family).split(',').length).toBeGreaterThan(1);
    }
  });
});
