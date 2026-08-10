// Tabela de atalhos — fonte única da verdade (SPEC §14, revisada em 2026-08-07).
//
// Decisão do usuário: onde o Figma tem atalho equivalente, o Figma VENCE a tabela
// original da SPEC. Mudanças em relação à primeira versão da §14:
//   Elipse:            O           (era E)
//   Inserir imagem:    Cmd+Shift+K (era I)
//   Exportar os 3:     Cmd+Shift+E (era Cmd+E)
//   Paleta de comandos: Cmd+/      (era Cmd+K)
// Sem equivalente no Figma → mantém a SPEC (Shift+S safe zones, Shift+1/0 etc).
//
// `phase` marca quando o atalho passa a funcionar; o modal de atalhos (Fase 7)
// renderiza esta tabela e marca os ainda não ativos.

export interface ShortcutDef {
  keys: string;
  label: string;
  group: 'ferramentas' | 'edição' | 'pilha' | 'mover' | 'visualização' | 'app';
  phase: number; // fase em que entra em funcionamento
}

export const SHORTCUTS: ShortcutDef[] = [
  { keys: 'V', label: 'Selecionar', group: 'ferramentas', phase: 1 },
  { keys: 'T', label: 'Texto', group: 'ferramentas', phase: 1 },
  { keys: 'R', label: 'Retângulo', group: 'ferramentas', phase: 1 },
  { keys: 'O', label: 'Elipse', group: 'ferramentas', phase: 4 },
  { keys: 'L', label: 'Linha', group: 'ferramentas', phase: 4 },
  { keys: 'Cmd+Shift+K', label: 'Inserir imagem', group: 'ferramentas', phase: 1 },

  { keys: 'Cmd+Z / Cmd+Shift+Z', label: 'Desfazer / refazer', group: 'edição', phase: 1 },
  { keys: 'Cmd+D', label: 'Duplicar', group: 'edição', phase: 1 },
  { keys: 'Delete', label: 'Apagar camada', group: 'edição', phase: 1 },
  { keys: 'Cmd+G / Cmd+Shift+G', label: 'Agrupar / desagrupar', group: 'edição', phase: 4 },
  { keys: 'Cmd+C / Cmd+V', label: 'Copiar / colar objeto', group: 'edição', phase: 4 },
  { keys: 'Cmd+Alt+C / Cmd+Alt+V', label: 'Copiar / colar estilo', group: 'edição', phase: 4 },

  { keys: 'Cmd+] / Cmd+[', label: 'Uma posição na pilha', group: 'pilha', phase: 1 },
  { keys: 'Cmd+Shift+] / Cmd+Shift+[', label: 'Topo / fundo da pilha', group: 'pilha', phase: 1 },

  { keys: 'Setas', label: 'Mover 1px', group: 'mover', phase: 1 },
  { keys: 'Shift+Setas', label: 'Mover 10px', group: 'mover', phase: 1 },

  { keys: 'Shift+S', label: 'Safe zones', group: 'visualização', phase: 1 },
  { keys: 'Shift+G', label: 'Guias e réguas', group: 'visualização', phase: 8 },
  { keys: 'Shift+1', label: 'Ajustar à tela', group: 'visualização', phase: 1 },
  { keys: 'Shift+0', label: 'Zoom 100%', group: 'visualização', phase: 1 },

  { keys: 'Cmd+Shift+E', label: 'Exportar os 3', group: 'app', phase: 3 },
  // Paleta de comandos fica para depois do v1 — o modal a mostra como "em breve"
  // em vez de fingir que existe.
  { keys: 'Cmd+/', label: 'Paleta de comandos', group: 'app', phase: 8 },
  { keys: 'Cmd+,', label: 'Configurações', group: 'app', phase: 7 },
  { keys: '?', label: 'Este modal de atalhos', group: 'app', phase: 7 },
];
