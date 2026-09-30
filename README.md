# Aziz Zina — Portfolio & Blog

Personal portfolio and blog of **Aziz Zina**, Full Stack Developer from Tunisia.
Live at **[azizzina.tn](https://www.azizzina.tn)**.

Built with **Analog** (the Angular meta-framework) on **Angular 21**, server-side rendered and prerendered to static HTML, styled with **Tailwind CSS v4** and **spartan/ui**, animated with **GSAP** and **Lenis**, with **three.js** scenes and live data from the **GitHub** and **Spotify** APIs.

---

## Highlights

- **Scroll-driven storytelling** — GSAP ScrollTrigger + Lenis smooth scrolling: a headline that "reads itself" as you scroll, a pinned Experience section that steps through each role, and reveal animations throughout.
- **Live GitHub stats** — a contribution heatmap (last year of activity) plus followers, repos, stars, commits, PRs and issues, fetched server-side via the GitHub GraphQL API.
- **Now Playing** — what I'm listening to on Spotify, via a server route that refreshes the OAuth token.
- **Light / dark theme** — circular reveal from the click point using the View Transitions API, no flash on load, follows the OS until you choose.
- **3D** — three.js particle field in the hero and a GLTF robot in the navigation menu.
- **Markdown blog & project pages** — frontmatter-driven, Shiki syntax highlighting, table of contents, prerendered at build time.
- **Accessible by default** — keyboard-navigable tabs, `prefers-reduced-motion` respected everywhere, semantic markup, SEO/OG/Twitter meta per page.

---

## Tech stack

### Core

| Technology | Role |
|---|---|
| [Angular 21](https://angular.dev) | UI framework — standalone components, signals, `OnPush`, native control flow |
| [Analog 2](https://analogjs.org) (`@analogjs/platform`, `router`, `content`) | Meta-framework: file-based routing, Markdown content, SSR + prerendering, API routes |
| [Vite 7](https://vite.dev) | Dev server and build tool (via `@analogjs/vite-plugin-angular`) |
| [Nitro](https://nitro.build) / [h3](https://h3.dev) | Server runtime for SSR and the `/api/*` routes |
| [TypeScript 5.9](https://www.typescriptlang.org) | Strict mode, `strictTemplates`, `noPropertyAccessFromIndexSignature` |
| [RxJS](https://rxjs.dev) | HTTP streams (`HttpClient`) alongside signals |
| `@angular/ssr`, `@angular/platform-server` | Server rendering and hydration with event replay |
| [Express 5](https://expressjs.com) | Node server entry |

### Styling & UI

| Technology | Role |
|---|---|
| [Tailwind CSS v4](https://tailwindcss.com) (`@tailwindcss/vite`) | Utility-first styling, theme tokens as CSS variables |
| [@tailwindcss/typography](https://github.com/tailwindlabs/tailwindcss-typography) | `prose` styles for blog and project Markdown |
| [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) | Animation utilities used by spartan components |
| [spartan/ui](https://spartan.ng) (`@spartan-ng/brain` + Helm, `@spartan-ng/cli`) | Accessible headless primitives + styled components (button, card, badge, carousel, dropdown, popover, input, form-field, separator, skeleton…) |
| [Angular CDK](https://material.angular.dev/cdk) | Overlay and a11y primitives under spartan |
| [class-variance-authority](https://cva.style), [clsx](https://github.com/lukeed/clsx), [tailwind-merge](https://github.com/dcastil/tailwind-merge) | Component variants and class merging (`hlm()`) |
| [ng-icons](https://ng-icons.github.io/ng-icons) — Lucide, Radix, Remix Icon | Icon sets |
| [Embla Carousel](https://www.embla-carousel.com) (`embla-carousel-angular`) | Carousel behind spartan's carousel |
| [cuelume](https://www.npmjs.com/package/cuelume) | Interaction sound cues via `data-cuelume-*` attributes |
| Google Fonts — Inter, JetBrains Mono, IBM Plex Mono, Archivo Black | Typography |

### Animation & motion

| Technology | Role |
|---|---|
| [GSAP 3](https://gsap.com) | All motion: timelines, `quickTo` tooltips, count-ups, staggered reveals, `matchMedia` |
| [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) | Scroll-linked reveals, scrubbed text, and the pinned Experience section |
| [Lenis](https://lenis.darkroom.engineering) | Smooth scrolling, driven by the GSAP ticker and synced with ScrollTrigger |
| [View Transitions API](https://developer.mozilla.org/docs/Web/API/View_Transition_API) + Web Animations API | Circular reveal when switching themes |

### 3D

| Technology | Role |
|---|---|
| [three.js](https://threejs.org) | Hero particle field and the menu robot scene |
| `GLTFLoader` (three/examples) | Loads `public/robot_2.0.glb` |

### Content

| Technology | Role |
|---|---|
| `@analogjs/content` | Markdown files in `src/content/` become blog posts and project pages |
| [Shiki](https://shiki.style) | Build-time syntax highlighting for code blocks |

### Data & APIs

| Service | Used for |
|---|---|
| [GitHub REST + GraphQL API](https://docs.github.com/graphql) | Profile stats, commits/PRs/issues, contribution calendar (`/api/github/stats`) |
| [Spotify Web API](https://developer.spotify.com/documentation/web-api) | Currently playing track (`/api/spotify/now-playing`) |

### Analytics, monitoring & deployment

| Technology | Role |
|---|---|
| [Vercel](https://vercel.com) | Hosting and deployment |
| [@vercel/analytics](https://vercel.com/docs/analytics), [@vercel/speed-insights](https://vercel.com/docs/speed-insights) | Traffic and Core Web Vitals |
| Google Analytics (gtag.js) | Page views, including on client-side navigation |

### Tooling & quality

| Technology | Role |
|---|---|
| [pnpm](https://pnpm.io) | Package manager |
| [ESLint 9](https://eslint.org) + [angular-eslint](https://github.com/angular-eslint/angular-eslint) + [typescript-eslint](https://typescript-eslint.io) | Linting |
| [Prettier](https://prettier.io) | Formatting (Angular parser for templates) |
| [Vitest 4](https://vitest.dev) + `@analogjs/vitest-angular` + jsdom + `@vitest/coverage-v8` | Unit test setup |
| [Nx](https://nx.dev) (`@nx/angular`, `@nx/vite`) | Workspace tooling |
| [SonarCloud](https://sonarcloud.io) (GitHub Actions) | Static analysis on every push and PR |
| [Dependabot](https://docs.github.com/code-security/dependabot) | Dependency updates |

### AI-assisted development

This project is developed with AI pair-programmers, given project context so they follow the codebase's conventions:

| Tool | How it's used |
|---|---|
| [Claude Code](https://claude.com/claude-code) | Main coding agent. [`CLAUDE.md`](CLAUDE.md) documents the architecture, commands, SSR constraints and conventions |
| [GitHub Copilot](https://github.com/features/copilot) | Guided by [`.github/copilot-instructions.md`](.github/copilot-instructions.md) (Angular best practices) |

**Claude Code skills** (in [`.claude/skills/`](.claude/skills)) give the agent specialised know-how:

| Skill | What it adds |
|---|---|
| `angular-developer` | Official Angular guidance — signals, `resource`, DI, routing, SSR, forms, a11y, testing (from [angular/skills](https://github.com/angular/skills), pinned in `skills-lock.json`; also mirrored in `.agents/skills/` for other agents) |
| `spartan` | Adding, composing and styling spartan/ui Brain + Helm components, and the spartan CLI |
| `emil-design-eng` | Emil Kowalski's design-engineering philosophy: UI polish, component design, animation decisions |
| `animation-vocabulary` | Turns a vague description of a motion effect into its exact name |
| `find-animation-opportunities` | Finds places that should animate (and rejects the ones that shouldn't), with exact values |
| `improve-animations` | Audits the motion code and writes prioritised implementation plans |
| `review-animations` | Reviews animation code against a high craft bar |

---

## Project structure

```
src/
├── app/
│   ├── pages/                  # File-based routes (*.page.ts)
│   │   ├── index.page.ts       #   /  (home)
│   │   ├── blog/               #   /blog, /blog/:slug
│   │   ├── projects/           #   /projects, /projects/:slug
│   │   └── [...page-not-found].page.ts
│   ├── components/
│   │   ├── home/               # hero, about-me (+ GitHub stats), experience, project, contact
│   │   ├── layout/             # navbar, menu overlay, footer, cursor, theme toggle, now playing
│   │   ├── blog/
│   │   └── ui/                 # spartan/ui Helm components (generated, aliased as @spartan-ng/helm/*)
│   ├── lib/                    # services: theme, GitHub, Spotify, smooth scroll, route resolvers
│   └── shared/                 # shared components, directives, data (projects.data.ts)
├── content/
│   ├── *.md                    # blog posts
│   └── projects/*.md           # project detail pages
├── server/routes/api/          # Nitro API routes: github/stats, spotify/now-playing
└── styles.css                  # Tailwind entry, theme tokens (light + dark)
public/                         # static assets: logos, project images, robot_2.0.glb
```

---

## Getting started

**Prerequisites:** Node.js 20+ and pnpm.

```bash
git clone https://github.com/aziz-zina/portfolio
cd portfolio
pnpm install      # .npmrc sets legacy-peer-deps=true
pnpm dev          # http://localhost:5173
```

### Environment variables

Create a `.env` file at the root. The GitHub and Spotify widgets fall back gracefully without them.

```bash
GITHUB_PAT=               # GitHub personal access token (read-only) — stats + contribution graph
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=    # for the "Now Playing" widget
```

### Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Vite dev server with SSR |
| `pnpm build` | Production build + prerender into `dist/analog/` |
| `pnpm preview` | Serve the built app (`dist/analog/server/index.mjs`) |
| `pnpm test` | Run Vitest |
| `pnpm lint` | Run ESLint |

---

## Adding content

**Blog post:** add `src/content/<slug>.md` with frontmatter (`title`, `date`, `description`, `slug`, `tags`, `coverImage`). It's prerendered automatically; set `draft: true` to exclude it.

**Project:** projects have two sources — add both, with the same `slug`:

1. A card entry in `src/app/shared/data/projects.data.ts` (set `hasDetails: true` if it has a detail page).
2. The detail page `src/content/projects/<slug>.md`.

**New static page:** add it to `prerender.routes` in `vite.config.ts`.

---

## Deployment

Deployed on **Vercel**. Pages are prerendered at build time; the `/api/*` routes run as serverless functions. Set the environment variables above in the Vercel project settings.

---

## Notes

These packages are installed but not currently imported anywhere; they're candidates for removal or future use:
`angular-three`, `angular-three-soba`, `angular-three-rapier`, `@dimforge/rapier3d-compat`, `three-stdlib`, `three-custom-shader-material`, `@pmndrs/vanilla`, `camera-controls`, `ngxtension`, `marked` (and its plugins), `front-matter`, `@types/gsap` (GSAP ships its own types).

---

© Aziz Zina — [azizzina.tn](https://www.azizzina.tn) · [GitHub](https://github.com/aziz-zina) · [LinkedIn](https://www.linkedin.com/in/aziz-zina/)
