import z4 from "zod/v4"
import type { Database } from "../types/database"
export type PresentationInsert = Omit<
  Database["public"]["Tables"]["presentations"]["Insert"],
  "created_at" | "id"
>

export const PresentationInsertionSchema = z4.object({
  title: z4.string().trim().min(1, "...").max(100, "..."),
  description: z4.string().trim().max(250).nullable(),
  slide_count: z4.number().int().nonnegative(),
  file_url: z4.string(), // z.url(),
}) satisfies z4.ZodType<PresentationInsert>
export type PresentationInsertion = z4.infer<typeof PresentationInsertionSchema>
