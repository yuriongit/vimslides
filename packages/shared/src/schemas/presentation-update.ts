import z4 from "zod/v4"
import type { Database } from "../types/database"
import type { PresentationId } from "../types/presentations"
import { PresentationSchema } from "./presentation"

type DbPresentationUpdate = Omit<
  Database["public"]["Tables"]["presentations"]["Update"],
  "file_url" | "id" | "slide_count" | "user_id" | "created_at"
>
export type PresentationUpdate = {
  id: PresentationId
  fields: DbPresentationUpdate
}

export const PresentationPatchSchema = z4.toZod<PresentationUpdate>()(
  z4.object({
    id: z4.number(),
    fields: z4.object({
      title: PresentationSchema.shape.title.optional(),
      description: PresentationSchema.shape.description.optional(),
    }),
  }),
)
