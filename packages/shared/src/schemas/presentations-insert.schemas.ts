import z4 from "zod/v4"
import type { Database } from "../types/database.types"
import { PresentationSchema } from "./presentations.schemas"
export type DbPresentationInsert = Omit<
  Database["public"]["Tables"]["presentations"]["Insert"],
  "created_at" | "id" | "file_url" | "slide_count" | "user_id"
>

export const PresentationInsertSchema = z4.object({
  title: PresentationSchema.shape.title,
  description: PresentationSchema.shape.description,
}) satisfies z4.ZodType<DbPresentationInsert>

export type PresentationInsert = z4.infer<typeof PresentationInsertSchema>
