# AGENTS.md

VimSlides is a keyboard-first web presentation editor: free-form boxes on a 16:9 canvas driven by
Vim modes, scopes, motions, and ex commands. It is not markdown-to-slides; the mouse still works.
Product intent lives in `documents/PRD.md`, design direction in `documents/ARCHITECTURE.md`. Follow
the root `AGENTS.md` for workspace-wide rules.

Scope: `@vss/shared`, the small source-only package imported by both `@vss/web` and `@vss/api`.
Keep it free of React, browser APIs, and app-specific logic.

## Layout and rules

- `src/index.ts` is the barrel. New public constants, schemas, or types must be exported here;
  `PresentationSchema` is currently an internal base schema and is intentionally not re-exported.
- Schemas use `import z4 from "zod/v4"` and reuse shapes from `PresentationSchema`. Keep the
  validation rules aligned with DB constraints (`TITLE_MAX_LENGTH` 100, `DESCRIPTION_MAX_LENGTH`
  250) and with API request validation.
- `src/types/database.types.ts` is generated. Keep it in sync with
  `apps/api/src/types/database.types.ts`; do not hand-edit either copy.
- There is no build step: apps consume the TypeScript source directly through `workspace:*`, so
  changes here affect both apps immediately.

## Commands

`bun run typecheck` from the repo root covers all workspaces. The package declares a local
`typecheck` script, but `tsconfig.json` is currently missing; add one if you need package-local
checks rather than treating the missing config as a pass. Biome runs only from the root.
