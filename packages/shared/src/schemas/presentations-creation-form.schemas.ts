import z4 from "zod/v4"
import { DESCRIPTION_MAX_LENGTH } from "../constants/presentations"
import { PresentationSchema } from "./presentations.schemas"

export const PresentationCreationFormSchema = z4.object({
  title: PresentationSchema.shape.title,
  description: z4.string().max(DESCRIPTION_MAX_LENGTH).trim(),
})

export type PresentationCreationForm = z4.infer<
  typeof PresentationCreationFormSchema
>
