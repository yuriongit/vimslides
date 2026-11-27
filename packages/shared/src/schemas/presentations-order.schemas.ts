import z4 from "zod/v4"

export const PRESENTATION_ORDER_KEYS = ["lastModified", "createdAt"] as const
export const PRESENTATION_ORDER_DIRECTIONS = ["asc", "desc"] as const

export const PresentationOrderBySchema = z4.object({
  key: z4.enum(PRESENTATION_ORDER_KEYS),
  direction: z4.enum(PRESENTATION_ORDER_DIRECTIONS),
})

export type PresentationOrderBy = z4.infer<typeof PresentationOrderBySchema>
