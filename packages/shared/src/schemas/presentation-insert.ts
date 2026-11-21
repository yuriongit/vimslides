import z4 from "zod/v4"
import type { Database } from "../types/database"
import { PresentationSchema } from "./presentation"
export type DbPresentationInsert = Omit<
  Database["public"]["Tables"]["presentations"]["Insert"],
  "created_at" | "id" | "file_url" | "slide_count"
>

export const PresentationInsertSchema = z4.object({
  title: PresentationSchema.shape.title,
  description: PresentationSchema.shape.description,
  // slide_count: z4.number().int().nonnegative(),
  // file_url: z4.string(), // z.url(),
}) satisfies z4.ZodType<DbPresentationInsert>

export type PresentationInsert = z4.infer<typeof PresentationInsertSchema>
