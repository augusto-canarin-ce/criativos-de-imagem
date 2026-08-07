# PROGRESS

Registro de progresso por fase. Atualizado ao fim de cada fase, conforme SPEC §15.

---

## Interlúdio pós-Fase 1 — Linguagem visual (design system)  ✅

Aplicada a linguagem visual do DS "Conversão Extrema" v2.1 à interface (decisão do
usuário): tokens (`@theme` + semânticos temáveis em canais RGB), tipografia Geist
Sans **empacotada via fontsource** (offline, sem Google Fonts), escopo `.ds-app` de
densidade, acento esmeralda com parcimônia, hairlines de 1px no lugar de sombras.
**Sem a marca/logo** — repo público. Componentes Radix/shadcn mantidos, só as
classes migradas ao vocabulário novo (`surface`, `ink`, `mute`, `hairline`…).

Decisões: CTA "Exportar os 3" com a variante contida do shiny (grafite + anel
esmeralda, sem animação — hierarquia por exceção); seleção/transformer em esmeralda;
safe zone recolorida para azul `info` (não confundir com seleção); "Geist Sans"
virou a primeira opção de fonte do canvas e o padrão de camada nova — é a única
família realmente empacotada, render determinístico. Pilha de fallback por genérico
(`lib/fonts/stacks`) preservada.

---

## FASE 1 — Canvas e edição  ✅ concluída

Objetivo: editor funcional sobre o formato base. Konva num único Layer com Groups.
Fundo, imagem, texto e retângulo. Seleção, transformer, painel de camadas, inspector
básico, undo/redo, salvamento automático. **Sem multiformato ainda** (Fase 2) e
**sem export** (Fase 3).

### Tarefas

- [x] Roteamento por hash (`#/` dashboard, `#/p/:id` editor); reload reabre o projeto
- [x] Store do editor (Zustand): projeto ativo, seleção, ferramenta
- [x] Undo/redo por patches do Immer (`lib/history`), limite 100, arraste/slider = 1 passo
- [x] Salvamento automático debounced 800ms (IndexedDB), com flush ao sair
- [x] Canvas Konva: **um único Layer** com Groups por camada; fundo do Layout
- [x] Render de imagem (cover/contain não destrutivo), texto e retângulo — helpers puros
- [x] Seleção (clique, shift, clique no vazio limpa) + Transformer (redimensiona/rotaciona)
- [x] Zoom (Ctrl/Cmd+scroll, botões, ajustar, 100%) e pan (espaço+arrasto, scroll)
- [x] Edição de texto no canvas via `<textarea>` sobreposto (acentuação/IME, Esc/Enter)
- [x] Painel de camadas: selecionar, visibilidade, cadeado, renomear, apagar, reordenar
- [x] Inspector por tipo (um arquivo cada): comum, texto, imagem, forma + fundo
- [x] Toolbar: ferramentas (V/T/R/I), inserir, desfazer/refazer, zoom, safe zone
- [x] Atalhos essenciais: V/T/R/I, undo/redo, Delete, Cmd+D, Cmd+]/[, setas para mover
- [x] Upload/drag-drop de imagem → Asset no IndexedDB (pipeline completo §12 → fase de imagens)
- [x] Testes das funções puras (history, cover, layer factory) — 32 testes no total

### Aceite (SPEC §15) — ✅ verificado no navegador

Montado um criativo 4:5 com foto de fundo (cover), título ("Promoção de inauguração",
com acentos preservados) e botão retangular; reload real reabriu o projeto com **tudo
idêntico** (3 camadas, imagem recarregada do IndexedDB). Undo/redo testados.

### Decisões e notas

- **Ferramenta tem prioridade sobre seleção:** clicar com T/R insere no ponto mesmo
  por cima de uma camada (senão uma foto de fundo full-bleed bloquearia a inserção).
  A camada só captura o clique com a ferramenta Seleção ativa.
- **Fonte "Inter":** ainda cai para a fonte-padrão do sistema (serifada) — a curadoria
  via fontsource entra na Fase 5. Sem impacto no modelo.
- **Bundle 876 kB** (Konva). Code-splitting/lazy do editor fica para o acabamento.
- **Pipeline de assets §12** (resize 2560, dedup por hash, miniatura) adiado para a
  fase de imagens; hoje o blob é guardado como veio. Modelo já é o final.
- Miniatura de 24px por camada: ícone por tipo por ora; render real depois.

---

## FASE 0 — Fundação  ✅ concluída

Objetivo: base do projeto rodando, modelo de dados versionado, persistência local e
dashboard de projetos. **Sem canvas ainda.**

### Tarefas

- [x] Scaffolding Vite + React 19 + TypeScript `strict`
- [x] Tailwind + utilitários shadcn/ui (Button, Input, Dialog, DropdownMenu, AlertDialog)
- [x] Tema escuro por padrão (cinza neutro dessaturado), tema claro nas preferências
- [x] `lib/model/types.ts` — todos os tipos da SPEC §6
- [x] `lib/model/schema.ts` — schemas zod espelhados
- [x] `lib/model/migrations.ts` — versionamento de schema desde o commit 1
- [x] `config/formats.ts` — os três formatos, e só os três
- [x] `config/safeAreas.ts` — safe zones editáveis + perfil Reels do 9:16
- [x] `lib/db/dexie.ts` — tabelas `projects`, `assets`, `brandKits`, `templates`, `settings`
- [x] `lib/db/projects.ts` — CRUD: criar, ler, renomear, duplicar, apagar
- [x] `lib/store` — preferências (tema, último formato) via localStorage
- [x] Dashboard: grade de projetos, criar, renomear, duplicar, apagar (com confirmação)
- [x] Salvamento sobrevive ao reload (IndexedDB) — verificado no navegador
- [x] `LICENSE` (MIT) + campo `license` no `package.json`
- [x] `README.md` com instalação, deploy genérico e as duas frases de adoção
- [x] `base` do Vite por variável de ambiente (raiz ou subdiretório)
- [x] Vitest configurado + testes (factory, migrações, CRUD) — 17 testes passando

### Aceite (SPEC §15) — ✅ verificado

Criar, renomear, duplicar e apagar projetos; sobrevive ao reload. Testado no
navegador (criar → duplicar → reload mantém tudo) e em testes unitários.

### Pendente / próximas fases

- `config/shortcuts.ts` entra na Fase 1 (não há editor ainda para atalhar).
- Stubs de `assets`/`brandKits`/`templates`: sem CRUD real nesta fase.
- Exportação de backup `.criativo` mencionada na UI ("em breve") — Fase 3.

### Decisões tomadas no caminho

- **Tailwind v4** com plugin oficial `@tailwindcss/vite` (sem `tailwind.config.js`;
  tema via `@theme` no CSS). shadcn/ui em modo manual (componentes copiados em
  `components/ui`), sem rodar a CLI interativa.
- **IDs** via `crypto.randomUUID()` — sem dependência extra.
- **Reatividade do dashboard** via `dexie-react-hooks` (`useLiveQuery`).
- Stubs vazios para `assets`/`brandKits`/`templates` nas próximas fases; nesta fase
  só `projects` tem CRUD real.
