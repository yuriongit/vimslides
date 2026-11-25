import z4 from "zod/v4"
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
} from "../constants/presentations"
import type { Json } from "../types/database.types"
import type { Presentation } from "../types/presentations.types"

const JsonValueSchema = z4.custom<Json>(() => true)

export const PresentationSchema = z4.toZod<Presentation>()(
  z4.object({
    user_id: z4.string(),
    created_at: z4.iso.time(),
    file_url: z4.string().nullable(), // z4.url
    id: z4.number(),
    last_modified: z4.string(),
    public_id: z4.uuid(),
    schema_version: z4.number().int(),
    slide_count: z4.number().nonnegative(),
    slides: JsonValueSchema,
    title: z4
      .string()
      .trim()
      .min(1, "Presentation title must be at least 1 character.")
      .max(
        TITLE_MAX_LENGTH,
        `Presentation title must be at most ${TITLE_MAX_LENGTH} characters.`,
      ),
    description: z4
      .string()
      .trim()
      .max(
        DESCRIPTION_MAX_LENGTH,
        `Presentation description must be at most ${DESCRIPTION_MAX_LENGTH} characters.`,
      )
      .or(z4.literal(""))
      .or(z4.literal(null)),
  }),
)
