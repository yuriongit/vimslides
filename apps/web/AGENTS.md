# AGENTS.md

VimSlides is a keyboard-first web presentation editor: free-form boxes on a 16:9 canvas driven by
Vim modes, scopes, motions, and ex commands. It is not markdown-to-slides; the mouse still works.
Product intent lives in `documents/PRD.md`, design direction in `documents/ARCHITECTURE.md`. Follow
the root `AGENTS.md` for workspace-wide rules.

Scope: `@vss/web`, the browser SPA only.

## Stack and commands

TypeScript, React 19, Vite, TanStack Router file routes + TanStack Query, Tailwind CSS v4,
shadcn/base-vega UI, Supabase auth, and an Eden treaty client typed from `@vss/api`. This is a plain
SPA: no TanStack Start, SSR, or server functions.

From `apps/web`:

- `bun run dev` — Vite dev server; requires `$PORT` (local web is 3001)
- `bun run build` — regenerates the route tree, then Vite build
- `bun run typecheck`
- `bun run generate-routes` — regenerate TanStack route tree
- `bun run preview` / `bun run start` — also require `$PORT`

From the root, use `bun run dev:web` and `bun run build:web`. Biome (`check`, `check:w`, etc.) runs
only from the root. There is no test suite configured.

## Structure

- `src/routes/` — file routes: `__root.tsx`, pathless `_public.tsx` and `_authenticated.tsx`
  layouts, `presentations/` dashboard/editor, and `docs/`.
- `src/components/services/presentations/canvas/` — editor UI and box/slide types.
- `src/components/services/presentations/home/` — dashboard, commands, and CRUD dialogs.
- `src/components/pages/` — landing, docs, and about content.
- `src/components/ui/` — shadcn/base-vega primitives; add/update via the shadcn CLI using
  `components.json`.
- `src/hooks/use-vim-slides.ts` — editor state and key handling (modes, motions, ex commands,
  undo/redo, local drafts, cloud writes). Changes here affect the core workflow.
- `src/lib/clients/` — Eden API client (`api/`) and Supabase client (`supabase/`);
  `src/lib/auth/get-auth-headers.ts` supplies the bearer token for API calls.
- `src/index.css` — Tailwind v4 tokens, Catppuccin light/dark palettes, and fonts.
- `src/routeTree.gen.ts` — generated; do not edit.

## Data and auth

- TanStack Query owns server state; CRUD currently lives in the route components with
  `useQuery`/`useMutation` and invalidation, not route loaders.
- API calls go through `api.presentations...` with `getAuthHeaders()`. Keep request/response shapes
  aligned with `apps/api` and `@vss/shared`.
- `_authenticated.tsx` guards routes with `supabase.auth.getSession()` and exposes `user` through
  route context.
- Editor drafts persist in `localStorage`; cloud writes are explicit via ex commands such as `:w`,
  `:wq`, and `:x`.

## shadcn

`components.json` is the source of truth: style `base-vega`, TSX/no RSC, `hugeicons` and TablerIcons icons, CSS
variables in `src/index.css`, `@/` aliases, and `@supabase`/`@ballmac` registries. Add or update
primitives in `src/components/ui/` with the shadcn CLI instead of hand-rolling equivalents.

Follow the shadcn way of composing UI rather than hand-rolling equivalents. For example, use
`Button` from `@/components/ui/button` for actions; if the element must be a TanStack Router `Link`,
apply `buttonVariants(...)` to its `className` rather than wrapping or nesting a `Button`. Variants
come from `cva`; `cn` comes from the `cn` package (`src/lib/utils.ts` re-exports it). Theme tokens
live in `src/index.css` (`@import "shadcn/tailwind.css"` plus Catppuccin palettes); change tokens
there, not per component.

`.prettierrc`/`.prettierignore` are shadcn/Tailwind setup config, not the repo formatter: the plugin
sorts Tailwind classes in `cn`/`cva` calls against `src/index.css`. Biome is the only formatter and
linter we run. If a future check confirms no shadcn CLI or registry step needs them (no Prettier
scripts/deps, plugin, or CLI references), remove both files and re-run a shadcn add to verify.

## Conventions and quirks

- Import alias `@/*` maps to `./src/*`; strict TypeScript options are inherited from the root config.
- `$PORT` must be set for all server scripts; it is not defined in `apps/web/.env.local`.
- Known rough edge: the auth guard sets `?redirect=`, but the login form reads `?next=`; verify before
  relying on deep-link recovery. (will be fixed soon)

## Before committing

Regenerate routes if route files changed, then run `bun run check:w` and `bun run typecheck` from the
repo root.
