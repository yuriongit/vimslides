import { z } from "zod"
import type { Database } from "../types/database"
export type PresentationInsert = Omit<
  Database["public"]["Tables"]["presentations"]["Insert"],
  "created_at" | "id"
>

export const PresentationInsertionSchema = z.object({
  user_id: z.string(),
  title: z.string().trim().min(1, "...").max(100, "..."),
  description: z.union([z.literal(null), z.string().trim().max(250, "...")]),
  slide_count: z.number().int().nonnegative(),
  file_url: z.string(), // z.url(),
}) satisfies z.ZodType<PresentationInsert>

export type PresentationInsertion = z.infer<typeof PresentationInsertionSchema>
