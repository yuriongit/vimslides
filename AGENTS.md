# AGENTS.md

## Product

VimSlides is a keyboard-first web presentation editor. Slides are free-form boxes on a 16:9 canvas,
edited through Vim modes, scopes, motions, and ex commands; the mouse also works. It is not a
markdown-to-slides tool.

Read `documents/PRD.md` before product or editor decisions, and `documents/ARCHITECTURE.md` for
design direction. These describe intent and can be ahead of the implementation (for example,
immutable revisions and the export queue are not built yet); trust the code for current behavior.

## Workspace

Bun workspaces (`package.json`):

- `apps/web/` — `@vss/web`, React/Vite SPA. See `apps/web/AGENTS.md`.
- `apps/api/` — `@vss/api`, Elysia/Bun API. See `apps/api/AGENTS.md`.
- `packages/shared/` — `@vss/shared`, source-only schemas/types/constants. See
  `packages/shared/AGENTS.md`.

Read the relevant nested AGENTS.md before working in a workspace. Keep package-specific details
there, not here.

Stack: TypeScript, React 19, Vite, TanStack Router/Query, Tailwind CSS v4, shadcn/ui, Supabase
(Auth/Postgres), Elysia on Bun, and Zod.

## Commands

Run from the repo root with Bun:

- `bun run dev:web` / `bun run dev:api` — dev servers
- `bun run build:web` / `bun run build:api` — production builds
- `bun run start:web` / `bun run start:api` — serve built apps
- `bun run typecheck` — all workspaces
- `bun run format`, `format:w`, `lint`, `lint:w`, `check`, `check:w` — Biome

Biome scripts live only at the root; the same `bun run check:w` from a workspace will fail. CI runs
`biome ci --reporter=github .`, installs with `bun install --frozen-lockfile`, then builds both apps
and typechecks. Commit lockfile changes when dependencies change.

## Conventions

- Biome (`biome.json`) is the formatter/linter of record: 2 spaces, double quotes, semicolons
  `asNeeded`, organize imports on. Don't hand-format; run `bun run check:w` from the root.
- TypeScript is strict via `tsconfig.base.json`: `verbatimModuleSyntax`, `noUnusedLocals`/
  `noUnusedParameters`, `noUncheckedIndexedAccess`, `noEmit`, and more are inherited by all packages.
- Shared dependency versions are pinned in the root `package.json` catalog; prefer `catalog:` over
  duplicating versions in workspace manifests.
- Local Supabase lives in `supabase/`; LocalStack S3 runs through `compose.yml` on port 4566. The
  web and API server scripts read `$PORT`; locally the API uses 3000 and the web app is expected at
  3001.
- Never read, quote, create, or commit gitignored files (`.env`, `node_modules`,
  `dist`, `.tanstack`, `*.tsbuildinfo`, `.localstack`). Refer to env var names, not values. (`.env.local` is the ONLY file that's fine for viewing, nothing else)

## Generated files

Do not hand-edit generated files:

- `apps/web/src/routeTree.gen.ts` — regenerate with `bun run generate-routes` or the web build.
- `apps/api/src/types/database.types.ts` and `packages/shared/src/types/database.types.ts` — keep in
  sync via generation, not manual copies.
- `dist/`, `.tanstack/`, and `*.tsbuildinfo` are build artifacts.

## Before committing

From the root, run `bun run check:w` and `bun run typecheck`. Build the affected app if you changed
build or runtime code.
