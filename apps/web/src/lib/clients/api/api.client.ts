import type { Treaty } from "@elysia/eden"
import { treaty } from "@elysia/eden"
import type { App } from "@vss/api"

export const api: Treaty.Create<App> = treaty<App>(
  String(import.meta.env.VITE_API_URL),
)
