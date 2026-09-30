# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal portfolio + blog (azizzina.tn), deployed on Vercel. Built with **Analog** (Angular meta-framework on Vite) using Angular 21, SSR with prerendering, Tailwind CSS v4, and spartan/ui. The README's `ng serve` / Angular v20 instructions are outdated — the app runs through Vite/Analog.

## Commands

Package manager is pnpm (`pnpm-lock.yaml`); `.npmrc` sets `legacy-peer-deps=true`.

- `pnpm dev` — Vite dev server (Analog, SSR enabled)
- `pnpm build` — production build + prerender into `dist/analog/`
- `pnpm preview` — run the built Nitro server (`dist/analog/server/index.mjs`)
- `pnpm test` — Vitest (jsdom, `**/*.spec.ts`). Single file: `pnpm test src/path/to/file.spec.ts`; single test: `pnpm test -t "name"`. Note: there are currently no spec files, and `vite.config.ts` references `src/test-setup.ts`, which does not exist yet — create it before adding tests.
- There is no lint script; `eslint.config.js` exists (angular-eslint, selector prefix `app`) but is written in CommonJS while `package.json` is `"type": "module"`.

## Architecture

- **File-based routing** (`@analogjs/router`): routes are `src/app/pages/**/*.page.ts`. `[slug]` = dynamic param, `[...page-not-found]` = catch-all. Per-route title/meta/guards are set via an exported `routeMeta: RouteMeta`.
- **Markdown content** (`@analogjs/content`, Shiki highlighting): blog posts live in `src/content/*.md`, project detail pages in `src/content/projects/*.md`. Frontmatter shape: `ContentMetadata` (`src/app/lib/content-metadata`) and `ProjectMetadata` (`src/app/lib/project-metadata`). `draft: true` excludes a file from prerendering. The `[slug].page.ts` pages check that a file exists in `routeMeta` and use resolvers in `src/app/lib/resolvers/` to build title + OG/Twitter meta tags.
- **Projects have two sources of truth**: the cards on the home/projects pages come from `src/app/shared/data/projects.data.ts` (`PROJECTS_DATA`); the detail page `/projects/:slug` renders the matching markdown file. When adding a project, add both (matching `slug`, and `hasDetails: true` if it has a markdown page).
- **Prerendering** is configured in `vite.config.ts` (`prerender.routes`): static routes plus content-dir transforms that generate `/blog/<slug>` and `/projects/<slug>`. New static pages must be added there to be prerendered.
- **Server API routes** (Nitro/h3): `src/server/routes/api/**` → `/api/...`. `spotify/now-playing` and `github/stats` read secrets from env (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, `GITHUB_PAT` in `.env`) and are consumed by services in `src/app/lib/spotify` and `src/app/lib/github`.
- **SSR constraints**: code runs on the server too. Guard browser APIs (window, document, GSAP, Lenis, Three.js) with `isPlatformBrowser`/`afterNextRender`. Hydration uses `withEventReplay`.
- **Scrolling/animation**: `src/app/app.ts` owns global Lenis smooth scrolling wired into the GSAP ticker and `ScrollTrigger` (resize/navigation call `lenis.resize()` + `ScrollTrigger.refresh()`). Scroll-driven animations should use ScrollTrigger rather than native scroll listeners. 3D scenes (hero, navbar menu robot) use `angular-three` / `angular-three-soba` / rapier.
- **spartan/ui**: Helm components are generated into `src/app/components/ui/<name>/src` (see `components.json`) and imported via `@spartan-ng/helm/<name>` path aliases in `tsconfig.json`. Adding a component with the spartan CLI must also add its path alias. Brain primitives come from `@spartan-ng/brain`. Class merging uses `hlm()` from `@spartan-ng/helm/utils`.
- **Theming**: `src/app/lib/theme/theme.service.ts` + CSS variables in `src/styles.css` (Tailwind v4, `tw-animate-css`, typography plugin).

## Conventions (from `.github/copilot-instructions.md`)

- Standalone components only; `ChangeDetectionStrategy.OnPush`; `input()`/`output()` functions instead of decorators; `inject()` instead of constructor injection.
- Signals for state, `computed()` for derived state.
- Native control flow (`@if`, `@for`, `@switch`); `class`/`style` bindings instead of `ngClass`/`ngStyle`.
- `NgOptimizedImage` for static images; inline templates for small components.
- Strict TS (`strict`, `noPropertyAccessFromIndexSignature` — use `obj['key']` for index signatures, `strictTemplates`); avoid `any`.

Project-level skills in `.claude/skills/` (angular-developer, spartan, animation skills) cover Angular, spartan/ui, and motion work in more depth.
