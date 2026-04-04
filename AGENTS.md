# AGENTS.md
Agent operating guide for `payday`.

## 1) Project Snapshot
- Stack: TanStack Start + TanStack Router (file-based) + React 19 + Tailwind CSS v4 + shadcn/ui + Biome + Vitest.
- Package manager: `pnpm`.
- Alias: `#/* -> ./src/*` (prefer for internal imports).
- Product focus: finance/career decision tools for salaried users (mobile-first, privacy-first).

## 2) Commands (use exactly)
### Development
```bash
pnpm dev
pnpm build
pnpm preview
```

### Quality gates
```bash
pnpm lint
pnpm format
pnpm typecheck
pnpm check
```
- `pnpm check` runs Biome + TypeScript (`biome check && pnpm typecheck`).

### Tests
```bash
pnpm test
pnpm vitest run src/tools/fire/calculator.test.ts
pnpm vitest run src/tools/fire/calculator.test.ts -t "builds the FIRE target"
```
- Single file: `pnpm vitest run src/path/to/file.test.ts`
- Single test case: add `-t "exact test name"`

## 3) Required agent workflow
1. Make focused edits.
2. After every significant change, run `pnpm check`.
3. If business logic/calculations changed, run the relevant test file(s).
4. Before handoff, ensure no new TypeScript/Biome issues.

Significant change examples:
- New route/tool/page
- Calculator/scoring/storage logic updates
- Shared UI primitive changes in `src/components/ui/*`
- Large refactors

## 4) Routing and structure
### Routing rules
- Routes are file-based in `src/routes`.
- Keep tool route wrappers thin: `src/routes/tools/<slug>.tsx` should mostly wire `createFileRoute` to a page component.
- Never manually edit `src/routeTree.gen.ts` (generated).

### Standard tool layout
```text
src/routes/tools/<slug>.tsx
src/tools/<slug>/page.tsx
src/tools/<slug>/calculator.ts
src/tools/<slug>/constants.ts
src/tools/<slug>/types.ts
src/tools/<slug>/*.test.ts
```

### Key shell files
- Root document/shell: `src/routes/__root.tsx`
- Router config: `src/router.tsx`

## 5) Styling and UI system
- Tailwind v4 is CSS-first in `src/styles.css`.
- Use semantic tokens (`bg-background`, `text-foreground`, `border-border`, etc.).
- Reuse brand utilities where possible (`.page-wrap`, `.island-shell`, `.display-title`, `.feature-card`, `.rise-in`).
- Fonts are already configured: Manrope (body) + Fraunces (display).
- Avoid random hardcoded colors when a semantic token exists.
- Mobile-first by default; for wide comparison data, use section-level horizontal scroll.

## 6) shadcn + Cursor rules
`.cursorrules` requires:
```bash
pnpm dlx shadcn@latest add <component>
```

Project shadcn specifics:
- Config: `components.json`
- Style: `new-york`
- Icon library: `lucide`
- UI alias: `#/components/ui`

Prefer existing components first (`button`, `card`, `input`, `tabs`, `table`, `tooltip`, `chart`, `collapsible`, etc.) before creating custom primitives.

## 7) Code style conventions
### Formatting/linting
- Enforced by `biome.json`.
- Indentation: tabs.
- Quotes: double quotes.
- Imports are organized automatically.

### Imports
- Order: external imports first, internal (`#/*`) second.
- Prefer alias imports over long relative paths.
- Use `import type { ... }` for type-only imports.

### TypeScript
- `strict` mode is on.
- Avoid `any`; use narrow types + type guards.
- Keep pure domain logic in `calculator.ts` (no UI side effects).
- Export domain types from `types.ts`.

### Naming
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE` for true constants
- Booleans: `is*`, `has*`, `can*`, `show*`
- Event handlers: `on*` / `handle*`

## 8) Reliability and error handling
- Parse user input defensively (`Number.parseFloat` + fallback).
- Clamp/sanitize values in calculator layer.
- Wrap `localStorage` reads/writes in `try/catch` and fail gracefully.
- Avoid throwing from render paths for recoverable UI states.
- Provide explicit safe empty states when inputs/results are missing.

## 9) Testing expectations
- Logic changes should add/update Vitest coverage.
- Keep tests deterministic and outcome-focused.
- Co-locate tests near tool logic (`calculator.test.ts`).
- Use `describe/it/expect` from `vitest`.

## 10) Agent do / don’t
### Do
- Run `pnpm check` after significant edits.
- Keep route wrappers thin and logic in `src/tools/*`.
- Reuse design language and semantic tokens.
- Keep calculations pure and testable.

### Don’t
- Don’t edit generated files (`src/routeTree.gen.ts`).
- Don’t skip lint/typecheck before handoff.
- Don’t bypass semantic tokens with arbitrary styling.
- Don’t put new agent configs in `.kilocode/` or `.opencode/`; use `.kilo/`.

## 11) Quick navigation
- Home UI: `src/components/home/*`
- Shared primitives: `src/components/ui/*`
- Common utility: `src/lib/utils.ts`
- Tool routes: `src/routes/tools/*`
- Tool logic/pages: `src/tools/*`
- Global tokens/styles: `src/styles.css`

## 12) Cursor/Copilot status
- Cursor rules found: `.cursorrules` (shadcn command rule included above).
- `.cursor/rules/`: not present.
- `.github/copilot-instructions.md`: not present.
