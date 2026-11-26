import { useEffect, useState } from "react"

export type PresentationsLayout = "grid" | "list"

const STORAGE_KEY = "vimslides:presentations-layout"

export function usePresentationsLayout() {
  const [layout, setLayout] = useState<PresentationsLayout>(() => {
    const saved =
      typeof window === "undefined" ? null : localStorage.getItem(STORAGE_KEY)
    return saved === "grid" || saved === "list" ? saved : "grid"
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, layout)
  }, [layout])

  return { layout, setLayout }
}
