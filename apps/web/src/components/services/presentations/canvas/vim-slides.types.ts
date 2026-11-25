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
export interface Slide {
  id: string
  boxes: TextBox[]
  background?: string
}
export interface PresentationDraft {
  id: string
  title: string
  slides: Slide[]
  updatedAt: number
}
