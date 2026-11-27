import type { PresentationOrderBy } from "@vss/shared"
import { PresentationOrderBySchema } from "@vss/shared"
import { useEffect, useState } from "react"

export const DEFAULT_PRESENTATIONS_ORDER: PresentationOrderBy = {
  key: "lastModified",
  direction: "desc",
}

const STORAGE_KEY = "vimslides:presentations-order"

export function usePresentationsOrder() {
  const [order, setOrder] = useState<PresentationOrderBy>(() => {
    if (typeof window === "undefined") return DEFAULT_PRESENTATIONS_ORDER
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return DEFAULT_PRESENTATIONS_ORDER
    try {
      const parsed: unknown = JSON.parse(saved)
      const result = PresentationOrderBySchema.safeParse(parsed)
      return result.success ? result.data : DEFAULT_PRESENTATIONS_ORDER
    } catch {
      return DEFAULT_PRESENTATIONS_ORDER
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
  }, [order])

  return { order, setOrder }
}
