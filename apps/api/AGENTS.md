# AGENTS.md

VimSlides is a keyboard-first web presentation editor: free-form boxes on a 16:9 canvas driven by
Vim modes, scopes, motions, and ex commands. It is not markdown-to-slides; the mouse still works.
Product intent lives in `documents/PRD.md`, design direction in `documents/ARCHITECTURE.md`. Follow
the root `AGENTS.md` for workspace-wide rules.

Scope: `@vss/api`, the Elysia/Bun HTTP API behind the web editor.

## Stack and commands

Elysia on Bun, Zod validation, Supabase Auth/middleware and Postgres, AWS S3 presigned uploads, and
shared schemas from `@vss/shared`.

From `apps/api`:

- `bun run dev` — watch mode on `$PORT` (local API is 3000)
- `bun run build` — bundles `src/index.ts` into `dist/`
- `bun run start` — runs the bundle
- `bun run typecheck`

From the root, use `bun run dev:api`, `bun run build:api`, and `bun run start:api`. Biome runs only
from the root. There is no test suite configured.

## Critical wiring

`src/index.ts` exports `app`, the `App` type consumed by the web Eden client, and a default
`{ fetch }` handler. Keep the wrapper intact:

```ts
export default {
  fetch: wrapElysia(supabaseEntries, (req) => app.handle(req)),
}
```

`supabaseCtx()` reads contributions handed off through a `WeakMap`; serving `app.handle` directly
throws. `supabaseEntries` applies CORS, requires claims, and creates the Supabase client.

## Structure

- `src/routes/presentations.ts` — all presentation endpoints and local slide Zod schemas.
- `src/middleware/error.ts` — `ApiError`, validation → 422, not found → 404, fallback → 500.
- `src/lib/clients/supabase/` — `supabaseEntries`, `supabaseCtx`, and `wrapElysia`.
- `src/lib/s3.ts` — S3 client, presigned PUT URLs, and asset deletion.
- `src/types/database.types.ts` — generated Supabase types; do not hand-edit.

## Routes and data rules

- All `/presentations` endpoints are authenticated: create, list, get by `public_id` UUID, patch,
  delete, and create an asset upload URL.
- Scope every query by owner via `.eq("user_id", jwtClaims.sub)`. Handlers receive `supabase` and
  `jwtClaims` from the middleware.
- Validate bodies/params with Zod. Use shared schemas from `@vss/shared` for patch/delete; local
  slide box schemas live in the route file and must stay in sync with the web editor.
- Presentation slides are stored as `jsonb`; the DB trigger keeps `slide_count` and
  `last_modified` in sync.
- Throw `ApiError` for expected database failures so the error plugin preserves the status.

## Environment and infra

Use env var names only; never commit or quote `.env.local` values. Required names include `PORT`,
`FRONTEND_URL` (CORS), Supabase URL/keys and `SUPABASE_JWKS_URL`, and S3 region/bucket/public URL,
credentials, plus optional `S3_ENDPOINT` for LocalStack. Local Supabase runs via `supabase/`;
LocalStack via `compose.yml` on port 4566.

`.railway/railway.ts` declares a `/health` check, but no such route exists yet; verify before
relying on it.

## Before committing

Run `bun run check:w` and `bun run typecheck` from the repo root. Rebuild if you changed the
bundled entry or exports.
