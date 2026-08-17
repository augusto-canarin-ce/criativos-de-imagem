# Criativos

Editor de criativos estáticos para anúncios da Meta. Faz **uma coisa**: um criativo
de anúncio nos três formatos que a Meta pede — 4:5 (Feed vertical), 1:1 (Feed
quadrado) e 9:16 (Stories/Reels) — e faz rápido.

> **Nenhuma chave de API, nenhuma variável de ambiente.** Clonou, `npm install`,
> `npm run dev` — está rodando.
>
> **Nenhum dado sai do seu navegador.** Este app não faz nenhuma requisição a
> servidores além do carregamento de fontes. Seus projetos e imagens nunca saem do
> seu navegador.

## Rodar

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. Requer Node.js 20+ (desenvolvido em Node 24).

## O que ele faz

- **Um criativo, três formatos.** Você desenha no formato base e os outros dois se
  adaptam — por âncoras verticais, não por escala: o texto sai do mesmo tamanho nos
  três, mudando só onde se apoia. Ajustou um formato na mão? Só ele para de seguir a
  base, e um clique reconecta.
- **Modo comparar.** Os três lado a lado, ao vivo, com a edição no formato base
  propagando na hora.
- **Placeholders de imagem.** Espaços rotulados ("Foto do produto") que se preenchem
  arrastando fotos — inclusive várias de uma vez, na ordem de leitura. É o que
  transforma um criativo pronto em modelo reutilizável.
- **Marca.** Cores e fontes viram tokens: trocar o brand kit atualiza o criativo
  inteiro de uma vez. Múltiplas marcas, exportáveis em arquivo com os logos.
- **Modelos.** 12 de fábrica por objetivo (promoção, lançamento, prova social,
  institucional) e os seus próprios.
- **Exportação.** PNG e JPG em tamanho real, os três em ZIP, com checklist de avisos
  (placeholder vazio, contraste baixo, fonte pequena, imagem ampliada…) que informa
  sem bloquear.
- **Tipografia.** ~30 fontes empacotadas para uso offline, busca no catálogo do
  Google Fonts e envio da sua própria fonte.

Não tem — e não vai ter: vídeo, animação, IA, colaboração em tempo real, carrossel,
login. A lista completa está em [`docs/SPEC.md`](docs/SPEC.md) §3.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção estático em `dist/` |
| `npm run preview` | Serve o `dist/` localmente para conferência |
| `npm run typecheck` | Checagem de tipos (TypeScript `strict`) |
| `npm test` | Suíte de testes (Vitest) |
| `npm run test:visual` | Regressão visual do export (compara com as referências) |
| `npm run test:visual:update` | Regenera as imagens de referência — revise o diff |

## Deploy estático

O app é um SPA puro, sem servidor e sem backend. O build gera arquivos estáticos em
`dist/` que sobem em qualquer hospedagem estática — GitHub Pages, Netlify, Vercel,
Cloudflare Pages ou um bucket qualquer. **Não há acoplamento a nenhuma plataforma:**
sem adaptador, sem arquivo de configuração específico, sem caminho absoluto
assumindo domínio.

```bash
npm run build
# suba o conteúdo de dist/ para onde quiser
```

### Base path (subdiretório)

Por padrão o app usa caminhos relativos (`base: './'`), o que funciona tanto na raiz
de um domínio quanto em subdiretório. Se a sua hospedagem exigir caminho absoluto com
subpasta (caso comum no GitHub Pages), defina `VITE_BASE` no build:

```bash
VITE_BASE=/criativos-de-imagem/ npm run build
```

Veja `.env.example`. O app usa roteamento por hash (`#/`), então não precisa de
regra de rewrite no servidor.

### Cloudflare Pages

Há um `wrangler.toml` no repositório, mas ele é só conveniência — nenhum código
depende dele, e apagar o arquivo não muda o build. Duas formas:

**Automático (recomendado):** no painel do Cloudflare, *Workers & Pages → Create →
Pages → Connect to Git*, aponte para o repositório e use:

| Campo | Valor |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Variável de ambiente | `VITE_BASE` = `/` |

Cada `git push` na `main` publica sozinho. O `VITE_BASE=/` existe porque o Pages
serve da raiz do domínio; sem ele o build usa caminhos relativos (bom para
subdiretório, frágil para URL terminada em barra).

**Manual, da sua máquina:**

```bash
npm run deploy
```

Isso builda com a base certa e chama o `wrangler` (pede login no navegador na
primeira vez).

Os arquivos `public/_headers` e `public/_redirects` vão junto no build: o
primeiro define cache dos assets e cabeçalhos de segurança; o segundo é uma rede
de proteção para quem digitar um caminho na mão.

## Onde ficam meus dados

Tudo local, no seu navegador: projetos, imagens, fontes enviadas e marcas ficam no
IndexedDB; só preferências pequenas (tema, safe zones, padrão de nome) usam
`localStorage`. Limpar os dados do site apaga tudo — por isso existe **"Exportar
todos"** na tela de projetos, que gera um ZIP com um arquivo `.criativo` por
projeto. Um projeto individual também exporta e importa avulso.

A única requisição de rede que o app faz é buscar uma fonte do Google Fonts, e só
quando você escolhe uma na busca. A curadoria empacotada funciona offline.

## Estrutura

```
src/
  components/   canvas (Konva), painéis, inspector, diálogos, landing
  lib/
    model/      tipos, schemas zod, migrações
    layout/     adapt (o motor multiformato), âncoras, safe area, snapping
    render/     cena única usada por preview e export
    export/     encode, naming, zip, checklist, arquivo .criativo
    brand/      tokens de marca
    fonts/      curadoria, Google Fonts, fontes do usuário
  config/       formatos, safe areas, atalhos
public/templates/  modelos de fábrica (JSON)
docs/           SPEC.md e PROGRESS.md
```

## Contribuir

Antes de abrir um PR, rode:

```bash
npm run typecheck && npm test && npm run test:visual
```

A suíte visual compara o export pixel a pixel com as referências em
`src/test/visual/__refs__`. Se a diferença for intencional, regenere com
`npm run test:visual:update` e **revise as imagens no diff** antes de commitar.

Leia [`docs/SPEC.md`](docs/SPEC.md) — as decisões de escopo estão fechadas lá, e a
§3 lista o que deliberadamente não entra.

## Licença

[MIT](./LICENSE).
