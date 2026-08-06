# Criativos

Editor de criativos estáticos para anúncios da Meta. Faz **uma coisa**: um criativo
de anúncio nos três formatos que a Meta pede (4:5, 1:1, 9:16), e faz rápido.

> **Nenhuma chave de API, nenhuma variável de ambiente.** Clonou, `npm install`,
> `npm run dev` — está rodando.
>
> **Nenhum dado sai do seu navegador.** Este app não faz nenhuma requisição a
> servidores além do carregamento de fontes. Seus projetos e imagens nunca saem do
> seu navegador.

## Requisitos

- Node.js 20+ (desenvolvido em Node 24)
- npm

## Rodar em desenvolvimento

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção estático em `dist/` |
| `npm run preview` | Serve o `dist/` localmente para conferência |
| `npm run typecheck` | Checagem de tipos (TypeScript `strict`) |
| `npm test` | Suíte de testes (Vitest) |

## Deploy estático

O app é um SPA puro, sem servidor e sem backend. O `build` gera arquivos estáticos
em `dist/` que sobem em qualquer hospedagem estática — GitHub Pages, Netlify, Vercel,
Cloudflare Pages ou um bucket qualquer. **Não há acoplamento a nenhuma plataforma:**
sem adaptador, sem arquivo de configuração específico, sem caminho absoluto assumindo
domínio.

```bash
npm run build
# suba o conteúdo de dist/ para onde quiser
```

### Base path (subdiretório)

Por padrão o app usa caminhos relativos (`base: './'`), o que funciona tanto na raiz
de um domínio quanto em subdiretório. Se a sua hospedagem exigir um caminho absoluto
com subpasta (caso comum no GitHub Pages), defina a variável `VITE_BASE` no build:

```bash
VITE_BASE=/criativos-de-imagem/ npm run build
```

Veja `.env.example`.

## Onde ficam meus dados

Tudo local, no seu navegador (IndexedDB para projetos e imagens; `localStorage`
apenas para preferências pequenas como tema). Limpar os dados do site apaga os
projetos — a exportação de backup em arquivo (roadmap) leva o trabalho para outra
máquina com segurança.

## Stack

Vite · React 19 · TypeScript `strict` · Tailwind · shadcn/ui · Zustand · Dexie
(IndexedDB) · Konva (canvas, a partir da Fase 1) · Zod · Vitest.

## Estado do projeto

Em construção por fases (ver `docs/SPEC.md` e `docs/PROGRESS.md`).
**Fase 0 — Fundação** concluída: modelo de dados versionado, persistência local e
dashboard de projetos (criar, renomear, duplicar, apagar). Sem canvas ainda.

## Licença

[MIT](./LICENSE).
