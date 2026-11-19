import z4 from "zod/v4"

export const PresentationCreationSchema = z4.object({
  title: z4.string().min(1).trim().max(60),
  description: z4
    .string()
    .trim()
    .pipe(z4.union([z4.literal(""), z4.string().min(1).max(60)])),
})

export type PresentationCreation = z4.infer<typeof PresentationCreationSchema>
