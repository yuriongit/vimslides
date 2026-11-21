import z4 from "zod/v4"
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
} from "../constants/presentations"
import type { Presentation } from "../types/presentations"

export const PresentationSchema = z4.toZod<Presentation>()(
  z4.object({
    user_id: z4.string(),
    created_at: z4.iso.time(),
    file_url: z4.string(), // z4.url
    id: z4.number(),
    slide_count: z4.number().nonnegative(),
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
