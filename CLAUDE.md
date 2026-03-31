# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # dev server on :3000
pnpm build        # production build
pnpm preview      # preview production build
pnpm test         # run tests (vitest)
pnpm check        # biome lint + format check (run before committing)
pnpm format       # biome format (writes)
pnpm lint         # biome lint only
```

Run a single test file: `pnpm vitest run src/path/to/file.test.tsx`

## Architecture

**Stack:** TanStack Start (SSR React framework) + TanStack Router (file-based) + Tailwind CSS v4 + Biome

**Routing:** File-based via `src/routes/`. Routes are auto-generated into `src/routeTree.gen.ts` — never edit that file manually. Each route file exports a `Route` const via `createFileRoute`.

**Root layout:** `src/routes/__root.tsx` defines the HTML shell via `shellComponent`, injects global CSS via `head()`, and mounts devtools. CSS is imported as `?url` for SSR compatibility.

**Router config:** `src/router.tsx` exports `getRouter()` — this is the single source of truth for router options. The router type is registered globally via module augmentation in the same file.

**Path aliases:** `#/*` maps to `./src/*` (defined in `package.json` `imports`). Use `#/lib/utils` not `../../lib/utils`.

**Styling:** Tailwind v4 with CSS-first config in `src/styles.css`. Design tokens are CSS custom properties — use them (`var(--lagoon)`, `var(--sea-ink)`, etc.) for brand colors, not arbitrary Tailwind values. Key utility classes defined in CSS: `.page-wrap`, `.island-shell`, `.feature-card`, `.display-title`, `.island-kicker`, `.nav-link`, `.rise-in`.

**Fonts:** Manrope (sans body, `--font-sans`) + Fraunces (display/serif, use `.display-title` class).

**Utilities:** `src/lib/utils.ts` exports `cn()` (clsx + tailwind-merge) for conditional class composition.

## Biome (linter/formatter)

- Indentation: **tabs**
- Quotes: **double**
- Scope: `src/**/*`, `vite.config.ts`, `index.html` — excludes `routeTree.gen.ts` and `styles.css`
- Always run `pnpm check` before committing; CI will fail on lint/format errors

## TanStack Start conventions

- Server functions: `createServerFn()` from `@tanstack/react-start` — keep them co-located with the routes that use them
- Server-only imports: use `import { ... } from '@tanstack/react-start/server'`
- `defaultPreload: "intent"` is set — links preload on hover by default
