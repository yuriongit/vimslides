import type { Database } from "./database"

export type Presentation = Database["public"]["Tables"]["presentations"]["Row"]
export type PresentationId =
  Database["public"]["Tables"]["presentations"]["Row"]["id"]
