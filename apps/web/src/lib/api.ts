import { treaty } from "@elysia/eden"
import type { App } from "@vss/api"
// import type { App } from "../../../api/src/index"

export const api = treaty<App>("localhost:3000")
