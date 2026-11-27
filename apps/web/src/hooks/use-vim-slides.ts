import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  type CanvasBox,
  clampImageSize,
  type EditorScope,
  getImageRenderedWidth,
  type ImageBox,
  isImageBox,
  isTextBox,
  normalizeSlides,
  type PresentationDraft,
  type Slide,
  type TextAlign,
  type TextBox,
  type VimMode,
} from "@/components/services/presentations/canvas/vim-slides.types"
export const LOGICAL_WIDTH = 960
export const LOGICAL_HEIGHT = 540
const SMALL_STEP = 8
const LARGE_STEP = 48
const MEGA_STEP = 128
const MARGIN = 48
type Direction = "h" | "j" | "k" | "l"
type CaseOp = "gu" | "gU" | "g~"
type TextOperator = "d" | "c" | "y" | CaseOp
type CaseKind = "lower" | "upper" | "toggle"
type FindKind = "f" | "F" | "t" | "T"
interface FindState {
  kind: FindKind
  char: string
}
interface Motion {
  target: number
  inclusive: boolean
  linewise: boolean
}
interface SearchState {
  query: string
  dir: 1 | -1
}
export interface WhichKeyBinding {
  key: string
  label: string
}
export interface WhichKeyState {
  title: string
  bindings: WhichKeyBinding[]
}
interface UseVimSlidesOptions {
  presentationId: string
  initialTitle?: string
  cloudSlides?: Slide[]
  onCloudWrite?: (slides: Slide[]) => Promise<void> | void
  onExitToDashboard?: () => void
}
const MODIFIER_KEYS = new Set([
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "AltGraph",
  "CapsLock",
  "NumLock",
  "ScrollLock",
  "OS",
  "Dead",
  "Process",
  "Unidentified",
])
const VERTICAL_KEYS = new Set(["j", "k", "ArrowUp", "ArrowDown"])
const THEME_COLOR_ALIASES: Record<string, string> = {
  foreground: "text-foreground",
  default: "text-foreground",
  primary: "text-primary",
  secondary: "text-secondary-foreground",
  muted: "text-muted-foreground",
  accent: "text-accent-foreground",
  destructive: "text-destructive",
  "chart-1": "text-chart-1",
  "chart-2": "text-chart-2",
  "chart-3": "text-chart-3",
  "chart-4": "text-chart-4",
  "chart-5": "text-chart-5",
}
const createBox = (overrides: Partial<TextBox> = {}): TextBox => ({
  id: crypto.randomUUID(),
  x: 120,
  y: 120,
  text: "New text box",
  fontSize: 28,
  color: "text-foreground",
  zIndex: 1,
  ...overrides,
})
const createImageBox = (src: string): ImageBox => ({
  id: crypto.randomUUID(),
  x: Math.round((LOGICAL_WIDTH - 360) / 2),
  y: Math.round((LOGICAL_HEIGHT - 202.5) / 2),
  src,
  width: 360,
  size: 100,
  alt: "Presentation image",
  zIndex: 1,
})
const parseImageUrl = (value: string): string | null => {
  try {
    const url = new URL(value.trim())
    if (!["http:", "https:"].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}
const createEmptySlide = (): Slide => ({
  id: crypto.randomUUID(),
  boxes: [
    createBox({
      x: 80,
      y: 180,
      text: "Untitled Slide",
      fontSize: 44,
      zIndex: 1,
    }),
  ],
})
const cloneSlideWithNewIds = (slide: Slide): Slide => ({
  ...slide,
  id: crypto.randomUUID(),
  boxes: slide.boxes.map((b) => ({ ...b, id: crypto.randomUUID() })),
})
const writeSystemClipboard = (value: string): void => {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(value).catch(() => {})
    }
  } catch {}
}
const isCaseOp = (op: TextOperator | null): op is CaseOp =>
  op === "gu" || op === "gU" || op === "g~"
const caseKindOfOp = (op: CaseOp): CaseKind =>
  op === "gu" ? "lower" : op === "gU" ? "upper" : "toggle"
function applyCase(str: string, kind: CaseKind): string {
  if (kind === "lower") return str.toLowerCase()
  if (kind === "upper") return str.toUpperCase()
  return Array.from(str)
    .map((ch) =>
      ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase(),
    )
    .join("")
}
function estimateBoxSize(box: TextBox): { w: number; h: number } {
  const lines = box.text.split("\n")
  const longest = lines.reduce((m, l) => Math.max(m, l.length), 1)
  return {
    w: Math.max(40, longest * box.fontSize * 0.55),
    h: Math.max(30, lines.length * box.fontSize * 1.3),
  }
}
function measureBoxSize(box: CanvasBox): { w: number; h: number } {
  if (!isImageBox(box)) return estimateBoxSize(box)
  const el =
    typeof document === "undefined"
      ? null
      : document.querySelector<HTMLElement>(`[data-box-id="${box.id}"]`)
  if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
    return { w: el.offsetWidth, h: el.offsetHeight }
  }
  const w = getImageRenderedWidth(box)
  const h =
    box.height && box.width > 0 ? (box.height / box.width) * w : w * (9 / 16)
  return { w, h }
}
const isWordChar = (ch: string | undefined) =>
  ch !== undefined && /[\w$]/.test(ch)
const isWhitespace = (ch: string | undefined) =>
  ch !== undefined && /\s/.test(ch)
function getLineBounds(text: string, pos: number) {
  const clamped = Math.max(0, Math.min(text.length, pos))
  const lineStart = text.lastIndexOf("\n", Math.max(0, clamped - 1)) + 1
  const nextNewline = text.indexOf("\n", clamped)
  const lineEnd = nextNewline === -1 ? text.length : nextNewline
  return { lineStart, lineEnd }
}
function clampNormal(text: string, pos: number): number {
  const p = Math.max(0, Math.min(text.length, pos))
  const { lineStart, lineEnd } = getLineBounds(text, p)
  return lineEnd > lineStart && p >= lineEnd ? lineEnd - 1 : p
}
function getLineStartByIndex(text: string, lineIdx: number): number {
  const lines = text.split("\n")
  const target = Math.max(0, Math.min(lines.length - 1, lineIdx))
  let offset = 0
  for (let i = 0; i < target; i++) offset += (lines[i]?.length ?? 0) + 1
  return offset
}
function getFirstNonBlankOnLine(text: string, pos: number): number {
  const { lineStart, lineEnd } = getLineBounds(text, pos)
  let idx = lineStart
  while (idx < lineEnd && (text[idx] === " " || text[idx] === "\t")) {
    idx++
  }
  return idx
}
function getLastNonBlankOnLine(text: string, pos: number): number {
  const { lineStart, lineEnd } = getLineBounds(text, pos)
  let idx = Math.max(lineStart, lineEnd - 1)
  while (idx > lineStart && (text[idx] === " " || text[idx] === "\t")) {
    idx--
  }
  return idx
}
function moveVerticalLine(
  text: string,
  pos: number,
  deltaLines: number,
  desiredCol?: number,
): number {
  const lines = text.split("\n")
  let offset = 0
  let currentLine = lines.length - 1
  let col = 0
  for (let i = 0; i < lines.length; i++) {
    const len = lines[i]?.length ?? 0
    if (pos <= offset + len) {
      currentLine = i
      col = pos - offset
      break
    }
    offset += len + 1
  }
  const targetLine = Math.max(
    0,
    Math.min(lines.length - 1, currentLine + deltaLines),
  )
  let targetStart = 0
  for (let i = 0; i < targetLine; i++) {
    targetStart += (lines[i]?.length ?? 0) + 1
  }
  const wanted = desiredCol ?? col
  return targetStart + Math.min(wanted, lines[targetLine]?.length ?? 0)
}
function moveWordForward(text: string, pos: number, bigWord: boolean): number {
  const len = text.length
  let i = Math.min(pos, len)
  if (i >= len) return len
  if (bigWord) {
    while (i < len && !isWhitespace(text[i])) i++
    while (i < len && isWhitespace(text[i])) i++
    return i
  }
  if (isWordChar(text[i])) {
    while (i < len && isWordChar(text[i])) i++
  } else if (!isWhitespace(text[i])) {
    while (i < len && !isWordChar(text[i]) && !isWhitespace(text[i])) i++
  }
  while (i < len && isWhitespace(text[i])) i++
  return i
}
function moveWordBackward(text: string, pos: number, bigWord: boolean): number {
  let i = Math.max(0, Math.min(pos, text.length))
  if (i === 0) return 0
  i--
  while (i > 0 && isWhitespace(text[i])) i--
  if (bigWord) {
    while (i > 0 && !isWhitespace(text[i - 1])) i--
    return i
  }
  if (isWordChar(text[i])) {
    while (i > 0 && isWordChar(text[i - 1])) i--
  } else if (!isWhitespace(text[i])) {
    while (i > 0 && !isWordChar(text[i - 1]) && !isWhitespace(text[i - 1])) {
      i--
    }
  }
  return i
}
function moveWordEnd(text: string, pos: number, bigWord: boolean): number {
  const len = text.length
  if (len === 0) return 0
  let i = Math.min(pos + 1, len - 1)
  while (i < len - 1 && isWhitespace(text[i])) i++
  if (bigWord) {
    while (i < len - 1 && !isWhitespace(text[i + 1])) i++
    return i
  }
  if (isWordChar(text[i])) {
    while (i < len - 1 && isWordChar(text[i + 1])) i++
  } else if (!isWhitespace(text[i])) {
    while (
      i < len - 1
      && !isWordChar(text[i + 1])
      && !isWhitespace(text[i + 1])
    ) {
      i++
    }
  }
  return i
}
function currentWordEnd(text: string, pos: number, bigWord: boolean): number {
  const len = text.length
  let i = Math.min(pos, len - 1)
  if (i < 0) return 0
  if (bigWord) {
    while (i < len - 1 && !isWhitespace(text[i + 1])) i++
  } else if (isWordChar(text[i])) {
    while (i < len - 1 && isWordChar(text[i + 1])) i++
  } else if (!isWhitespace(text[i])) {
    while (
      i < len - 1
      && !isWordChar(text[i + 1])
      && !isWhitespace(text[i + 1])
    ) {
      i++
    }
  }
  return i
}
function movePrevWordEnd(text: string, pos: number, bigWord: boolean): number {
  let i = Math.max(0, Math.min(pos, text.length - 1))
  if (i === 0) return 0
  if (bigWord) {
    while (i > 0 && !isWhitespace(text[i])) i--
  } else if (isWordChar(text[i])) {
    while (i > 0 && isWordChar(text[i])) i--
  } else if (!isWhitespace(text[i])) {
    while (i > 0 && !isWordChar(text[i]) && !isWhitespace(text[i])) i--
  }
  while (i > 0 && isWhitespace(text[i])) i--
  return i
}
function findCharOnLine(
  text: string,
  pos: number,
  kind: FindKind,
  target: string,
  count: number,
): number | null {
  const { lineStart, lineEnd } = getLineBounds(text, pos)
  let found = pos
  for (let c = 0; c < count; c++) {
    if (kind === "f" || kind === "t") {
      let next = -1
      for (let i = found + 1; i < lineEnd; i++) {
        if (text[i] === target) {
          next = i
          break
        }
      }
      if (next === -1) return null
      found = kind === "t" ? next - 1 : next
    } else {
      let prev = -1
      for (let i = found - 1; i >= lineStart; i--) {
        if (text[i] === target) {
          prev = i
          break
        }
      }
      if (prev === -1) return null
      found = kind === "T" ? prev + 1 : prev
    }
  }
  return found
}
function findMatchingBracket(text: string, pos: number): number | null {
  const pairs: Record<string, string> = {
    "(": ")",
    "[": "]",
    "{": "}",
    ")": "(",
    "]": "[",
    "}": "{",
  }
  const { lineEnd } = getLineBounds(text, pos)
  let idx = pos
  while (idx < lineEnd && !pairs[text[idx] ?? ""]) idx++
  if (idx >= lineEnd) return null
  const open = text[idx]
  if (open === undefined) return null
  const close = pairs[open]
  if (close === undefined) return null
  const forward = open === "(" || open === "[" || open === "{"
  let depth = 0
  if (forward) {
    for (let i = idx; i < text.length; i++) {
      if (text[i] === open) depth++
      else if (text[i] === close) {
        depth--
        if (depth === 0) return i
      }
    }
  } else {
    for (let i = idx; i >= 0; i--) {
      if (text[i] === open) depth++
      else if (text[i] === close) {
        depth--
        if (depth === 0) return i
      }
    }
  }
  return null
}
function moveParagraph(text: string, pos: number, dir: 1 | -1): number {
  const lines = text.split("\n")
  let offset = 0
  let curLine = 0
  for (let i = 0; i < lines.length; i++) {
    if (pos <= offset + (lines[i]?.length ?? 0)) {
      curLine = i
      break
    }
    offset += (lines[i]?.length ?? 0) + 1
  }
  let targetLine = curLine
  while (
    targetLine + dir >= 0
    && targetLine + dir < lines.length
    && lines[targetLine + dir]?.trim() === ""
  ) {
    targetLine += dir
  }
  while (
    targetLine + dir >= 0
    && targetLine + dir < lines.length
    && lines[targetLine + dir]?.trim() !== ""
  ) {
    targetLine += dir
  }
  if (targetLine + dir >= 0 && targetLine + dir < lines.length) {
    targetLine += dir
  }
  let res = 0
  for (let i = 0; i < targetLine; i++) res += (lines[i]?.length ?? 0) + 1
  return res
}
function resolveTextObject(
  text: string,
  pos: number,
  modifier: "i" | "a",
  obj: string,
): [number, number] | null {
  if (text.length === 0) return null
  const idx = Math.min(pos, text.length - 1)
  if (obj === "w" || obj === "W") {
    const big = obj === "W"
    let start = idx
    let end = idx
    if (isWhitespace(text[idx])) {
      while (start > 0 && isWhitespace(text[start - 1])) start--
      while (end < text.length - 1 && isWhitespace(text[end + 1])) end++
    } else if (big) {
      while (start > 0 && !isWhitespace(text[start - 1])) start--
      while (end < text.length - 1 && !isWhitespace(text[end + 1])) end++
    } else if (isWordChar(text[idx])) {
      while (start > 0 && isWordChar(text[start - 1])) start--
      while (end < text.length - 1 && isWordChar(text[end + 1])) end++
    } else {
      while (
        start > 0
        && !isWordChar(text[start - 1])
        && !isWhitespace(text[start - 1])
      ) {
        start--
      }
      while (
        end < text.length - 1
        && !isWordChar(text[end + 1])
        && !isWhitespace(text[end + 1])
      ) {
        end++
      }
    }
    if (modifier === "a") {
      if (end < text.length - 1 && isWhitespace(text[end + 1])) {
        while (end < text.length - 1 && isWhitespace(text[end + 1])) end++
      } else {
        while (start > 0 && isWhitespace(text[start - 1])) start--
      }
    }
    return [start, end + 1]
  }
  if (obj === "p") {
    const lines = text.split("\n")
    let offset = 0
    let curLine = 0
    for (let i = 0; i < lines.length; i++) {
      if (idx <= offset + (lines[i]?.length ?? 0)) {
        curLine = i
        break
      }
      offset += (lines[i]?.length ?? 0) + 1
    }
    let sLine = curLine
    let eLine = curLine
    while (sLine > 0 && lines[sLine - 1]?.trim() !== "") sLine--
    while (eLine < lines.length - 1 && lines[eLine + 1]?.trim() !== "") eLine++
    if (modifier === "a") {
      while (eLine < lines.length - 1 && lines[eLine + 1]?.trim() === "")
        eLine++
    }
    let start = 0
    for (let i = 0; i < sLine; i++) start += (lines[i]?.length ?? 0) + 1
    let end = start
    for (let i = sLine; i <= eLine; i++) end += (lines[i]?.length ?? 0) + 1
    return [start, Math.min(text.length, end)]
  }
  const bracketMap: Record<string, [string, string]> = {
    "(": ["(", ")"],
    ")": ["(", ")"],
    b: ["(", ")"],
    "[": ["[", "]"],
    "]": ["[", "]"],
    "{": ["{", "}"],
    "}": ["{", "}"],
    B: ["{", "}"],
    "<": ["<", ">"],
    ">": ["<", ">"],
  }
  if (bracketMap[obj]) {
    const [open, close] = bracketMap[obj]
    let depth = 0
    let start = -1
    for (let i = idx; i >= 0; i--) {
      if (text[i] === close && i !== idx) depth++
      else if (text[i] === open) {
        if (depth === 0) {
          start = i
          break
        }
        depth--
      }
    }
    if (start === -1) return null
    depth = 0
    let end = -1
    for (let i = start; i < text.length; i++) {
      if (text[i] === open) depth++
      else if (text[i] === close) {
        depth--
        if (depth === 0) {
          end = i
          break
        }
      }
    }
    if (end === -1) return null
    return modifier === "i" ? [start + 1, end] : [start, end + 1]
  }
  return null
}
function shiftLines(
  text: string,
  from: number,
  to: number,
  dir: 1 | -1,
  width = 2,
): { text: string; lineStart: number } {
  const { lineStart } = getLineBounds(text, from)
  const { lineEnd } = getLineBounds(text, to)
  const block = text.slice(lineStart, lineEnd)
  const dedent = new RegExp(`^( {1,${width}}|\\t)`)
  const shifted = block
    .split("\n")
    .map((line) =>
      dir > 0
        ? line.length > 0
          ? " ".repeat(width) + line
          : line
        : line.replace(dedent, ""),
    )
    .join("\n")
  return {
    text: text.slice(0, lineStart) + shifted + text.slice(lineEnd),
    lineStart,
  }
}
function getVisualSelectionBounds(
  text: string,
  anchor: number,
  cursor: number,
  linewise: boolean,
): [number, number] {
  const start = Math.min(anchor, cursor)
  const end = Math.max(anchor, cursor)
  if (!linewise) return [start, end]
  const { lineStart } = getLineBounds(text, start)
  const { lineEnd } = getLineBounds(text, end)
  return [lineStart, Math.max(lineStart, lineEnd - 1)]
}
interface SearchHit {
  slide: number
  box: number
  offset: number
}
function collectHits(slides: Slide[], query: string): SearchHit[] {
  if (!query) return []
  const insensitive = query === query.toLowerCase()
  const needle = query
  const hits: SearchHit[] = []
  slides.forEach((slide, s) => {
    slide.boxes.forEach((box, b) => {
      if (!isTextBox(box)) return
      const hay = insensitive ? box.text.toLowerCase() : box.text
      let from = 0
      while (from <= hay.length) {
        const i = hay.indexOf(needle, from)
        if (i === -1) break
        hits.push({ slide: s, box: b, offset: i })
        from = i + Math.max(1, needle.length)
      }
    })
  })
  return hits
}
const compareHit = (h: SearchHit, cur: [number, number, number]): number =>
  h.slide - cur[0] || h.box - cur[1] || h.offset - cur[2]
