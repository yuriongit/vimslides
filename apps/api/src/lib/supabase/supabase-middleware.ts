import type {
  AnyEntry,
  Contributions,
  FetchHandler,
  ValidateEntries,
} from "@supabase/middleware"
import { pipeline } from "@supabase/middleware"
import { Elysia } from "elysia"

type Handle<Entries extends readonly AnyEntry[]> = [
  ValidateEntries<Entries>,
] extends [true]
  ? (req: Request) => Response | Promise<Response>
  : ValidateEntries<Entries>

const HANDOFF = new WeakMap<Request, Record<string, unknown>>()

const SUPABASE_SOURCE = "@supabase/server"

const AUTH_MESSAGES: Record<string, string> = {
  MISSING_CREDENTIALS: "Not authenticated",
}

type SupabaseError = { source: string; code?: string; status?: number }

function isSupabaseError(value: unknown): value is SupabaseError {
  return (
    typeof value === "object"
    && value !== null
    && "source" in value
    && value.source === SUPABASE_SOURCE
  )
}

function cleanResponse(err: SupabaseError, status: number, base?: Headers) {
  console.error(err)

  const headers = new Headers(base)
  headers.delete("content-length")
  headers.delete("content-type")

  const message = (err.code && AUTH_MESSAGES[err.code]) || "Unauthorized"
  return Response.json({ message }, { status, headers })
}

async function sanitize(res: Response): Promise<Response> {
  if (res.ok) return res
  if (!res.headers.get("content-type")?.includes("application/json")) return res

  const body = await res
    .clone()
    .json()
    .catch(() => null)
  if (!isSupabaseError(body)) return res

  return cleanResponse(body, res.status, res.headers)
}

export function supabaseCtx<const Entries extends readonly AnyEntry[]>() {
  return new Elysia()
    .resolve((c) => {
      const contributions = HANDOFF.get(c.request)

      if (!contributions) {
        throw new Error(
          "supabaseCtx() ran without wrapElysia(). "
            + "Serve the app through wrapElysia(entries, (req) => app.handle(req)).",
        )
      }

      return contributions as Contributions<Entries>
    })
    .as("scoped")
}

export function wrapElysia<const Entries extends readonly AnyEntry[]>(
  entries: Entries,
  handle: Handle<Entries>,
): FetchHandler {
  const next = handle as (req: Request) => Response | Promise<Response>

  const run = pipeline(entries as readonly AnyEntry[], async (req, ctx) => {
    const contributions: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(ctx)) {
      contributions[key] = value
    }

    HANDOFF.set(req, contributions)

    try {
      return await next(req)
    } finally {
      HANDOFF.delete(req)
    }
  })

  return async (req: Request) => {
    try {
      return await sanitize(await run(req))
    } catch (err) {
      if (isSupabaseError(err)) return cleanResponse(err, err.status ?? 401)
      throw err
    }
  }
}
