import {
  PresentationDeleteSchema,
  PresentationOrderBySchema,
  PresentationPatchSchema,
} from "@vss/shared"
import { Elysia, status } from "elysia"
import { z } from "zod"
import type { supabaseEntries } from "../lib/clients/supabase/supabase.client"
import { supabaseCtx } from "../lib/clients/supabase/supabase-middleware"
import { createAssetUploadUrl } from "../lib/s3"
import { ApiError } from "../middleware/error"
import type { Json } from "../types/database.types"

const TextBoxSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  text: z.string(),
  fontSize: z.number(),
  color: z.string(),
  zIndex: z.number(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  align: z.enum(["left", "center", "right"]).optional(),
})

const ImageBoxSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  src: z
    .url()
    .refine(
      (value) => ["http:", "https:"].includes(new URL(value).protocol),
      "Image URL must be http or https",
    ),
  width: z.number().positive(),
  size: z.number().int().min(1).max(500).default(100),
  alt: z.string().optional(),
  zIndex: z.number(),
})

const BoxSchema = z.union([TextBoxSchema, ImageBoxSchema])

const SlideSchema = z.object({
  id: z.string(),
  boxes: z.array(BoxSchema),
  background: z.string().optional(),
})

const PublicIdParamsSchema = z.object({
  id: z.uuid(),
})

// Whitelist of orderable columns; the query key is never interpolated raw.
const ORDER_BY_COLUMNS = {
  lastModified: "last_modified",
  createdAt: "created_at",
} as const

const ListQuerySchema = z.object({
  orderBy: PresentationOrderBySchema.optional(),
})

const AssetBodySchema = z.object({
  contentType: z.enum([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ]),
  ext: z.string().regex(/^[a-z0-9]{1,8}$/i),
})

const defaultInitialSlides = (title: string) => [
  {
    id: crypto.randomUUID(),
    boxes: [
      {
        id: crypto.randomUUID(),
        x: 80,
        y: 180,
        text: title || "Untitled Slide",
        fontSize: 44,
        color: "text-foreground",
        zIndex: 1,
      },
    ],
  },
]

export const presentationRoutes = new Elysia()
  .use(supabaseCtx<typeof supabaseEntries>())
  .post(
    "/presentations",
    async ({ body, supabase, jwtClaims }) => {
      const { data, error } = await supabase
        .from("presentations")
        .insert({
          user_id: jwtClaims.sub,
          title: body.title,
          description: body.description ?? null,
          slides: defaultInitialSlides(body.title) as Json,
        })
        .select(
          "id, public_id, title, description, slide_count, slides, last_modified",
        )
        .single()

      if (error) throw new ApiError(Number(error.code), error.message)
      if (!data) throw new ApiError(500, "Failed to create presentation")

      return data
    },
    {
      body: z.object({
        title: z.string().min(1).max(100),
        description: z.string().max(250).nullish(),
      }),
    },
  )
  .get(
    "/presentations/:id",
    async ({ params, supabase, jwtClaims }) => {
      const { data, error } = await supabase
        .from("presentations")
        .select(
          "id, public_id, title, description, slide_count, slides, last_modified",
        )
        .eq("public_id", params.id)
        .eq("user_id", jwtClaims.sub)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          return status(404, { error: "Presentation not found" })
        }
        throw new ApiError(Number(error.code), error.message)
      }
      if (!data) return status(404, { error: "Presentation not found" })

      return data
    },
    { params: PublicIdParamsSchema },
  )
  .patch(
    "/presentations/:id",
    async ({ params, body, supabase, jwtClaims }) => {
      const { data, error } = await supabase
        .from("presentations")
        .update({
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.slides !== undefined ? { slides: body.slides as Json } : {}),
        })
        .eq("public_id", params.id)
        .eq("user_id", jwtClaims.sub)
        .select("public_id, slide_count, last_modified")
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          return status(404, { error: "Presentation not found" })
        }
        throw new ApiError(Number(error.code), error.message)
      }
      if (!data) return status(404, { error: "Presentation not found" })

      return data
    },
    {
      params: PublicIdParamsSchema,
      body: z.object({
        title: z.string().min(1).max(100).optional(),
        slides: z.array(SlideSchema).optional(),
      }),
    },
  )
  .post(
    "/presentations/:id/assets",
    async ({ params, body, supabase, jwtClaims }) => {
      const { data, error } = await supabase
        .from("presentations")
        .select("public_id")
        .eq("public_id", params.id)
        .eq("user_id", jwtClaims.sub)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          return status(404, { error: "Presentation not found" })
        }
        throw new ApiError(Number(error.code), error.message)
      }
      if (!data) return status(404, { error: "Presentation not found" })

      const key = `users/${jwtClaims.sub}/presentations/${params.id}/${crypto.randomUUID()}.${body.ext.toLowerCase()}`

      return await createAssetUploadUrl({
        key,
        contentType: body.contentType,
      })
    },
    { params: PublicIdParamsSchema, body: AssetBodySchema },
  )
  .delete(
    "/presentations",
    async ({ body, supabase, jwtClaims }) => {
      const { error } = await supabase
        .from("presentations")
        .delete()
        .eq("public_id", body.public_id)
        .eq("user_id", jwtClaims.sub)

      if (error) throw new ApiError(Number(error.code), error.message)

      return { ok: true }
    },
    { body: PresentationDeleteSchema },
  )
  .get(
    "/presentations",
    async ({ query, supabase, jwtClaims }) => {
      const orderBy = query.orderBy
      const { data, error } = await supabase
        .from("presentations")
        .select("*")
        .eq("user_id", jwtClaims.sub)
        .order(ORDER_BY_COLUMNS[orderBy?.key ?? "lastModified"], {
          ascending: orderBy?.direction === "asc",
        })
      if (error) throw error

      return data
    },
    { query: ListQuerySchema },
  )
  .patch(
    "/presentations",
    async ({ body, supabase, jwtClaims }) => {
      const { error } = await supabase
        .from("presentations")
        .update(body.fields)
        .eq("user_id", jwtClaims.sub)
        .eq("public_id", body.public_id)

      if (error) throw new ApiError(Number(error.code), error.message)

      return { ok: true }
    },
    { body: PresentationPatchSchema },
  )
