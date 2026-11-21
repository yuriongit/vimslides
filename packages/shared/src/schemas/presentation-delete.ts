import z4 from "zod/v4"
import type { PresentationId } from "../types/presentations"
import { PresentationSchema } from "./presentation"

export const PresentationDeleteSchema = z4.object({
  id: z4.toZod<PresentationId>()(PresentationSchema.shape.id),
})
