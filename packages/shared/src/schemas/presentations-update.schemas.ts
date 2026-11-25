import z4 from "zod/v4"
import type { Database } from "../types/database.types"
import type { PresentationId } from "../types/presentations.types"
import { PresentationSchema } from "./presentations.schemas"

type DbPresentationUpdate = Omit<
  Database["public"]["Tables"]["presentations"]["Update"],
  | "file_url"
  | "id"
  | "last_modified"
  | "public_id"
  | "slide_count"
  | "user_id"
  | "created_at"
>
export type PresentationUpdate = {
  public_id: PresentationId
  fields: DbPresentationUpdate
}

export const PresentationPatchSchema = z4.toZod<PresentationUpdate>()(
  z4.object({
    public_id: z4.toZod<PresentationId>()(PresentationSchema.shape.public_id),
    fields: z4.object({
      title: PresentationSchema.shape.title.optional(),
      description: PresentationSchema.shape.description.optional(),
      schema_version: PresentationSchema.shape.schema_version.optional(),
      slides: PresentationSchema.shape.slides.optional(),
    }),
  }),
)
