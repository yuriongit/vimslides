import z4 from "zod/v4"
import type { PresentationId } from "../types/presentations.types"
import { PresentationSchema } from "./presentations.schemas"

export const PresentationDeleteSchema = z4.object({
  public_id: z4.toZod<PresentationId>()(PresentationSchema.shape.public_id),
})
