import { treaty } from "@elysia/eden"
import type { App } from "@vss/api"

export const api = treaty<App>(String(import.meta.env.VITE_API_URL))
