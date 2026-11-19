import z4 from "zod/v4"

export const PresentationCreationFormSchema = z4.object({
  title: z4
    .string()
    .trim    ()
    .min(1, "Presentation title must be at least 1 character.")
    .max(100, "Presentation title must be at most 100 characters."),
  description: z4.union([
    z4.literal(""),
    z4
      .string()
      .trim      ()
      .max(250, "Presentation description must be at most 250 characters."),
  ]),
})

export type PresentationCreationForm = z4.infer<typeof PresentationCreationFormSchema>
