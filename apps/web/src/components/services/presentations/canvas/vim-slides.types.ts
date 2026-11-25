export type VimMode = "NORMAL" | "INSERT" | "VISUAL" | "COMMAND"
export type EditorScope = "BASE" | "TEXT"
export type TextAlign = "left" | "center" | "right"
export interface TextBox {
  id: string
  x: number
  y: number
  text: string
  fontSize: number
  color: string
  zIndex: number
  bold?: boolean
  italic?: boolean
  align?: TextAlign
}
export interface ImageBox {
  id: string
  x: number
  y: number
  src: string
  width: number
  size: number
  alt?: string
  zIndex: number
  height?: number
}
export type CanvasBox = TextBox | ImageBox
export const isImageBox = (box: CanvasBox): box is ImageBox => "src" in box
export const isTextBox = (box: CanvasBox): box is TextBox => !isImageBox(box)
export const clampImageSize = (size: number): number => {
  if (!Number.isFinite(size)) return 100
  return Math.max(1, Math.min(500, Math.round(size)))
}
export const getImageRenderedWidth = (box: ImageBox): number =>
  box.width * (clampImageSize(box.size) / 100)
export const normalizeSlides = (slides: Slide[]): Slide[] => {
  let slidesChanged = false
  const nextSlides = slides.map((slide) => {
    let slideChanged = false
    const boxes = slide.boxes.map((box): CanvasBox => {
      if (!isImageBox(box)) return box
      const height = box.height
      const size = clampImageSize(
        typeof box.size === "number" ? box.size : Number.NaN,
      )
      if (height === undefined && size === box.size) return box
      slideChanged = true
      return {
        id: box.id,
        x: box.x,
        y: box.y,
        src: box.src,
        width: box.width,
        size,
        alt: box.alt,
        zIndex: box.zIndex,
      }
    })
    if (!slideChanged) return slide
    slidesChanged = true
    return { ...slide, boxes }
  })
  return slidesChanged ? nextSlides : slides
}
export interface Slide {
  id: string
  boxes: CanvasBox[]
  background?: string
}
export interface PresentationDraft {
  id: string
  title: string
  slides: Slide[]
  updatedAt: number
}
