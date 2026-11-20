import type { Database } from "./database.types"

export type Presentation = Database["public"]["Tables"]["presentations"]["Row"]
export type PresentationId =
  Database["public"]["Tables"]["presentations"]["Row"]["id"]
export type PresentationInsert =
  Database["public"]["Tables"]["presentations"]["Insert"]