interface Substitution {
  pattern: string
  replacement: string
  global: boolean
  flags: string
  whole: boolean
}
function parseSubstitute(raw: string): Substitution | null {
  const whole = raw.startsWith("%")
  const body = raw.replace(/^%?s\//, "")
  const parts: string[] = []
  let cur = ""
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (ch === "\\" && i + 1 < body.length) {
      if (body[i + 1] === "/") {
        cur += "/"
      } else {
        cur += ch + body[i + 1]
      }
      i++
      continue
    }
    if (ch === "/") {
      parts.push(cur)
      cur = ""
      continue
    }
    cur += ch
  }
  parts.push(cur)
  const pattern = parts[0]
  if (parts.length < 2 || pattern === undefined || pattern === "") return null
  const rawReplacement = parts[1]
  if (rawReplacement === undefined) return null
  const modifiers = parts[2] ?? ""
  const global = modifiers.includes("g")
  const flags = (global ? "g" : "") + (modifiers.includes("i") ? "i" : "")
  const replacement = rawReplacement
    .replace(/\$/g, "$$$$")
    .replace(/\\n/g, "\n")
    .replace(/\\(\d)/g, "$$$1")
    .replace(/(?<!\\)&/g, "$$&")
    .replace(/\\&/g, "&")
  return { pattern, replacement, global, flags, whole }
}
export function useVimSlides({
  presentationId,
  initialTitle = "Untitled Presentation",
  cloudSlides,
  onCloudWrite,
  onExitToDashboard,
}: UseVimSlidesOptions) {
  const draftStorageKey = `vimslides:draft:${presentationId}`
  const draftLoadedRef = useRef(false)
  const [slides, setSlidesState] = useState<Slide[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(draftStorageKey)
        if (raw) {
          const parsed = JSON.parse(raw) as PresentationDraft
          if (Array.isArray(parsed.slides) && parsed.slides.length > 0) {
            draftLoadedRef.current = true
            return normalizeSlides(parsed.slides)
          }
        }
      } catch {}
    }
    return normalizeSlides(
      cloudSlides && cloudSlides.length > 0
        ? cloudSlides
        : [createEmptySlide()],
    )
  })
  const normalizedCloudSlides = useMemo(
    () => (cloudSlides ? normalizeSlides(cloudSlides) : null),
    [cloudSlides],
  )
  const slidesRef = useRef<Slide[]>(slides)
  const undoRef = useRef<Slide[][]>([])
  const redoRef = useRef<Slide[][]>([])
  const setSlides = useCallback((next: Slide[]) => {
    slidesRef.current = next
    setSlidesState(next)
  }, [])
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>(() =>
    JSON.stringify(
      normalizedCloudSlides && normalizedCloudSlides.length > 0
        ? normalizedCloudSlides
        : slides,
    ),
  )
  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(slides) !== lastSavedSnapshot,
    [slides, lastSavedSnapshot],
  )
  const cloudKey = useMemo(
    () =>
      normalizedCloudSlides ? JSON.stringify(normalizedCloudSlides) : null,
    [normalizedCloudSlides],
  )
  useEffect(() => {
    if (
      cloudKey === null
      || !normalizedCloudSlides
      || normalizedCloudSlides.length === 0
    ) {
      return
    }
    if (cloudKey === lastSavedSnapshot) return
    const localDiffers = JSON.stringify(slidesRef.current) !== lastSavedSnapshot
    if (draftLoadedRef.current || localDiffers) {
      setLastSavedSnapshot(cloudKey)
      return
    }
    setSlides(normalizedCloudSlides)
    undoRef.current = []
    redoRef.current = []
    setLastSavedSnapshot(cloudKey)
  }, [cloudKey, normalizedCloudSlides, lastSavedSnapshot, setSlides])
  useEffect(() => {
    try {
      const draft: PresentationDraft = {
        id: presentationId,
        title: initialTitle,
        slides,
        updatedAt: Date.now(),
      }
      window.localStorage.setItem(draftStorageKey, JSON.stringify(draft))
    } catch {}
  }, [draftStorageKey, initialTitle, presentationId, slides])
  const [mode, setMode] = useState<VimMode>("NORMAL")
  const [scope, setScope] = useState<EditorScope>("BASE")
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(
    () => slides[0]?.boxes[0]?.id ?? null,
  )
  const [textCursor, setTextCursor] = useState(0)
  const [visualAnchor, setVisualAnchor] = useState<number | null>(null)
  const [isLineVisual, setIsLineVisual] = useState(false)
  const [boxClipboard, setBoxClipboard] = useState<CanvasBox | null>(null)
  const [slideClipboard, setSlideClipboard] = useState<Slide | null>(null)
  const [textClipboard, setTextClipboard] = useState<{
    text: string
    linewise: boolean
  }>({ text: "", linewise: false })
  const [countBuffer, setCountBuffer] = useState("")
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [pendingOperator, setPendingOperator] = useState<TextOperator | null>(
    null,
  )
  const [pendingTextObjMod, setPendingTextObjMod] = useState<"i" | "a" | null>(
    null,
  )
  const [pendingFind, setPendingFind] = useState<FindKind | null>(null)
  const [pendingReplace, setPendingReplace] = useState(false)
  const [lastFind, setLastFind] = useState<FindState | null>(null)
  const [lastBaseMove, setLastBaseMove] = useState<{
    dir: Direction
    count: number
  } | null>(null)
  const [commandBuffer, setCommandBuffer] = useState("")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isErrorStatus, setIsErrorStatus] = useState(false)
  const [searchQuery, setSearchQuery] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [isPresenting, setIsPresenting] = useState(false)
  const preferredColRef = useRef<number | null>(null)
  const opCountRef = useRef(1)
  const marksRef = useRef<Record<string, string>>({})
  const prevSlideIdRef = useRef<string | null>(null)
  const lastSearchRef = useRef<SearchState | null>(null)
  const cmdHistoryRef = useRef<string[]>([])
  const cmdHistoryIdxRef = useRef(-1)
  const insertBaseRef = useRef<Slide[] | null>(null)
  const prevModeRef = useRef<VimMode>("NORMAL")
  const currentSlide = slides[activeSlideIndex] ?? slides[0]
  const selectedBox =
    currentSlide?.boxes.find((b) => b.id === selectedBoxId) ?? null
  const showStatus = useCallback((msg: string, isError = false) => {
    setStatusMessage(msg)
    setIsErrorStatus(isError)
  }, [])
  useEffect(() => {
    if (!currentSlide) return
    const exists = currentSlide.boxes.some((b) => b.id === selectedBoxId)
    if (!exists) {
      setSelectedBoxId(currentSlide.boxes[0]?.id ?? null)
      setScope("BASE")
      setMode("NORMAL")
    }
  }, [currentSlide, selectedBoxId])
  const commitSlides = useCallback(
    (updater: (prev: Slide[]) => Slide[]) => {
      const prev = slidesRef.current
      const next = updater(prev)
      if (next === prev) return
      undoRef.current = [...undoRef.current.slice(-49), prev]
      redoRef.current = []
      setSlides(next)
    },
    [setSlides],
  )
  useEffect(() => {
    const prev = prevModeRef.current
    prevModeRef.current = mode
    if (mode === "INSERT" && prev !== "INSERT") {
      insertBaseRef.current = slidesRef.current
    } else if (prev === "INSERT" && mode !== "INSERT") {
      const base = insertBaseRef.current
      insertBaseRef.current = null
      if (base && base !== slidesRef.current) {
        const top = undoRef.current[undoRef.current.length - 1]
        if (top !== base) {
          undoRef.current = [...undoRef.current.slice(-49), base]
          redoRef.current = []
        }
      }
    }
  }, [mode])
  const undo = useCallback(
    (times = 1) => {
      let done = 0
      for (let i = 0; i < times; i++) {
        const stack = undoRef.current
        if (stack.length === 0) break
        const previous = stack[stack.length - 1]
        if (previous === undefined) break
        undoRef.current = stack.slice(0, -1)
        redoRef.current = [...redoRef.current, slidesRef.current]
        setSlides(previous)
        done++
      }
      if (done === 0) {
        showStatus("Already at oldest change")
        return
      }
      const len = slidesRef.current.length
      setActiveSlideIndex((idx) => Math.min(idx, Math.max(0, len - 1)))
      showStatus(done === 1 ? "Undo" : `${done} changes undone`)
    },
    [setSlides, showStatus],
  )
  const redo = useCallback(
    (times = 1) => {
      let done = 0
      for (let i = 0; i < times; i++) {
        const stack = redoRef.current
        if (stack.length === 0) break
        const next = stack[stack.length - 1]
        if (next === undefined) break
        redoRef.current = stack.slice(0, -1)
        undoRef.current = [...undoRef.current, slidesRef.current]
        setSlides(next)
        done++
      }
      if (done === 0) {
        showStatus("Already at newest change")
        return
      }
      const len = slidesRef.current.length
      setActiveSlideIndex((idx) => Math.min(idx, Math.max(0, len - 1)))
      showStatus(done === 1 ? "Redo" : `${done} changes redone`)
    },
    [setSlides, showStatus],
  )
  const goToSlide = useCallback(
    (index: number) => {
      const list = slidesRef.current
      const clamped = Math.max(0, Math.min(list.length - 1, index))
      const from = list[activeSlideIndex]
      if (from && clamped !== activeSlideIndex) prevSlideIdRef.current = from.id
      setActiveSlideIndex(clamped)
      setSelectedBoxId(list[clamped]?.boxes[0]?.id ?? null)
      setTextCursor(0)
      setScope("BASE")
      setMode("NORMAL")
      setVisualAnchor(null)
      setIsLineVisual(false)
    },
    [activeSlideIndex],
  )
  const selectBox = useCallback((id: string | null) => {
    setSelectedBoxId(id)
    setTextCursor(0)
  }, [])
  const addTextBox = useCallback(
    (enterInsert = true) => {
      const maxZ =
        currentSlide?.boxes.reduce((m, b) => Math.max(m, b.zIndex), 0) ?? 0
      const offset = ((currentSlide?.boxes.length ?? 0) % 6) * 24
      const newBox = createBox({
        x: 140 + offset,
        y: 140 + offset,
        text: enterInsert ? "" : "Text box",
        color: "text-foreground",
        zIndex: maxZ + 1,
      })
      commitSlides((prev) =>
        prev.map((slide, idx) =>
          idx === activeSlideIndex
            ? { ...slide, boxes: [...slide.boxes, newBox] }
            : slide,
        ),
      )
      setSelectedBoxId(newBox.id)
      setTextCursor(0)
      if (enterInsert) {
        setScope("TEXT")
        setMode("INSERT")
      }
    },
    [activeSlideIndex, commitSlides, currentSlide?.boxes],
  )
  const addImageBox = useCallback(
    (src: string) => {
      const maxZ =
        currentSlide?.boxes.reduce((m, b) => Math.max(m, b.zIndex), 0) ?? 0
      const newBox = createImageBox(src)
      newBox.zIndex = maxZ + 1
      commitSlides((prev) =>
        prev.map((slide, idx) =>
          idx === activeSlideIndex
            ? { ...slide, boxes: [...slide.boxes, newBox] }
            : slide,
        ),
      )
      setSelectedBoxId(newBox.id)
      setScope("BASE")
      setMode("NORMAL")
    },
    [activeSlideIndex, commitSlides, currentSlide?.boxes],
  )
  const updateBox = useCallback(
    (
      boxId: string,
      patch: Partial<TextBox> | Partial<ImageBox>,
      recordHistory = true,
    ) => {
      const apply = (prev: Slide[]) =>
        prev.map((slide, idx) =>
          idx === activeSlideIndex
            ? {
                ...slide,
                boxes: slide.boxes.map((b) =>
                  b.id === boxId ? ({ ...b, ...patch } as CanvasBox) : b,
                ),
              }
            : slide,
        )
      if (recordHistory) {
        commitSlides(apply)
      } else {
        setSlides(apply(slidesRef.current))
      }
    },
    [activeSlideIndex, commitSlides, setSlides],
  )
  const setImageSize = useCallback(
    (boxId: string, rawSize: number) => {
      const size = clampImageSize(rawSize)
      updateBox(boxId, { size })
      showStatus(`Size ${size}`)
    },
    [showStatus, updateBox],
  )
  const setSlideBackground = useCallback(
    (background: string | undefined) => {
      commitSlides((prev) =>
        prev.map((slide, idx) =>
          idx === activeSlideIndex ? { ...slide, background } : slide,
        ),
      )
    },
    [activeSlideIndex, commitSlides],
  )
  const deleteSelectedBox = useCallback(() => {
    if (!selectedBox) return
    setBoxClipboard(selectedBox)
    commitSlides((prev) =>
      prev.map((slide, idx) =>
        idx === activeSlideIndex
          ? {
              ...slide,
              boxes: slide.boxes.filter((b) => b.id !== selectedBox.id),
            }
          : slide,
      ),
    )
    showStatus("Deleted box")
  }, [activeSlideIndex, commitSlides, selectedBox, showStatus])
  const pasteBox = useCallback(() => {
    if (!boxClipboard) {
      showStatus("Nothing in box register")
      return
    }
    const maxZ =
      currentSlide?.boxes.reduce((m, b) => Math.max(m, b.zIndex), 0) ?? 0
    const clone: CanvasBox = {
      ...boxClipboard,
      id: crypto.randomUUID(),
      x: Math.min(LOGICAL_WIDTH - 80, boxClipboard.x + 24),
      y: Math.min(LOGICAL_HEIGHT - 60, boxClipboard.y + 24),
      zIndex: maxZ + 1,
    }
    commitSlides((prev) =>
      prev.map((slide, idx) =>
        idx === activeSlideIndex
          ? { ...slide, boxes: [...slide.boxes, clone] }
          : slide,
      ),
    )
    setSelectedBoxId(clone.id)
    setTextCursor(0)
    showStatus("Pasted box")
  }, [
    activeSlideIndex,
    boxClipboard,
    commitSlides,
    currentSlide?.boxes,
    showStatus,
  ])
  const moveBox = useCallback(
    (direction: Direction, step: number, amend = false) => {
      if (!selectedBox) return
      const dx = direction === "h" ? -step : direction === "l" ? step : 0
      const dy = direction === "k" ? -step : direction === "j" ? step : 0
      updateBox(
        selectedBox.id,
        {
          x: Math.max(0, Math.min(LOGICAL_WIDTH - 40, selectedBox.x + dx)),
          y: Math.max(0, Math.min(LOGICAL_HEIGHT - 30, selectedBox.y + dy)),
        },
        !amend,
      )
    },
    [selectedBox, updateBox],
  )
  const alignBox = useCallback(
    (axis: "x" | "y", where: "start" | "center" | "end") => {
      if (!selectedBox) return
      const { w, h } = measureBoxSize(selectedBox)
      const size = axis === "x" ? w : h
      const total = axis === "x" ? LOGICAL_WIDTH : LOGICAL_HEIGHT
      const max = axis === "x" ? LOGICAL_WIDTH - 40 : LOGICAL_HEIGHT - 30
      const raw =
        where === "start"
          ? MARGIN
          : where === "center"
            ? (total - size) / 2
            : total - MARGIN - size
      updateBox(selectedBox.id, {
        [axis]: Math.round(Math.max(0, Math.min(max, raw))),
      })
      showStatus(isImageBox(selectedBox) ? "Aligned" : "Aligned (approximate)")
    },
    [selectedBox, showStatus, updateBox],
  )
  const changeBoxStackOrder = useCallback(
    (delta: 1 | -1 | "front" | "back") => {
      if (!selectedBox || !currentSlide) return
      const sorted = [...currentSlide.boxes].sort((a, b) => a.zIndex - b.zIndex)
      const idx = sorted.findIndex((b) => b.id === selectedBox.id)
      if (idx === -1) return
      const reordered = [...sorted]
      const [item] = reordered.splice(idx, 1)
      if (item === undefined) return
      if (delta === "front") {
        reordered.push(item)
      } else if (delta === "back") {
        reordered.unshift(item)
      } else {
        const targetIdx = Math.max(0, Math.min(reordered.length, idx + delta))
        reordered.splice(targetIdx, 0, item)
      }
      const zMap = new Map(reordered.map((b, i) => [b.id, i + 1]))
      commitSlides((prev) =>
        prev.map((s, sIdx) =>
          sIdx === activeSlideIndex
            ? {
                ...s,
                boxes: s.boxes.map((b) => ({
                  ...b,
                  zIndex: zMap.get(b.id) ?? b.zIndex,
                })),
              }
            : s,
        ),
      )
      showStatus("Updated stacking order")
    },
    [activeSlideIndex, commitSlides, currentSlide, selectedBox, showStatus],
  )
  const selectAdjacentBox = useCallback(
    (dir: Direction) => {
      if (!currentSlide || currentSlide.boxes.length === 0) return
      if (!selectedBox) {
        const first = currentSlide.boxes[0]
        if (first) selectBox(first.id)
        return
      }
      let best: CanvasBox | null = null
      let bestScore = Infinity
      for (const b of currentSlide.boxes) {
        if (b.id === selectedBox.id) continue
        const dx = b.x - selectedBox.x
        const dy = b.y - selectedBox.y
        const inDirection =
          dir === "l"
            ? dx > 0
            : dir === "h"
              ? dx < 0
              : dir === "j"
                ? dy > 0
                : dy < 0
        if (!inDirection) continue
        const horizontal = dir === "h" || dir === "l"
        const along = Math.abs(horizontal ? dx : dy)
        const across = Math.abs(horizontal ? dy : dx)
        const score = along + across * 2
        if (score < bestScore) {
          bestScore = score
          best = b
        }
      }
      if (best) selectBox(best.id)
      else showStatus("No box in that direction")
    },
    [currentSlide, selectBox, selectedBox, showStatus],
  )
  const addSlide = useCallback(
    (above = false) => {
      const next = createEmptySlide()
      const insertAt = above ? activeSlideIndex : activeSlideIndex + 1
      commitSlides((prev) => [
        ...prev.slice(0, insertAt),
        next,
        ...prev.slice(insertAt),
      ])
      setActiveSlideIndex(insertAt)
      setSelectedBoxId(next.boxes[0]?.id ?? null)
      setTextCursor(0)
      setScope("BASE")
      setMode("NORMAL")
      showStatus(`Added slide ${insertAt + 1}`)
    },
    [activeSlideIndex, commitSlides, showStatus],
  )
  const deleteSlide = useCallback(
    (index = activeSlideIndex) => {
      const prev = slidesRef.current
      const target = prev[index]
      if (target) setSlideClipboard(cloneSlideWithNewIds(target))
      let next: Slide[]
      let nextIdx: number
      if (prev.length <= 1) {
        next = [createEmptySlide()]
        nextIdx = 0
      } else {
        next = prev.filter((_, i) => i !== index)
        nextIdx = Math.min(index, next.length - 1)
      }
      commitSlides(() => next)
      setActiveSlideIndex(nextIdx)
      setSelectedBoxId(next[nextIdx]?.boxes[0]?.id ?? null)
      setTextCursor(0)
      setScope("BASE")
      setMode("NORMAL")
      showStatus(prev.length <= 1 ? "Cleared last slide" : "Deleted slide")
    },
    [activeSlideIndex, commitSlides, showStatus],
  )
  const yankCurrentSlide = useCallback(() => {
    if (!currentSlide) return
    setSlideClipboard(cloneSlideWithNewIds(currentSlide))
    showStatus(`Yanked slide ${activeSlideIndex + 1}`)
  }, [activeSlideIndex, currentSlide, showStatus])
  const cutCurrentSlide = useCallback(() => {
    const prev = slidesRef.current
    const target = prev[activeSlideIndex]
    if (target) setSlideClipboard(cloneSlideWithNewIds(target))
    let next: Slide[]
    let nextIdx: number
    if (prev.length <= 1) {
      next = [createEmptySlide()]
      nextIdx = 0
    } else {
      next = prev.filter((_, i) => i !== activeSlideIndex)
      nextIdx = Math.min(activeSlideIndex, next.length - 1)
    }
    commitSlides(() => next)
    setActiveSlideIndex(nextIdx)
    setSelectedBoxId(next[nextIdx]?.boxes[0]?.id ?? null)
    setTextCursor(0)
    setScope("BASE")
    setMode("NORMAL")
    showStatus(prev.length <= 1 ? "Cut last slide" : "Cut slide")
  }, [activeSlideIndex, commitSlides, showStatus])
  const pasteSlide = useCallback(
    (where: "after" | "before") => {
      if (!slideClipboard) {
        showStatus("Nothing in slide register")
        return
      }
      const cloned = cloneSlideWithNewIds(slideClipboard)
      const insertAt =
        where === "after" ? activeSlideIndex + 1 : activeSlideIndex
      commitSlides((prev) => [
        ...prev.slice(0, insertAt),
        cloned,
        ...prev.slice(insertAt),
      ])
      setActiveSlideIndex(insertAt)
      setSelectedBoxId(cloned.boxes[0]?.id ?? null)
      setTextCursor(0)
      setScope("BASE")
      setMode("NORMAL")
      showStatus(`Pasted slide ${insertAt + 1}`)
    },
    [activeSlideIndex, commitSlides, showStatus, slideClipboard],
  )
  const duplicateSlide = useCallback(() => {
    if (!currentSlide) return
    const cloned = cloneSlideWithNewIds(currentSlide)
    const insertAt = activeSlideIndex + 1
    commitSlides((prev) => [
      ...prev.slice(0, insertAt),
      cloned,
      ...prev.slice(insertAt),
    ])
    setActiveSlideIndex(insertAt)
    setSelectedBoxId(cloned.boxes[0]?.id ?? null)
    setTextCursor(0)
    setScope("BASE")
    showStatus("Duplicated slide")
  }, [activeSlideIndex, commitSlides, currentSlide, showStatus])
  const moveSlideTo = useCallback(
    (target: number) => {
      const len = slidesRef.current.length
      const t = Math.max(0, Math.min(len - 1, target))
      if (t === activeSlideIndex) return
      commitSlides((prev) => {
        const copy = [...prev]
        const [moved] = copy.splice(activeSlideIndex, 1)
        if (moved === undefined) return copy
        copy.splice(t, 0, moved)
        return copy
      })
      setActiveSlideIndex(t)
      showStatus(`Moved slide to position ${t + 1}`)
    },
    [activeSlideIndex, commitSlides, showStatus],
  )
  const reorderSlide = useCallback(
    (delta: number) => moveSlideTo(activeSlideIndex + delta),
    [activeSlideIndex, moveSlideTo],
  )
  const runSearch = useCallback(
    (dir: 1 | -1, fresh = false) => {
      const q = lastSearchRef.current
      if (!q) {
        showStatus("E35: No previous search", true)
        return
      }
      const list = slidesRef.current
      const hits = collectHits(list, q.query)
      if (hits.length === 0) {
        showStatus(`E486: Pattern not found: ${q.query}`, true)
        return
      }
      const boxIdx = Math.max(
        0,
        (list[activeSlideIndex]?.boxes ?? []).findIndex(
          (b) => b.id === selectedBoxId,
        ),
      )
      const offset = fresh && scope === "BASE" ? -1 : textCursor
      const cur: [number, number, number] = [activeSlideIndex, boxIdx, offset]
      const forward = q.dir * dir > 0
      let hit: SearchHit | undefined
      let wrapped = false
      if (forward) {
        hit = hits.find((h) => compareHit(h, cur) > 0)
        if (!hit) {
          hit = hits[0]
          wrapped = true
        }
      } else {
        for (let i = hits.length - 1; i >= 0; i--) {
          const candidate = hits[i]
          if (candidate && compareHit(candidate, cur) < 0) {
            hit = candidate
            break
          }
        }
        if (!hit) {
          hit = hits[hits.length - 1]
          wrapped = true
        }
      }
      if (!hit) return
      const targetBox = list[hit.slide]?.boxes[hit.box]
      if (!targetBox) return
      if (hit.slide !== activeSlideIndex) {
        prevSlideIdRef.current = list[activeSlideIndex]?.id ?? null
      }
      setActiveSlideIndex(hit.slide)
      setSelectedBoxId(targetBox.id)
      setTextCursor(hit.offset)
      const idx = hits.indexOf(hit) + 1
      showStatus(
        `${wrapped ? "Search wrapped: " : ""}/${q.query}  [${idx}/${hits.length}]`,
      )
    },
    [activeSlideIndex, scope, selectedBoxId, showStatus, textCursor],
  )
  const executeExCommand = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim()
      if (trimmed) {
        const hist = cmdHistoryRef.current
        if (hist[hist.length - 1] !== trimmed) hist.push(trimmed)
      }
      cmdHistoryIdxRef.current = -1
      const [cmd = "", ...args] = trimmed.split(/\s+/)
      const arg = args.join(" ")
      const writeToCloud = async (): Promise<boolean> => {
        try {
          const snapshot = slidesRef.current
          await onCloudWrite?.(snapshot)
          setLastSavedSnapshot(JSON.stringify(snapshot))
          return true
        } catch {
          showStatus("E212: Can't write to cloud (changes kept locally)", true)
          return false
        }
      }
      let handled = false
      if (/^%?s\//.test(trimmed)) {
        handled = true
        const sub = parseSubstitute(trimmed)
        if (!sub) {
          showStatus(
            "Usage: :s/pattern/replacement/[gi]  (:%s for all slides)",
            true,
          )
        } else {
          let regex: RegExp | null = null
          try {
            regex = new RegExp(sub.pattern, sub.flags)
          } catch {
            showStatus(`E486: Invalid pattern: ${sub.pattern}`, true)
          }
          if (regex) {
            const re = regex
            const probe = new RegExp(re.source, re.flags.replace("g", ""))
            let total = 0
            const subText = (t: string) =>
              t
                .split("\n")
                .map((line) => {
                  if (!probe.test(line)) return line
                  total += sub.global ? (line.match(re)?.length ?? 1) : 1
                  return line.replace(re, sub.replacement)
                })
                .join("\n")
            const next = slidesRef.current.map((slide, si) =>
              sub.whole || si === activeSlideIndex
                ? {
                    ...slide,
                    boxes: slide.boxes.map((b) =>
                      isTextBox(b) && (sub.whole || b.id === selectedBoxId)
                        ? { ...b, text: subText(b.text) }
                        : b,
                    ),
                  }
                : slide,
            )
            if (total === 0) {
              showStatus(`E486: Pattern not found: ${sub.pattern}`, true)
            } else {
              commitSlides(() => next)
              showStatus(`${total} substitution${total === 1 ? "" : "s"}`)
            }
          }
        }
      } else if (trimmed.startsWith("/") || trimmed.startsWith("?")) {
        handled = true
        const query = trimmed.slice(1)
        if (query) {
          lastSearchRef.current = {
            query,
            dir: trimmed.startsWith("/") ? 1 : -1,
          }
          setSearchQuery(query)
        }
        runSearch(1, true)
      }
      if (!handled) {
        switch (cmd) {
          case "w":
          case "write": {
            if (await writeToCloud()) {
              showStatus(
                `"${initialTitle}" ${slidesRef.current.length} slides written to cloud`,
              )
            }
            break
          }
          case "wq": {
            if (await writeToCloud()) {
              showStatus("Written. Leaving presentation...")
              onExitToDashboard?.()
            }
            break
          }
          case "x":
          case "xit":
          case "exit": {
            if (!hasUnsavedChanges || (await writeToCloud())) {
              onExitToDashboard?.()
            }
            break
          }
          case "q":
          case "quit": {
            if (isPresenting) {
              setIsPresenting(false)
            } else if (hasUnsavedChanges) {
              showStatus(
                "E37: No write since last change (add ! to override)",
                true,
              )
            } else {
              onExitToDashboard?.()
            }
            break
          }
          case "q!": {
            try {
              window.localStorage.removeItem(draftStorageKey)
            } catch {}
            onExitToDashboard?.()
            break
          }
          case "present": {
            setScope("BASE")
            setMode("NORMAL")
            setIsPresenting(true)
            break
          }
          case "export": {
            showStatus("Preparing PDF export...")
            window.print()
            break
          }
          case "img":
          case "image": {
            const src = parseImageUrl(arg)
            if (!src) {
              showStatus("Usage: :img <http(s) image URL>", true)
              break
            }
            addImageBox(src)
            showStatus("Image added")
            break
          }
          case "undo": {
            undo()
            break
          }
          case "redo": {
            redo()
            break
          }
          case "noh":
          case "nohlsearch": {
            setSearchQuery(null)
            break
          }
          case "bold": {
            if (!selectedBox || !isTextBox(selectedBox)) {
              showStatus("Usage: :bold (with a box selected)", true)
              break
            }
            const nextBold = !selectedBox.bold
            updateBox(selectedBox.id, { bold: nextBold })
            showStatus(nextBold ? "Bold enabled" : "Bold disabled")
            break
          }
          case "italic": {
            if (!selectedBox || !isTextBox(selectedBox)) {
              showStatus("Usage: :italic (with a box selected)", true)
              break
            }
            const nextItalic = !selectedBox.italic
            updateBox(selectedBox.id, { italic: nextItalic })
            showStatus(nextItalic ? "Italic enabled" : "Italic disabled")
            break
          }
          case "align": {
            const dir = arg.trim().toLowerCase()
            if (dir !== "left" && dir !== "center" && dir !== "right") {
              showStatus("Usage: :align <left|center|right>", true)
              break
            }
            if (!selectedBox || !isTextBox(selectedBox)) {
              showStatus(
                "Usage: :align <left|center|right> (with a text box selected)",
                true,
              )
              break
            }
            updateBox(selectedBox.id, { align: dir as TextAlign })
            showStatus(`Alignment set to ${dir}`)
            break
          }
          case "bg": {
            const colorArg = arg.trim()
            if (!colorArg) {
              setSlideBackground(undefined)
              showStatus("Slide background reset to default")
              break
            }
            const valid =
              typeof CSS !== "undefined" && typeof CSS.supports === "function"
                ? CSS.supports("background-color", colorArg)
                : true
            if (!valid) {
              showStatus(`E474: Invalid background color: ${colorArg}`, true)
              break
            }
            setSlideBackground(colorArg)
            showStatus(`Slide background set to ${colorArg}`)
            break
          }
          case "bullets":
          case "bullet":
          case "bull": {
            if (scope !== "TEXT" || !selectedBox || !isTextBox(selectedBox)) {
              showStatus(
                "Usage: :bullets <d|c> (enter TEXT scope first with gj)",
                true,
              )
              break
            }
            const kind = arg.trim()
            if (kind !== "d" && kind !== "c") {
              showStatus("Usage: :bullets <d|c>  (d = dash, c = circle)", true)
              break
            }
            const marker = kind === "d" ? "- " : "\u2022 "
            const t = selectedBox.text
            const { lineStart, lineEnd } = getLineBounds(t, textCursor)
            const line = t.slice(lineStart, lineEnd)
            const indent = line.match(/^[ \t]*/)?.[0] ?? ""
            const stripped = line
              .slice(indent.length)
              .replace(/^(?:[-•]\s+)/, "")
            const nextLine = `${indent}${marker}${stripped}`
            const nextText = t.slice(0, lineStart) + nextLine + t.slice(lineEnd)
            updateBox(selectedBox.id, { text: nextText })
            setTextCursor(
              clampNormal(nextText, lineStart + indent.length + marker.length),
            )
            break
          }
          case "size": {
            const relative = /^[+-]\d+$/.test(arg)
            const numeric = /^[+-]?\d+$/.test(arg)
            const parsed = Number(arg)
            if (!selectedBox || !numeric) {
              showStatus(
                "Usage: :size <1-500|+N|-N> (with a text box or image selected)",
                true,
              )
              break
            }
            if (isImageBox(selectedBox)) {
              const next = relative ? selectedBox.size + parsed : parsed
              setImageSize(selectedBox.id, next)
              break
            }
            if (isTextBox(selectedBox)) {
              const next = relative ? selectedBox.fontSize + parsed : parsed
              if (next >= 10 && next <= 160) {
                updateBox(selectedBox.id, { fontSize: next })
                showStatus(`Font size set to ${next}px`)
                break
              }
            }
            showStatus(
              "Usage: :size <10-160|+N|-N> (with a text box selected)",
              true,
            )
            break
          }
          case "color": {
            if (!selectedBox || !isTextBox(selectedBox) || !arg) {
              showStatus("Usage: :color <theme-token|hex|css-color>", true)
              break
            }
            const normalized = arg.toLowerCase()
            const aliased = THEME_COLOR_ALIASES[normalized]
            if (aliased) {
              updateBox(selectedBox.id, { color: aliased })
              showStatus(`Color set to ${aliased}`)
              break
            }
            if (arg.startsWith("text-")) {
              updateBox(selectedBox.id, { color: arg })
              showStatus(`Color set to ${arg}`)
              break
            }
            const valid =
              typeof CSS !== "undefined" && typeof CSS.supports === "function"
                ? CSS.supports("color", arg)
                : true
            if (valid) {
              updateBox(selectedBox.id, { color: arg })
              showStatus(`Color set to ${arg}`)
            } else {
              showStatus(`E474: Invalid color: ${arg}`, true)
            }
            break
          }
          case "s": {
            if (arg === "new" || arg === "add") addSlide(false)
            else if (arg === "newabove" || arg === "above") addSlide(true)
            else if (arg === "del" || arg === "delete") deleteSlide()
            else if (arg === "dup" || arg === "duplicate") duplicateSlide()
            else if (arg === "up") reorderSlide(-1)
            else if (arg === "down") reorderSlide(1)
            else {
              showStatus(
                "Usage: :s <new|newabove|del|dup|up|down>  or  :s/pat/repl/",
                true,
              )
            }
            break
          }
          case "m":
          case "move": {
            const n = parseInt(arg, 10)
            if (Number.isNaN(n)) showStatus("Usage: :m <slide number>", true)
            else moveSlideTo(n - 1)
            break
          }
          case "first": {
            goToSlide(0)
            break
          }
          case "$":
          case "last": {
            goToSlide(slidesRef.current.length - 1)
            break
          }
          case "next": {
            goToSlide(activeSlideIndex + 1)
            break
          }
          case "prev":
          case "previous": {
            goToSlide(activeSlideIndex - 1)
            break
          }
          case "front": {
            changeBoxStackOrder("front")
            break
          }
          case "back": {
            changeBoxStackOrder("back")
            break
          }
          default: {
            if (/^\d+$/.test(cmd)) {
              goToSlide(parseInt(cmd, 10) - 1)
            } else if (cmd.length > 0) {
              showStatus(`E492: Not an editor command: ${cmd}`, true)
            }
          }
        }
      }
      setCommandBuffer("")
      setMode("NORMAL")
    },
    [
      activeSlideIndex,
      addImageBox,
      addSlide,
      changeBoxStackOrder,
      commitSlides,
      deleteSlide,
      draftStorageKey,
      duplicateSlide,
      goToSlide,
      hasUnsavedChanges,
      initialTitle,
      isPresenting,
      moveSlideTo,
      onCloudWrite,
      onExitToDashboard,
      redo,
      reorderSlide,
      runSearch,
      scope,
      selectedBox,
      selectedBoxId,
      setImageSize,
      setSlideBackground,
      showStatus,
      textCursor,
      undo,
      updateBox,
    ],
  )
  useEffect(() => {
    const resetAllPending = () => {
      setCountBuffer("")
      setPendingKey(null)
      setPendingOperator(null)
      setPendingTextObjMod(null)
      setPendingFind(null)
      setPendingReplace(false)
      setLastBaseMove(null)
      opCountRef.current = 1
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (MODIFIER_KEYS.has(e.key)) return
      if (
        mode !== "INSERT"
        && (e.target instanceof HTMLInputElement
          || e.target instanceof HTMLSelectElement)
      ) {
        return
      }
      setStatusMessage(null)
      const rawCount = countBuffer ? parseInt(countBuffer, 10) : 1
      const count = rawCount * opCountRef.current
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        e.preventDefault()
        if (mode !== "INSERT" && mode !== "COMMAND") redo(rawCount)
        return
      }
      if (e.key === "Escape" || (e.ctrlKey && e.key === "[")) {
        e.preventDefault()
        const hadPending =
          countBuffer !== ""
          || pendingKey !== null
          || pendingOperator !== null
          || pendingTextObjMod !== null
          || pendingFind !== null
          || pendingReplace
        resetAllPending()
        setCommandBuffer("")
        cmdHistoryIdxRef.current = -1
        if (isPresenting) {
          setIsPresenting(false)
          return
        }
        if (mode === "COMMAND") {
          setMode("NORMAL")
          return
        }
        if (mode === "INSERT") {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur()
          }
          const t =
            selectedBox && isTextBox(selectedBox) ? selectedBox.text : ""
          setTextCursor((c) => {
            const { lineStart } = getLineBounds(t, c)
            return c > lineStart ? c - 1 : c
          })
          setMode("NORMAL")
          return
        }
        if (mode === "VISUAL") {
          setVisualAnchor(null)
          setIsLineVisual(false)
          setMode("NORMAL")
          return
        }
        if (hadPending) return
        if (scope === "TEXT") {
          setScope("BASE")
        }
        return
      }
      if (isPresenting) {
        if (e.metaKey || e.ctrlKey || e.altKey) return
        const last = slides.length - 1
        const goPresent = (i: number) =>
          setActiveSlideIndex(Math.max(0, Math.min(last, i)))
        if (/^[1-9]$/.test(e.key) || (e.key === "0" && countBuffer !== "")) {
          e.preventDefault()
          setCountBuffer((c) => c + e.key)
          return
        }
        const n = countBuffer ? parseInt(countBuffer, 10) : 1
        const hasCount = countBuffer !== ""
        setCountBuffer("")
        if (pendingKey === "g") {
          e.preventDefault()
          if (e.key === "g") goPresent(hasCount ? n - 1 : 0)
          setPendingKey(null)
          return
        }
        switch (e.key) {
          case "g":
            e.preventDefault()
            setPendingKey("g")
            if (hasCount) setCountBuffer(String(n))
            break
          case "G":
            e.preventDefault()
            goPresent(hasCount ? n - 1 : last)
            break
          case "0":
          case "Home":
            e.preventDefault()
            goPresent(0)
            break
          case "$":
          case "End":
            e.preventDefault()
            goPresent(last)
            break
          case "j":
          case "l":
          case "ArrowDown":
          case "ArrowRight":
          case "PageDown":
          case " ":
          case "Enter":
            e.preventDefault()
            setActiveSlideIndex((i) => Math.min(last, i + n))
            break
          case "k":
          case "h":
          case "ArrowUp":
          case "ArrowLeft":
          case "PageUp":
          case "Backspace":
            e.preventDefault()
            setActiveSlideIndex((i) => Math.max(0, i - n))
            break
          case "q":
            e.preventDefault()
            setIsPresenting(false)
            break
        }
        return
      }
      if (mode === "INSERT") {
        if (
          e.key === "Enter"
          && !e.shiftKey
          && !e.metaKey
          && !e.ctrlKey
          && !e.altKey
          && !e.isComposing
          && scope === "TEXT"
          && selectedBox
          && isTextBox(selectedBox)
        ) {
          const t = selectedBox.text
          const pos = Math.max(0, Math.min(t.length, textCursor))
          const { lineStart, lineEnd } = getLineBounds(t, pos)
          const line = t.slice(lineStart, lineEnd)
          const emptyBullet = line.match(/^([ \t]*)([-•])[ \t]*$/)
          if (emptyBullet) {
            e.preventDefault()
            const nextText = t.slice(0, lineStart) + t.slice(lineEnd)
            updateBox(selectedBox.id, { text: nextText }, false)
            setTextCursor(lineStart)
            return
          }
          const bulletMatch = line.match(/^([ \t]*)([-•])([ \t]+)/)
          if (bulletMatch) {
            e.preventDefault()
            const prefix = `${bulletMatch[1]}${bulletMatch[2]} `
            const nextText = `${t.slice(0, pos)}\n${prefix}${t.slice(pos)}`
            updateBox(selectedBox.id, { text: nextText }, false)
            setTextCursor(pos + 1 + prefix.length)
            return
          }
        }
        return
      }
      if (mode === "COMMAND") {
        const isCopy = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c"
        const isPaste = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v"
        if (!isPaste) e.preventDefault()
        const hist = cmdHistoryRef.current
        if (e.key === "Enter") {
          void executeExCommand(commandBuffer)
        } else if (e.key === "Backspace") {
          if (commandBuffer.length === 0) setMode("NORMAL")
          else setCommandBuffer((c) => c.slice(0, -1))
        } else if (e.key === "ArrowUp") {
          if (hist.length > 0) {
            const idx =
              cmdHistoryIdxRef.current < 0
                ? hist.length - 1
                : Math.max(0, cmdHistoryIdxRef.current - 1)
            cmdHistoryIdxRef.current = idx
            const cmd = hist[idx]
            if (cmd !== undefined) setCommandBuffer(cmd)
          }
        } else if (e.key === "ArrowDown") {
          if (cmdHistoryIdxRef.current >= 0) {
            const idx = cmdHistoryIdxRef.current + 1
            if (idx >= hist.length) {
              cmdHistoryIdxRef.current = -1
              setCommandBuffer("")
            } else {
              const cmd = hist[idx]
              cmdHistoryIdxRef.current = idx
              if (cmd !== undefined) setCommandBuffer(cmd)
            }
          }
        } else if (e.ctrlKey && e.key === "u") {
          setCommandBuffer("")
        } else if (e.ctrlKey && e.key === "w") {
          setCommandBuffer((c) => c.replace(/\s*\S+\s*$/, ""))
        } else if (isCopy) {
          writeSystemClipboard(commandBuffer)
          showStatus("Command copied")
        } else if (isPaste) {
          // Paste event inserts the clipboard text into the command buffer.
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
          setCommandBuffer((c) => c + e.key)
        }
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const box = selectedBox
      const text = box && isTextBox(box) ? box.text : ""
      const visualRange = (): [number, number] | null =>
        mode === "VISUAL" && visualAnchor !== null
          ? getVisualSelectionBounds(
              text,
              visualAnchor,
              textCursor,
              isLineVisual,
            )
          : null
      const exitVisual = (keepMode = false) => {
        setVisualAnchor(null)
        setIsLineVisual(false)
        if (!keepMode) setMode("NORMAL")
      }
      const applyRangeOperator = (
        op: TextOperator,
        start: number,
        end: number,
        linewise = false,
      ) => {
        if (!box) return
        let s = Math.max(0, Math.min(start, end))
        let eIdx = Math.min(text.length, Math.max(start, end))
        if (linewise && op === "d") {
          if (eIdx < text.length && text[eIdx] === "\n") eIdx += 1
          else if (eIdx >= text.length && s > 0 && text[s - 1] === "\n") s -= 1
        }
        const slice = text.slice(s, eIdx)
        if (isCaseOp(op)) {
          if (slice.length === 0) return
          const nextText =
            text.slice(0, s)
            + applyCase(slice, caseKindOfOp(op))
            + text.slice(eIdx)
          updateBox(box.id, { text: nextText })
          setTextCursor(clampNormal(nextText, linewise ? textCursor : s))
          return
        }
        const register = linewise
          ? slice.replace(/^\n/, "").replace(/\n$/, "")
          : slice
        setTextClipboard({ text: register, linewise })
        writeSystemClipboard(register)
        if (op === "y") {
          showStatus(
            linewise ? "Yanked line(s)" : `Yanked ${slice.length} chars`,
          )
          setTextCursor(clampNormal(text, linewise ? textCursor : s))
          return
        }
        const nextText = text.slice(0, s) + text.slice(eIdx)
        updateBox(box.id, { text: nextText })
        if (op === "c") {
          setTextCursor(Math.max(0, Math.min(s, nextText.length)))
          setMode("INSERT")
        } else {
          setTextCursor(
            linewise
              ? getFirstNonBlankOnLine(nextText, Math.min(s, nextText.length))
              : clampNormal(nextText, s),
          )
        }
      }
      const applyMotionOperator = (op: TextOperator, m: Motion) => {
        if (m.linewise) {
          const sB = getLineBounds(text, textCursor)
          const eB = getLineBounds(text, m.target)
          applyRangeOperator(
            op,
            Math.min(sB.lineStart, eB.lineStart),
            Math.max(sB.lineEnd, eB.lineEnd),
            true,
          )
        } else {
          const start = Math.min(textCursor, m.target)
          const rawEnd = Math.max(textCursor, m.target)
          const end = m.inclusive ? Math.min(text.length, rawEnd + 1) : rawEnd
          applyRangeOperator(op, start, end, false)
        }
      }
      const transformSelection = (kind: CaseKind) => {
        const range = visualRange()
        if (!range || !box) return
        const [s, end] = range
        const nextText =
          text.slice(0, s)
          + applyCase(text.slice(s, end + 1), kind)
          + text.slice(end + 1)
        updateBox(box.id, { text: nextText })
        setTextCursor(clampNormal(nextText, s))
        exitVisual()
      }
      const doubledLineRange = () => {
        const { lineStart } = getLineBounds(text, textCursor)
        let endPos = textCursor
        for (let i = 1; i < count; i++)
          endPos = moveVerticalLine(text, endPos, 1)
        const { lineEnd } = getLineBounds(text, endPos)
        return { lineStart, lineEnd }
      }
      if (scope === "TEXT" && box) {
        if (pendingReplace) {
          e.preventDefault()
          const ch =
            e.key === "Enter" ? "\n" : e.key.length === 1 ? e.key : null
          if (ch !== null && text.length > 0) {
            const range = visualRange()
            if (range) {
              const [s, end] = range
              const seg = text.slice(s, end + 1).replace(/[^\n]/g, ch)
              updateBox(box.id, {
                text: text.slice(0, s) + seg + text.slice(end + 1),
              })
              setTextCursor(clampNormal(text, s))
              exitVisual()
            } else {
              const idx = Math.min(textCursor, text.length - 1)
              const { lineEnd } = getLineBounds(text, idx)
              if (idx + count <= lineEnd) {
                const repl = ch === "\n" ? "\n" : ch.repeat(count)
                const nextText =
                  text.slice(0, idx) + repl + text.slice(idx + count)
                updateBox(box.id, { text: nextText })
                setTextCursor(ch === "\n" ? idx + 1 : idx + count - 1)
              }
            }
          }
          resetAllPending()
          return
        }
        if (pendingFind) {
          e.preventDefault()
          if (e.key.length === 1) {
            const foundPos = findCharOnLine(
              text,
              textCursor,
              pendingFind,
              e.key,
              count,
            )
            setLastFind({ kind: pendingFind, char: e.key })
            if (foundPos !== null) {
              if (pendingOperator) {
                applyMotionOperator(pendingOperator, {
                  target: foundPos,
                  inclusive: pendingFind === "f" || pendingFind === "t",
                  linewise: false,
                })
              } else {
                setTextCursor(foundPos)
              }
            }
          }
          resetAllPending()
          return
        }
      }
      if (pendingKey && pendingKey !== "g") {
        const k = pendingKey
        resetAllPending()
        if (k === "p" && scope === "BASE") {
          e.preventDefault()
          if (e.key === "s") pasteSlide("after")
          else if (e.key === "S") pasteSlide("before")
          return
        }
        e.preventDefault()
        if (k === "s" && scope === "BASE") {
          if (e.key === "g") goToSlide(countBuffer ? count - 1 : 0)
          else if (e.key === "G") goToSlide(slides.length - 1)
          else if (e.key === "j") goToSlide(activeSlideIndex + count)
          else if (e.key === "k") goToSlide(activeSlideIndex - count)
          return
        }
        if (k === "S" && scope === "BASE") {
          return
        }
        if (k === "Z") {
          if (e.key === "Z") void executeExCommand("wq")
          else if (e.key === "Q") void executeExCommand("q!")
          return
        }
        if (k === "m") {
          if (/^[a-zA-Z0-9]$/.test(e.key) && currentSlide) {
            marksRef.current[e.key] = currentSlide.id
            showStatus(`Mark '${e.key}' set on slide ${activeSlideIndex + 1}`)
          }
          return
        }
        if (k === "'") {
          const id =
            e.key === "'" ? prevSlideIdRef.current : marksRef.current[e.key]
          const idx = id ? slides.findIndex((s) => s.id === id) : -1
          if (idx === -1) showStatus("E20: Mark not set", true)
          else goToSlide(idx)
          return
        }
        if (k === "z" && box) {
          switch (e.key) {
            case "t":
              alignBox("y", "start")
              break
            case "z":
              alignBox("y", "center")
              break
            case "b":
              alignBox("y", "end")
              break
            case "h":
              alignBox("x", "start")
              break
            case "c":
              alignBox("x", "center")
              break
            case "l":
              alignBox("x", "end")
              break
          }
          return
        }
        if ((k === ">" || k === "<") && box) {
          if (e.key === k) {
            const to = moveVerticalLine(text, textCursor, count - 1)
            const res = shiftLines(text, textCursor, to, k === ">" ? 1 : -1)
            updateBox(box.id, { text: res.text })
            setTextCursor(getFirstNonBlankOnLine(res.text, res.lineStart))
          }
          return
        }
        return
      }
      if (/^[1-9]$/.test(e.key) || (e.key === "0" && countBuffer.length > 0)) {
        e.preventDefault()
        setCountBuffer((c) => c + e.key)
        return
      }
      if (pendingKey === "g") {
        e.preventDefault()
        const key = e.key
        if (key === "j") {
          if (box && isTextBox(box)) {
            setScope("TEXT")
            setTextCursor((c) => clampNormal(text, c))
          } else if (box) {
            showStatus("Images have no text scope", true)
          }
          resetAllPending()
          return
        }
        if (key === "k") {
          setVisualAnchor(null)
          setIsLineVisual(false)
          setMode("NORMAL")
          setScope("BASE")
          resetAllPending()
          return
        }
        if (scope === "BASE") {
          resetAllPending()
          return
        }
        if (scope === "TEXT" && box) {
          if (key === "u" || key === "U" || key === "~") {
            const op = `g${key}` as CaseOp
            if (mode === "VISUAL" && visualAnchor !== null) {
              transformSelection(caseKindOfOp(op))
              resetAllPending()
              return
            }
            if (pendingOperator === op) {
              const { lineStart, lineEnd } = doubledLineRange()
              applyRangeOperator(op, lineStart, lineEnd, true)
              resetAllPending()
              return
            }
            opCountRef.current = rawCount
            setCountBuffer("")
            setPendingKey(null)
            setPendingOperator(op)
            return
          }
          let target: number | null = null
          let inclusive = true
          let linewise = false
          if (key === "g") {
            const lineIdx = countBuffer ? count - 1 : 0
            target = getFirstNonBlankOnLine(
              text,
              getLineStartByIndex(text, lineIdx),
            )
            linewise = true
          } else if (key === "M") {
            const { lineStart, lineEnd } = getLineBounds(text, textCursor)
            target = lineStart + Math.floor((lineEnd - lineStart) / 2)
            inclusive = false
          } else if (key === "e") {
            target = textCursor
            for (let i = 0; i < count; i++) {
              target = movePrevWordEnd(text, target, false)
            }
          } else if (key === "E") {
            target = textCursor
            for (let i = 0; i < count; i++) {
              target = movePrevWordEnd(text, target, true)
            }
          } else if (key === "_") {
            target = getLastNonBlankOnLine(text, textCursor)
          } else if (key === "J") {
            const { lineEnd } = getLineBounds(text, textCursor)
            if (lineEnd < text.length) {
              updateBox(box.id, {
                text: text.slice(0, lineEnd) + text.slice(lineEnd + 1),
              })
              setTextCursor(lineEnd)
            }
          }
          if (target !== null) {
            if (pendingOperator) {
              applyMotionOperator(pendingOperator, {
                target,
                inclusive,
                linewise,
              })
            } else {
              setTextCursor(clampNormal(text, target))
            }
          }
          resetAllPending()
          return
        }
      }
      if (
        scope === "BASE"
        && lastBaseMove
        && (e.key === "f" || e.key === "g")
      ) {
        e.preventDefault()
        const targetStep = e.key === "g" ? MEGA_STEP : LARGE_STEP
        const remainingDelta = (targetStep - SMALL_STEP) * lastBaseMove.count
        moveBox(lastBaseMove.dir, remainingDelta, true)
        resetAllPending()
        return
      }
      if (scope === "BASE" && pendingOperator) {
        e.preventDefault()
        if (pendingOperator === "d" && e.key === "d") {
          deleteSelectedBox()
        } else if (pendingOperator === "d" && e.key === "S") {
          cutCurrentSlide()
        } else if (pendingOperator === "y" && e.key === "y" && selectedBox) {
          setBoxClipboard(selectedBox)
          showStatus("Yanked box")
        } else if (pendingOperator === "y" && e.key === "S") {
          yankCurrentSlide()
        } else if (pendingOperator === "c" && e.key === "c" && selectedBox) {
          if (isTextBox(selectedBox)) {
            updateBox(selectedBox.id, { text: "" })
            setTextCursor(0)
            setScope("TEXT")
            setMode("INSERT")
          } else {
            showStatus("Images have no text scope", true)
          }
        }
        resetAllPending()
        return
      }
      if (e.key === "g") {
        e.preventDefault()
        setPendingKey("g")
        return
      }
      if (e.key === ":") {
        e.preventDefault()
        setMode("COMMAND")
        setCommandBuffer("")
        cmdHistoryIdxRef.current = -1
        resetAllPending()
        return
      }
      if (e.key === "/" || e.key === "?") {
        e.preventDefault()
        setMode("COMMAND")
        setCommandBuffer(e.key)
        cmdHistoryIdxRef.current = -1
        resetAllPending()
        return
      }
      if (e.key === "n" || e.key === "N") {
        e.preventDefault()
        runSearch(e.key === "n" ? 1 : -1)
        resetAllPending()
        return
      }
      if (e.key === "u" && mode !== "VISUAL") {
        e.preventDefault()
        undo(rawCount)
        resetAllPending()
        return
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault()
        setZoom((z) => Math.min(200, z + 10))
        resetAllPending()
        return
      }
      if (e.key === "-") {
        e.preventDefault()
        setZoom((z) => Math.max(40, z - 10))
        resetAllPending()
        return
      }
      if (e.key === "0" && scope === "BASE") {
        e.preventDefault()
        setZoom(100)
        resetAllPending()
        return
      }
      if (
        (e.key === "Z" || e.key === "m" || e.key === "'")
        && !pendingOperator
        && !pendingTextObjMod
      ) {
        e.preventDefault()
        setPendingKey(e.key)
        return
      }
      if (scope === "BASE") {
        setLastBaseMove(null)
        switch (e.key) {
          case "h":
          case "j":
          case "k":
          case "l": {
            e.preventDefault()
            const dir = e.key as Direction
            moveBox(dir, SMALL_STEP * count)
            setCountBuffer("")
            setLastBaseMove({ dir, count })
            break
          }
          case "H":
          case "J":
          case "K":
          case "L": {
            e.preventDefault()
            selectAdjacentBox(e.key.toLowerCase() as Direction)
            resetAllPending()
            break
          }
          case "Tab":
            e.preventDefault()
            if (currentSlide && currentSlide.boxes.length > 0) {
              const idx = currentSlide.boxes.findIndex(
                (b) => b.id === selectedBoxId,
              )
              const nextIdx = e.shiftKey
                ? (idx - 1 + currentSlide.boxes.length)
                  % currentSlide.boxes.length
                : (idx + 1) % currentSlide.boxes.length
              const next = currentSlide.boxes[nextIdx]
              if (next) selectBox(next.id)
            }
            resetAllPending()
            break
          case "s":
          case "S":
            e.preventDefault()
            setPendingKey(e.key)
            break
          case "(":
            e.preventDefault()
            reorderSlide(-count)
            resetAllPending()
            break
          case ")":
            e.preventDefault()
            reorderSlide(count)
            resetAllPending()
            break
          case "o":
            e.preventDefault()
            addTextBox(true)
            resetAllPending()
            break
          case "i":
          case "Enter":
            e.preventDefault()
            if (selectedBox && isTextBox(selectedBox)) {
              setTextCursor((c) => Math.min(c, selectedBox.text.length))
              setScope("TEXT")
              setMode("INSERT")
            } else if (selectedBox) {
              showStatus("Images have no text scope", true)
            } else {
              addTextBox(true)
            }
            resetAllPending()
            break
          case "I":
            e.preventDefault()
            if (selectedBox && isTextBox(selectedBox)) {
              setTextCursor(0)
              setScope("TEXT")
              setMode("INSERT")
            } else if (selectedBox) {
              showStatus("Images have no text scope", true)
            }
            resetAllPending()
            break
          case "A":
            e.preventDefault()
            if (selectedBox && isTextBox(selectedBox)) {
              setTextCursor(selectedBox.text.length)
              setScope("TEXT")
              setMode("INSERT")
            } else if (selectedBox) {
              showStatus("Images have no text scope", true)
            }
            resetAllPending()
            break
          case "d":
            e.preventDefault()
            setPendingOperator("d")
            break
          case "c":
            e.preventDefault()
            setPendingOperator("c")
            break
          case "x":
            e.preventDefault()
            deleteSelectedBox()
            resetAllPending()
            break
          case "y":
            e.preventDefault()
            setPendingOperator("y")
            break
          case "p":
            e.preventDefault()
            setPendingKey("p")
            break
          case "P":
            e.preventDefault()
            pasteBox()
            resetAllPending()
            break
          case "]":
            e.preventDefault()
            changeBoxStackOrder(1)
            resetAllPending()
            break
          case "[":
            e.preventDefault()
            changeBoxStackOrder(-1)
            resetAllPending()
            break
          case "}":
            e.preventDefault()
            changeBoxStackOrder("front")
            resetAllPending()
            break
          case "{":
            e.preventDefault()
            changeBoxStackOrder("back")
            resetAllPending()
            break
          case ">":
          case "<":
            e.preventDefault()
            if (selectedBox && isImageBox(selectedBox)) {
              const delta = (e.key === ">" ? 10 : -10) * count
              setImageSize(selectedBox.id, selectedBox.size + delta)
            } else if (selectedBox && isTextBox(selectedBox)) {
              const delta = (e.key === ">" ? 2 : -2) * count
              const next = Math.max(
                10,
                Math.min(160, selectedBox.fontSize + delta),
              )
              updateBox(selectedBox.id, { fontSize: next })
              showStatus(`Font size ${next}px`)
            }
            resetAllPending()
            break
          case "z":
            e.preventDefault()
            setPendingKey("z")
            break
          case "~":
            e.preventDefault()
            if (selectedBox && isTextBox(selectedBox)) {
              updateBox(selectedBox.id, {
                text: applyCase(selectedBox.text, "toggle"),
              })
            }
            resetAllPending()
            break
        }
        return
      }
      if (scope === "TEXT" && box) {
        const clampPos = (pos: number) =>
          Math.max(0, Math.min(text.length, pos))
        if (!VERTICAL_KEYS.has(e.key)) preferredColRef.current = null
        if (pendingTextObjMod) {
          e.preventDefault()
          const range = resolveTextObject(
            text,
            textCursor,
            pendingTextObjMod,
            e.key,
          )
          if (range) {
            if (pendingOperator) {
              applyRangeOperator(pendingOperator, range[0], range[1], false)
            } else if (mode === "VISUAL") {
              setVisualAnchor(range[0])
              setTextCursor(Math.max(range[0], range[1] - 1))
            }
          }
          resetAllPending()
          return
        }
        if (
          (pendingOperator || mode === "VISUAL")
          && (e.key === "i" || e.key === "a")
        ) {
          e.preventDefault()
          setPendingTextObjMod(e.key)
          return
        }
        if (
          pendingOperator
          && (e.key === pendingOperator
            || (isCaseOp(pendingOperator)
              && e.key === pendingOperator.slice(1)))
        ) {
          e.preventDefault()
          const { lineStart, lineEnd } = doubledLineRange()
          applyRangeOperator(pendingOperator, lineStart, lineEnd, true)
          resetAllPending()
          return
        }
        const computeMotionTarget = (): Motion | null => {
          switch (e.key) {
            case "h":
            case "ArrowLeft": {
              const { lineStart } = getLineBounds(text, textCursor)
              return {
                target: Math.max(lineStart, textCursor - count),
                inclusive: false,
                linewise: false,
              }
            }
            case "l":
            case "ArrowRight": {
              const { lineStart, lineEnd } = getLineBounds(text, textCursor)
              const limit = pendingOperator
                ? lineEnd
                : Math.max(lineStart, lineEnd - 1)
              return {
                target: Math.max(
                  textCursor,
                  Math.min(limit, textCursor + count),
                ),
                inclusive: false,
                linewise: false,
              }
            }
            case "j":
            case "ArrowDown":
            case "k":
            case "ArrowUp": {
              const down = e.key === "j" || e.key === "ArrowDown"
              if (preferredColRef.current === null) {
                preferredColRef.current =
                  textCursor - getLineBounds(text, textCursor).lineStart
              }
              return {
                target: moveVerticalLine(
                  text,
                  textCursor,
                  down ? count : -count,
                  preferredColRef.current,
                ),
                inclusive: true,
                linewise: true,
              }
            }
            case "w":
            case "W": {
              const big = e.key === "W"
              let pos = textCursor
              if (
                pendingOperator === "c"
                && text.length > 0
                && !isWhitespace(text[Math.min(pos, text.length - 1)])
              ) {
                pos = currentWordEnd(text, pos, big)
                for (let i = 1; i < count; i++)
                  pos = moveWordEnd(text, pos, big)
                return { target: pos, inclusive: true, linewise: false }
              }
              for (let i = 0; i < count; i++) {
                const prev = pos
                pos = moveWordForward(text, pos, big)
                if (pendingOperator && i === count - 1) {
                  const nl = text.slice(prev, pos).indexOf("\n")
                  if (nl !== -1) pos = prev + nl
                }
              }
              return { target: pos, inclusive: false, linewise: false }
            }
            case "b":
            case "B": {
              let pos = textCursor
              for (let i = 0; i < count; i++) {
                pos = moveWordBackward(text, pos, e.key === "B")
              }
              return { target: pos, inclusive: false, linewise: false }
            }
            case "e":
            case "E": {
              let pos = textCursor
              for (let i = 0; i < count; i++) {
                pos = moveWordEnd(text, pos, e.key === "E")
              }
              return { target: pos, inclusive: true, linewise: false }
            }
            case "0":
            case "Home": {
              const { lineStart } = getLineBounds(text, textCursor)
              return { target: lineStart, inclusive: false, linewise: false }
            }
            case "^":
            case "_":
              return {
                target: getFirstNonBlankOnLine(text, textCursor),
                inclusive: false,
                linewise: false,
              }
            case "$":
            case "End": {
              const { lineEnd } = getLineBounds(text, textCursor)
              preferredColRef.current = Infinity
              return { target: lineEnd, inclusive: false, linewise: false }
            }
            case "|": {
              const { lineStart, lineEnd } = getLineBounds(text, textCursor)
              return {
                target: Math.min(lineEnd, lineStart + count - 1),
                inclusive: false,
                linewise: false,
              }
            }
            case "G": {
              const lineStart =
                countBuffer.length > 0
                  ? getLineStartByIndex(text, count - 1)
                  : text.lastIndexOf("\n") + 1
              return {
                target: getFirstNonBlankOnLine(text, lineStart),
                inclusive: true,
                linewise: true,
              }
            }
            case "{": {
              let pos = textCursor
              for (let i = 0; i < count; i++) pos = moveParagraph(text, pos, -1)
              return { target: pos, inclusive: false, linewise: false }
            }
            case "}": {
              let pos = textCursor
              for (let i = 0; i < count; i++) pos = moveParagraph(text, pos, 1)
              return { target: pos, inclusive: false, linewise: false }
            }
            case "%": {
              const match = findMatchingBracket(text, textCursor)
              return match !== null
                ? { target: match, inclusive: true, linewise: false }
                : null
            }
            case ";":
            case ",": {
              if (!lastFind) return null
              const flipMap: Record<FindKind, FindKind> = {
                f: "F",
                F: "f",
                t: "T",
                T: "t",
              }
              const kind =
                e.key === ";" ? lastFind.kind : flipMap[lastFind.kind]
              const found = findCharOnLine(
                text,
                textCursor,
                kind,
                lastFind.char,
                count,
              )
              return found !== null
                ? {
                    target: found,
                    inclusive: kind === "f" || kind === "t",
                    linewise: false,
                  }
                : null
            }
            default:
              return null
          }
        }
        const motion = computeMotionTarget()
        if (motion) {
          e.preventDefault()
          if (pendingOperator) {
            applyMotionOperator(pendingOperator, motion)
          } else {
            setTextCursor(clampNormal(text, motion.target))
          }
          resetAllPending()
          return
        }
        switch (e.key) {
          case "f":
          case "F":
          case "t":
          case "T":
            e.preventDefault()
            setPendingFind(e.key)
            break
          case "d":
          case "c":
          case "y":
            e.preventDefault()
            if (mode === "VISUAL" && visualAnchor !== null) {
              const range = visualRange()
              if (range) {
                const [s, end] = range
                applyRangeOperator(e.key, s, end + 1, isLineVisual)
                exitVisual(e.key === "c")
              }
              resetAllPending()
            } else {
              opCountRef.current = rawCount
              setCountBuffer("")
              setPendingOperator(e.key)
            }
            break
          case "D":
          case "C": {
            e.preventDefault()
            const { lineEnd } = getLineBounds(text, textCursor)
            applyRangeOperator(
              e.key === "D" ? "d" : "c",
              textCursor,
              lineEnd,
              false,
            )
            resetAllPending()
            break
          }
          case "Y": {
            e.preventDefault()
            const { lineStart, lineEnd } = getLineBounds(text, textCursor)
            applyRangeOperator("y", lineStart, lineEnd, true)
            resetAllPending()
            break
          }
          case "i":
            e.preventDefault()
            setMode("INSERT")
            resetAllPending()
            break
          case "a":
            e.preventDefault()
            setTextCursor((c) => clampPos(c + 1))
            setMode("INSERT")
            resetAllPending()
            break
          case "I":
            e.preventDefault()
            setTextCursor(getFirstNonBlankOnLine(text, textCursor))
            setMode("INSERT")
            resetAllPending()
            break
          case "A": {
            e.preventDefault()
            const { lineEnd } = getLineBounds(text, textCursor)
            setTextCursor(lineEnd)
            setMode("INSERT")
            resetAllPending()
            break
          }
          case "o": {
            e.preventDefault()
            if (mode === "VISUAL" && visualAnchor !== null) {
              setVisualAnchor(textCursor)
              setTextCursor(visualAnchor)
              resetAllPending()
              break
            }
            const { lineEnd } = getLineBounds(text, textCursor)
            const nextText = `${text.slice(0, lineEnd)}\n${text.slice(lineEnd)}`
            updateBox(box.id, { text: nextText })
            setTextCursor(lineEnd + 1)
            setMode("INSERT")
            resetAllPending()
            break
          }
          case "O": {
            e.preventDefault()
            if (mode === "VISUAL" && visualAnchor !== null) {
              setVisualAnchor(textCursor)
              setTextCursor(visualAnchor)
              resetAllPending()
              break
            }
            const { lineStart } = getLineBounds(text, textCursor)
            const nextText = `${text.slice(0, lineStart)}\n${text.slice(lineStart)}`
            updateBox(box.id, { text: nextText })
            setTextCursor(lineStart)
            setMode("INSERT")
            resetAllPending()
            break
          }
          case "s":
          case "S": {
            e.preventDefault()
            const range = visualRange()
            if (range) {
              const [s, end] = range
              applyRangeOperator("c", s, end + 1, isLineVisual)
              exitVisual(true)
            } else if (e.key === "S") {
              const { lineStart, lineEnd } = getLineBounds(text, textCursor)
              applyRangeOperator("c", lineStart, lineEnd, true)
            } else {
              const { lineEnd } = getLineBounds(text, textCursor)
              applyRangeOperator(
                "c",
                textCursor,
                Math.min(lineEnd, textCursor + count),
                false,
              )
            }
            resetAllPending()
            break
          }
          case "x":
          case "X": {
            e.preventDefault()
            const range = visualRange()
            if (range) {
              const [s, end] = range
              applyRangeOperator("d", s, end + 1, isLineVisual)
              exitVisual()
            } else if (text.length > 0) {
              const { lineStart, lineEnd } = getLineBounds(text, textCursor)
              if (e.key === "x") {
                if (textCursor < lineEnd) {
                  applyRangeOperator(
                    "d",
                    textCursor,
                    Math.min(lineEnd, textCursor + count),
                    false,
                  )
                }
              } else if (textCursor > lineStart) {
                applyRangeOperator(
                  "d",
                  Math.max(lineStart, textCursor - count),
                  textCursor,
                  false,
                )
              }
            }
            resetAllPending()
            break
          }
          case "r":
            e.preventDefault()
            setPendingReplace(true)
            break
          case "u":
          case "U": {
            e.preventDefault()
            if (mode === "VISUAL" && visualAnchor !== null) {
              transformSelection(e.key === "u" ? "lower" : "upper")
            }
            resetAllPending()
            break
          }
          case "~": {
            e.preventDefault()
            if (text.length > 0) {
              const range = visualRange()
              if (range) {
                transformSelection("toggle")
              } else {
                const { lineEnd } = getLineBounds(text, textCursor)
                const end = Math.min(lineEnd, textCursor + count)
                if (end > textCursor) {
                  const toggled = applyCase(
                    text.slice(textCursor, end),
                    "toggle",
                  )
                  const nextText =
                    text.slice(0, textCursor) + toggled + text.slice(end)
                  updateBox(box.id, { text: nextText })
                  setTextCursor(clampNormal(nextText, end))
                }
              }
            }
            resetAllPending()
            break
          }
          case "J": {
            e.preventDefault()
            let cur = text
            let cursor = textCursor
            const joins = Math.max(1, count - 1)
            for (let k = 0; k < joins; k++) {
              const { lineEnd } = getLineBounds(cur, cursor)
              if (lineEnd >= cur.length) break
              const before = cur.slice(0, lineEnd)
              const after = cur.slice(lineEnd + 1).replace(/^[ \t]+/, "")
              const needSpace =
                /\S$/.test(before) && after.length > 0 && after[0] !== "\n"
              cur = before + (needSpace ? " " : "") + after
              cursor = lineEnd
            }
            if (cur !== text) {
              updateBox(box.id, { text: cur })
              setTextCursor(clampNormal(cur, cursor))
            }
            resetAllPending()
            break
          }
          case ">":
          case "<": {
            e.preventDefault()
            const range = visualRange()
            if (range) {
              const res = shiftLines(
                text,
                range[0],
                range[1],
                e.key === ">" ? 1 : -1,
              )
              updateBox(box.id, { text: res.text })
              setTextCursor(getFirstNonBlankOnLine(res.text, res.lineStart))
              exitVisual()
              resetAllPending()
            } else {
              setPendingKey(e.key)
            }
            break
          }
          case "v":
            e.preventDefault()
            if (mode === "VISUAL" && !isLineVisual) {
              exitVisual()
            } else {
              if (mode !== "VISUAL") setVisualAnchor(textCursor)
              setMode("VISUAL")
              setIsLineVisual(false)
            }
            resetAllPending()
            break
          case "V":
            e.preventDefault()
            if (mode === "VISUAL" && isLineVisual) {
              exitVisual()
            } else {
              if (mode !== "VISUAL") setVisualAnchor(textCursor)
              setMode("VISUAL")
              setIsLineVisual(true)
            }
            resetAllPending()
            break
          case "p":
          case "P": {
            e.preventDefault()
            const pasteKey = e.key
            const snapBoxId = box.id
            const snapText = text
            const snapCursor = textCursor
            const snapCount = count
            const snapClip = textClipboard
            const snapRange = visualRange()
            const snapLineVisual = isLineVisual
            resetAllPending()
            void (async () => {
              let clipText = snapClip.text
              let linewise = snapClip.linewise
              try {
                if (
                  typeof navigator !== "undefined"
                  && navigator.clipboard?.readText
                ) {
                  const sysText = await navigator.clipboard.readText()
                  if (sysText && sysText !== snapClip.text) {
                    clipText = sysText
                    linewise = false
                  }
                }
              } catch {}
              if (!clipText) return
              if (snapRange) {
                const [s, end] = snapRange
                const replaced = snapText.slice(s, end + 1)
                const nextText =
                  snapText.slice(0, s) + clipText + snapText.slice(end + 1)
                updateBox(snapBoxId, { text: nextText })
                setTextClipboard({ text: replaced, linewise: snapLineVisual })
                writeSystemClipboard(replaced)
                setTextCursor(clampNormal(nextText, s + clipText.length - 1))
                exitVisual()
                return
              }
              if (linewise) {
                const { lineStart, lineEnd } = getLineBounds(
                  snapText,
                  snapCursor,
                )
                const block = Array(snapCount)
                  .fill(clipText.replace(/\n$/, ""))
                  .join("\n")
                if (pasteKey === "p") {
                  const nextText = `${snapText.slice(0, lineEnd)}\n${block}${snapText.slice(lineEnd)}`
                  updateBox(snapBoxId, { text: nextText })
                  setTextCursor(getFirstNonBlankOnLine(nextText, lineEnd + 1))
                } else {
                  const nextText = `${snapText.slice(0, lineStart)}${block}\n${snapText.slice(lineStart)}`
                  updateBox(snapBoxId, { text: nextText })
                  setTextCursor(getFirstNonBlankOnLine(nextText, lineStart))
                }
              } else {
                const insertPos =
                  pasteKey === "p"
                    ? Math.min(snapText.length, snapCursor + 1)
                    : snapCursor
                const payload = clipText.repeat(snapCount)
                const nextText =
                  snapText.slice(0, insertPos)
                  + payload
                  + snapText.slice(insertPos)
                updateBox(snapBoxId, { text: nextText })
                setTextCursor(Math.max(0, insertPos + payload.length - 1))
              }
            })()
            break
          }
        }
      }
    }
    const handlePaste = (e: ClipboardEvent) => {
      if (mode !== "COMMAND") return
      const pasted = e.clipboardData?.getData("text/plain")?.trim()
      if (!pasted) return
      e.preventDefault()
      setCommandBuffer((c) => c + pasted.replace(/\s+/g, " "))
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("paste", handlePaste)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("paste", handlePaste)
    }
  })
  const whichKey: WhichKeyState | null = useMemo(() => {
    if (mode === "INSERT" || mode === "COMMAND" || isPresenting) return null
    if (lastBaseMove && scope === "BASE") {
      const dirLabel =
        lastBaseMove.dir === "h"
          ? "left"
          : lastBaseMove.dir === "j"
            ? "down"
            : lastBaseMove.dir === "k"
              ? "up"
              : "right"
      return {
        title: `Step boost (${dirLabel})`,
        bindings: [
          { key: "f", label: `Big step (${LARGE_STEP}px)` },
          { key: "g", label: `Mega step (${MEGA_STEP}px)` },
        ],
      }
    }
    if (pendingReplace) {
      return {
        title: "Replace character",
        bindings: [
          { key: "{char}", label: "Replace with char" },
          { key: "Enter", label: "Split line" },
        ],
      }
    }
    if (pendingFind) {
      const labels: Record<FindKind, string> = {
        f: "Find char forward",
        F: "Find char backward",
        t: "Till char forward",
        T: "Till char backward",
      }
      return {
        title: labels[pendingFind],
        bindings: [{ key: "{char}", label: "Target character on line" }],
      }
    }
    if (pendingTextObjMod) {
      const prefix = pendingTextObjMod === "i" ? "Inner" : "Around"
      return {
        title: `${prefix} text object`,
        bindings: [
          { key: "w / W", label: `${prefix} word / WORD` },
          { key: "p", label: `${prefix} paragraph` },
          { key: "( / b", label: `${prefix} parentheses` },
          { key: "[ / { / <", label: `${prefix} brackets / braces / angles` },
        ],
      }
    }
    if (pendingOperator) {
      if (scope === "BASE") {
        if (pendingOperator === "d") {
          return {
            title: "Delete / Cut (d)",
            bindings: [
              { key: "d", label: "Delete selected box" },
              { key: "S", label: "Cut current slide" },
            ],
          }
        }
        if (pendingOperator === "y") {
          return {
            title: "Yank (y)",
            bindings: [
              { key: "y", label: "Yank selected box" },
              { key: "S", label: "Yank current slide" },
            ],
          }
        }
        return {
          title: "Box operator (c)",
          bindings: [{ key: "c", label: "Clear box & insert" }],
        }
      }
      const opLabels: Record<TextOperator, string> = {
        d: "Delete",
        c: "Change",
        y: "Yank",
        gu: "Lowercase",
        gU: "Uppercase",
        "g~": "Toggle case",
      }
      const repeatKey = isCaseOp(pendingOperator)
        ? pendingOperator.slice(1)
        : pendingOperator
      return {
        title: `${opLabels[pendingOperator]} + motion / object`,
        bindings: [
          { key: repeatKey, label: "Whole line" },
          { key: "i / a", label: "Inner / around text object" },
          { key: "w / W / e / b", label: "Word motions" },
          { key: "$ / ^ / 0", label: "Line end / first non-blank / start" },
          { key: "f / t + char", label: "Find / till character" },
          { key: "gg / G / gM", label: "Top / bottom / middle of line" },
        ],
      }
    }
    if (pendingKey === "p" && scope === "BASE") {
      return {
        title: "Paste slide (p)",
        bindings: [
          { key: "s", label: "Paste slide after current" },
          { key: "S", label: "Paste slide before current" },
        ],
      }
    }
    if (pendingKey === "s" && scope === "BASE") {
      return {
        title: "Slide navigation (s)",
        bindings: [
          { key: "j", label: "Next slide (or {N}sj)" },
          { key: "k", label: "Previous slide (or {N}sk)" },
          { key: "g", label: "First slide (or {N}sg)" },
          { key: "G", label: "Last slide" },
        ],
      }
    }
    if (pendingKey === "S" && scope === "BASE") {
      return {
        title: "Slide prefix (S)",
        bindings: [{ key: "Esc", label: "Cancel prefix" }],
      }
    }
    if (pendingKey === "g") {
      if (scope === "BASE") {
        return {
          title: "Go / Scope (g)",
          bindings: [{ key: "j", label: "Enter TEXT scope" }],
        }
      }
      return {
        title: "Go / Case prefix (g)",
        bindings: [
          { key: "k", label: "Exit to BASE scope / top line" },
          { key: "M", label: "Middle of current line" },
          { key: "u / U / ~", label: "Lowercase / uppercase / toggle case" },
          { key: "e / E", label: "Previous word / WORD end" },
          { key: "_", label: "Last non-blank character" },
          { key: "J", label: "Join lines without space" },
        ],
      }
    }
    if (pendingKey === "z" && scope === "BASE") {
      return {
        title: "Align box on slide (z)",
        bindings: [
          { key: "t / z / b", label: "Top / vertical center / bottom" },
          { key: "h / c / l", label: "Left / horizontal center / right" },
        ],
      }
    }
    if (pendingKey === "m") {
      return {
        title: "Set slide mark (m)",
        bindings: [{ key: "a-z / 0-9", label: "Bookmark current slide" }],
      }
    }
    if (pendingKey === "'") {
      return {
        title: "Jump to mark (')",
        bindings: [
          { key: "'", label: "Previous slide" },
          { key: "a-z / 0-9", label: "Jump to marked slide" },
        ],
      }
    }
    if (pendingKey === "Z") {
      return {
        title: "Save / Quit (Z)",
        bindings: [
          { key: "Z", label: "Write to cloud & quit (:wq)" },
          { key: "Q", label: "Discard & quit (:q!)" },
        ],
      }
    }
    if (pendingKey === ">" || pendingKey === "<") {
      return {
        title: pendingKey === ">" ? "Indent lines (>)" : "Dedent lines (<)",
        bindings: [
          {
            key: pendingKey,
            label: pendingKey === ">" ? "Indent line(s)" : "Dedent line(s)",
          },
        ],
      }
    }
    return null
  }, [
    isPresenting,
    lastBaseMove,
    mode,
    pendingFind,
    pendingKey,
    pendingOperator,
    pendingReplace,
    pendingTextObjMod,
    scope,
  ])
  const visualTextRange: [number, number] | null =
    scope === "TEXT"
    && mode === "VISUAL"
    && visualAnchor !== null
    && selectedBox
    && isTextBox(selectedBox)
      ? getVisualSelectionBounds(
          selectedBox.text,
          visualAnchor,
          textCursor,
          isLineVisual,
        )
      : null
  return {
    slides,
    currentSlide,
    activeSlideIndex,
    setActiveSlideIndex,
    goToSlide,
    selectedBoxId,
    setSelectedBoxId,
    selectedBox,
    mode,
    setMode,
    scope,
    setScope,
    textCursor,
    setTextCursor,
    visualTextRange,
    isLineVisual,
    countBuffer,
    pendingKey,
    pendingOperator,
    whichKey,
    commandBuffer,
    searchQuery,
    statusMessage,
    isErrorStatus,
    hasUnsavedChanges,
    zoom,
    zoomIn: () => setZoom((z) => Math.min(200, z + 10)),
    zoomOut: () => setZoom((z) => Math.max(40, z - 10)),
    resetZoom: () => setZoom(100),
    isPresenting,
    setIsPresenting,
    addTextBox,
    updateBox,
    setImageSize,
    setSlideBackground,
    addSlide,
    deleteSlide,
    duplicateSlide,
    reorderSlide,
    undo,
    redo,
  }
}
