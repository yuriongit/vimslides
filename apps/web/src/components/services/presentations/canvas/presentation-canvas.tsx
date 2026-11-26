import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Keyboard,
  Maximize2,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RotateCcw,
  Type,
  X,
} from "lucide-react"
import { animate, motion } from "motion/react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { PanelImperativeHandle } from "react-resizable-panels"
import { Button } from "@/components/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  useVimSlides,
  type WhichKeyState,
} from "@/hooks/use-vim-slides"
import { cn } from "@/lib/utils"
import {
  type CanvasBox,
  type EditorScope,
  getImageRenderedWidth,
  type ImageBox,
  isImageBox,
  isTextBox,
  type Slide,
  type TextAlign,
  type TextBox,
  type VimMode,
} from "./vim-slides.types"

interface PresentationCanvasProps {
  presentationId: string
  title?: string
  initialCloudSlides?: Slide[]
  onCloudWrite?: (slides: Slide[]) => Promise<void> | void
  onExitToDashboard?: () => void
}
const PRESET_COLORS = [
  {
    label: "Foreground",
    textClass: "text-foreground",
    bgClass: "bg-foreground",
  },
  { label: "Primary", textClass: "text-primary", bgClass: "bg-primary" },
  {
    label: "Muted",
    textClass: "text-muted-foreground",
    bgClass: "bg-muted-foreground",
  },
  {
    label: "Accent",
    textClass: "text-accent-foreground",
    bgClass: "bg-accent",
  },
  {
    label: "Destructive",
    textClass: "text-destructive",
    bgClass: "bg-destructive",
  },
  { label: "Chart 2", textClass: "text-chart-2", bgClass: "bg-chart-2" },
  { label: "Chart 3", textClass: "text-chart-3", bgClass: "bg-chart-3" },
  { label: "Chart 4", textClass: "text-chart-4", bgClass: "bg-chart-4" },
] as const
const LEGACY_DARK_HEX = new Set(["#09090b", "#000000", "#000", "black"])
function resolveAdaptiveColor(color?: string): string {
  if (!color) return "text-foreground"
  if (LEGACY_DARK_HEX.has(color.trim().toLowerCase())) {
    return "text-foreground"
  }
  return color
}
function getBoxColorProps(rawColor?: string) {
  const color = resolveAdaptiveColor(rawColor)
  if (color.startsWith("text-")) {
    return { className: color, style: undefined, resolved: color }
  }
  return { className: undefined, style: { color }, resolved: color }
}
function getBoxTypographyClasses(box: TextBox): string {
  return cn(
    box.bold && "font-semibold",
    box.italic && "italic",
    box.align === "center"
      ? "text-center"
      : box.align === "right"
        ? "text-right"
        : "text-left",
  )
}
function StaticSlideBox({ box }: { box: CanvasBox }) {
  if (isImageBox(box)) {
    return (
      <img
        src={box.src}
        alt={box.alt ?? ""}
        draggable={false}
        style={{
          left: box.x,
          top: box.y,
          width: getImageRenderedWidth(box),
          height: "auto",
          zIndex: box.zIndex,
        }}
        className="absolute object-contain"
      />
    )
  }
  const colorProps = getBoxColorProps(box.color)
  return (
    <div
      style={{
        left: box.x,
        top: box.y,
        fontSize: box.fontSize,
        zIndex: box.zIndex,
        ...colorProps.style,
      }}
      className={cn(
        "absolute whitespace-pre-wrap leading-snug",
        colorProps.className,
        getBoxTypographyClasses(box),
      )}
    >
      {box.text}
    </div>
  )
}
const BASE_CHEATSHEET: WhichKeyState = {
  title: "BASE Scope Reference",
  bindings: [
    { key: "h j k l", label: "Move box (8px)" },
    { key: "hf / jf / kf / lf", label: "Big step (48px)" },
    { key: "hg / jg / kg / lg", label: "Mega step (128px)" },
    { key: "H J K L / Tab", label: "Focus adjacent / next box" },
    { key: "gj / i / A / I", label: "Enter TEXT scope / insert" },
    { key: "o", label: "Add new text box" },
    { key: ":img <url>", label: "Add image from URL" },
    { key: ":size <1-500|+N|-N>", label: "Set text size / image scale" },
    { key: "dd / cc / yy / P", label: "Delete / clear / yank / paste box" },
    {
      key: "dS / yS / ps / pS",
      label: "Cut / yank / paste slide after/before",
    },
    {
      key: "zt zz zb / zh zc zl",
      label: "Align box vertically / horizontally",
    },
    {
      key: ":bold / :italic / :align",
      label: "Toggle bold, italic, or text align",
    },
    { key: ":bg <color>", label: "Set or reset slide background" },
    { key: "> / <", label: "Increase / decrease text size or image scale" },
    { key: "] [ / } {", label: "Layer forward/back / front/back" },
    { key: "sj / sk / sg / sG", label: "Next / prev / first / last slide" },
    { key: "( / )", label: "Reorder slide up / down" },
    { key: "m{a-z} / '{a-z} / ''", label: "Set / jump mark / previous slide" },
    { key: "/ ? n N / :%s", label: "Search & substitute across slides" },
  ],
}
const TEXT_CHEATSHEET: WhichKeyState = {
  title: "TEXT Scope Reference",
  bindings: [
    { key: "gk / Esc", label: "Return to BASE scope" },
    { key: "h j k l / w W b B e E", label: "Character & word motions" },
    { key: "0 ^ $ g_ gM | gg G", label: "Line middle & box bounds" },
    { key: "f F t T ; ,", label: "Find / till char on line" },
    { key: "d c y + motion/obj", label: "Delete / change / yank (sys clip)" },
    { key: "iw aw ip i( i<", label: "Inner & around text objects" },
    { key: "v / V / o / r / p P", label: "Visual / swap / replace / paste" },
    { key: "gu gU g~ / > < / J", label: "Case / indent / join lines" },
    {
      key: ":bold / :italic / :align",
      label: "Toggle bold, italic, or text align",
    },
    { key: ":bg <color>", label: "Set or reset slide background" },
    { key: ":bullets <d|c>", label: "Start/convert dash or circle bullets" },
  ],
}
export function PresentationCanvas({
  presentationId,
  title = "Untitled Presentation",
  initialCloudSlides,
  onCloudWrite,
  onExitToDashboard,
}: PresentationCanvasProps) {
  const {
    slides,
    currentSlide,
    activeSlideIndex,
    setActiveSlideIndex,
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
    countBuffer,
    pendingKey,
    pendingOperator,
    whichKey,
    commandBuffer,
    statusMessage,
    isErrorStatus,
    hasUnsavedChanges,
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    isPresenting,
    setIsPresenting,
    addTextBox,
    updateBox,
    setImageSize,
    setSlideBackground,
    addSlide,
  } = useVimSlides({
    presentationId,
    initialTitle: title,
    cloudSlides: initialCloudSlides,
    onCloudWrite,
    onExitToDashboard,
  })
  const [showKeymapGuide, setShowKeymapGuide] = useState(false)
  const [filmstripOpen, setFilmstripOpen] = useState(true)
  const [filmstripMounted, setFilmstripMounted] = useState(true)
  const [filmstripInitial, setFilmstripInitial] = useState(false)
  const [filmstripAnimating, setFilmstripAnimating] = useState(false)
  const filmstripPanelRef = useRef<PanelImperativeHandle | null>(null)
  const filmstripSize = useRef(20)
  const filmstripAnimation = useRef<{ stop: () => void } | null>(null)
  const dragState = useRef<{
    boxId: string
    startMouseX: number
    startMouseY: number
    startBoxX: number
    startBoxY: number
  } | null>(null)
  const [draggingBoxId, setDraggingBoxId] = useState<string | null>(null)
  const handleBoxMouseDown = (e: React.MouseEvent, box: CanvasBox) => {
    e.stopPropagation()
    setSelectedBoxId(box.id)
    if (mode === "INSERT" && selectedBoxId !== box.id) {
      setMode("NORMAL")
      setScope("BASE")
    }
    if (mode === "INSERT") return
    dragState.current = {
      boxId: box.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startBoxX: box.x,
      startBoxY: box.y,
    }
    setDraggingBoxId(box.id)
  }
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.current) return
      const scale = zoom / 100
      const dx = (e.clientX - dragState.current.startMouseX) / scale
      const dy = (e.clientY - dragState.current.startMouseY) / scale
      updateBox(
        dragState.current.boxId,
        {
          x: Math.max(
            0,
            Math.min(
              LOGICAL_WIDTH - 40,
              Math.round(dragState.current.startBoxX + dx),
            ),
          ),
          y: Math.max(
            0,
            Math.min(
              LOGICAL_HEIGHT - 30,
              Math.round(dragState.current.startBoxY + dy),
            ),
          ),
        },
        false,
      )
    }
    const handleMouseUp = () => {
      if (dragState.current) {
        dragState.current = null
        setDraggingBoxId(null)
      }
    }
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [updateBox, zoom])
  const animateFilmstripSize = (target: number, onComplete?: () => void) => {
    filmstripAnimation.current?.stop()
    const from =
      filmstripPanelRef.current?.getSize().asPercentage ?? filmstripSize.current
    if (from > 0) filmstripSize.current = from
    setFilmstripAnimating(true)
    filmstripAnimation.current = animate(from, target, {
      type: "spring",
      stiffness: 350,
      damping: 35,
      onUpdate: (size) => {
        const clamped = Math.max(0, Math.min(100, size))
        filmstripPanelRef.current?.resize(`${clamped}%`)
      },
      onComplete: () => {
        filmstripAnimation.current = null
        setFilmstripAnimating(false)
        onComplete?.()
      },
    })
  }
  const toggleFilmstrip = () => {
    if (filmstripOpen) {
      setFilmstripOpen(false)
      animateFilmstripSize(0, () => setFilmstripMounted(false))
      return
    }
    setFilmstripInitial(true)
    setFilmstripMounted(true)
    setFilmstripOpen(true)
    animateFilmstripSize(filmstripSize.current, () =>
      setFilmstripInitial(false),
    )
  }
  const orderedBoxes = [...(currentSlide?.boxes ?? [])].sort(
    (a, b) => a.zIndex - b.zIndex,
  )
  const selectedTextBox =
    selectedBox && isTextBox(selectedBox) ? selectedBox : null
  const selectedImage =
    selectedBox && isImageBox(selectedBox) ? selectedBox : null
  const resolvedSelectedColor = selectedTextBox
    ? resolveAdaptiveColor(selectedTextBox.color)
    : undefined
  const activeWhichKey =
    whichKey
    ?? (showKeymapGuide
      ? scope === "BASE"
        ? BASE_CHEATSHEET
        : TEXT_CHEATSHEET
      : null)
  const activeAlign: TextAlign = selectedTextBox?.align ?? "left"
  return (
    <>
      <main className="h-[85dvh] w-full text-foreground print:hidden">
        <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        @keyframes vim-char-pop {
          0% {
            opacity: 0;
            transform: translateY(4px) scale(0.88);
            filter: blur(2px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
        @keyframes vim-cursor-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @keyframes vim-box-enter {
          0% {
            opacity: 0;
            scale: 0.96;
          }
          100% {
            opacity: 1;
            scale: 1;
          }
        }
        @keyframes vim-whichkey-in {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-vim-char {
          display: inline-block;
          white-space: pre-wrap;
          animation: vim-char-pop 140ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .animate-vim-cursor-blink {
          animation: vim-cursor-pulse 1.1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-vim-box-enter {
          animation: vim-box-enter 180ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .animate-vim-whichkey {
          animation: vim-whichkey-in 130ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
        <ResizablePanelGroup
          orientation="horizontal"
          className="flex min-h-full rounded-sm border border-border bg-background"
        >
          <ResizablePanel
            defaultSize="20%"
            minSize={filmstripAnimating || !filmstripOpen ? "0%" : "15%"}
            maxSize="35%"
            panelRef={filmstripPanelRef}
            className="overflow-hidden"
          >
            {filmstripMounted && (
              <motion.div
                initial={filmstripInitial ? { opacity: 0 } : false}
                animate={{ opacity: filmstripOpen ? 1 : 0 }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 35,
                }}
                style={{
                  pointerEvents: filmstripOpen ? "auto" : "none",
                }}
                aria-hidden={!filmstripOpen}
                className="h-full w-full overflow-hidden"
              >
                <motion.div
                  initial={filmstripInitial ? { x: -24 } : false}
                  animate={{ x: filmstripOpen ? 0 : -24 }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 35,
                  }}
                  className="h-full w-full"
                >
                  <SlideFilmstrip
                    title={title}
                    slides={slides}
                    activeIndex={activeSlideIndex}
                    onSelectSlide={(idx) => {
                      setActiveSlideIndex(idx)
                      setScope("BASE")
                      setMode("NORMAL")
                    }}
                    onAddSlide={() => addSlide(false)}
                  />
                </motion.div>
              </motion.div>
            )}
          </ResizablePanel>
          <ResizableHandle
            withHandle
            disabled={!filmstripOpen}
            className={cn(!filmstripMounted && "pointer-events-none opacity-0")}
          />
          <ResizablePanel defaultSize="80%">
            <div className="relative flex h-full flex-col overflow-hidden bg-muted/30">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-popover/50 px-3 py-3 backdrop-blur-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-1 h-7 w-7"
                    onClick={toggleFilmstrip}
                    aria-label={
                      filmstripOpen
                        ? "Collapse slide filmstrip"
                        : "Expand slide filmstrip"
                    }
                    title={
                      filmstripOpen
                        ? "Collapse slide filmstrip"
                        : "Expand slide filmstrip"
                    }
                  >
                    {filmstripOpen ? (
                      <PanelLeftClose className="h-4 w-4" />
                    ) : (
                      <PanelLeftOpen className="h-4 w-4" />
                    )}
                  </Button>

                  <Separator orientation="vertical" className="ml-2" />

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => addTextBox(true)}
                    title="New text box (o)"
                  >
                    <Type />
                    Add Text Box
                  </Button>
                  {(selectedTextBox || selectedImage) && (
                    <>
                      <Separator orientation="vertical" className="mr-2" />
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            if (selectedImage) {
                              setImageSize(
                                selectedImage.id,
                                selectedImage.size - 10,
                              )
                              return
                            }
                            if (selectedTextBox) {
                              updateBox(selectedTextBox.id, {
                                fontSize: Math.max(
                                  12,
                                  selectedTextBox.fontSize - 4,
                                ),
                              })
                            }
                          }}
                          title={
                            selectedImage
                              ? "Decrease image size (:size -10)"
                              : "Decrease font size (:size -4)"
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="min-w-10 text-center font-mono text-xs tabular-nums text-foreground">
                          {selectedImage
                            ? `Size ${selectedImage.size}`
                            : `${selectedTextBox?.fontSize}px`}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            if (selectedImage) {
                              setImageSize(
                                selectedImage.id,
                                selectedImage.size + 10,
                              )
                              return
                            }
                            if (selectedTextBox) {
                              updateBox(selectedTextBox.id, {
                                fontSize: Math.min(
                                  140,
                                  selectedTextBox.fontSize + 4,
                                ),
                              })
                            }
                          }}
                          title={
                            selectedImage
                              ? "Increase image size (:size +10)"
                              : "Increase font size (:size +4)"
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                  {selectedTextBox && (
                    <>
                      <Separator orientation="vertical" className="mr-2" />
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant={selectedTextBox.bold ? "secondary" : "ghost"}
                          size="icon"
                          className="h-6 w-6"
                          aria-pressed={!!selectedTextBox.bold}
                          onClick={() =>
                            updateBox(selectedTextBox.id, {
                              bold: !selectedTextBox.bold,
                            })
                          }
                          title="Toggle bold (:bold)"
                        >
                          <Bold className="h-3 w-3" />
                        </Button>
                        <Button
                          variant={
                            selectedTextBox.italic ? "secondary" : "ghost"
                          }
                          size="icon"
                          className="h-6 w-6"
                          aria-pressed={!!selectedTextBox.italic}
                          onClick={() =>
                            updateBox(selectedTextBox.id, {
                              italic: !selectedTextBox.italic,
                            })
                          }
                          title="Toggle italic (:italic)"
                        >
                          <Italic className="h-3 w-3" />
                        </Button>
                      </div>
                      <Separator orientation="vertical" className="mr-2" />
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant={
                            activeAlign === "left" ? "secondary" : "ghost"
                          }
                          size="icon"
                          className="h-6 w-6"
                          aria-pressed={activeAlign === "left"}
                          onClick={() =>
                            updateBox(selectedTextBox.id, { align: "left" })
                          }
                          title="Align left (:align left)"
                        >
                          <AlignLeft className="h-3 w-3" />
                        </Button>
                        <Button
                          variant={
                            activeAlign === "center" ? "secondary" : "ghost"
                          }
                          size="icon"
                          className="h-6 w-6"
                          aria-pressed={activeAlign === "center"}
                          onClick={() =>
                            updateBox(selectedTextBox.id, { align: "center" })
                          }
                          title="Align center (:align center)"
                        >
                          <AlignCenter className="h-3 w-3" />
                        </Button>
                        <Button
                          variant={
                            activeAlign === "right" ? "secondary" : "ghost"
                          }
                          size="icon"
                          className="h-6 w-6"
                          aria-pressed={activeAlign === "right"}
                          onClick={() =>
                            updateBox(selectedTextBox.id, { align: "right" })
                          }
                          title="Align right (:align right)"
                        >
                          <AlignRight className="h-3 w-3" />
                        </Button>
                      </div>
                      <Separator orientation="vertical" className="mr-2" />
                      <div className="flex items-center gap-1.5">
                        {PRESET_COLORS.map((preset) => (
                          <button
                            key={preset.textClass}
                            type="button"
                            onClick={() =>
                              updateBox(selectedTextBox.id, {
                                color: preset.textClass,
                              })
                            }
                            className={cn(
                              "h-4 w-4 rounded-full border border-border transition-transform hover:scale-110",
                              preset.bgClass,
                              resolvedSelectedColor === preset.textClass
                                && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                            )}
                            title={`${preset.label} (:color ${preset.textClass})`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-1.5 rounded border border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                    title="Slide background (:bg <css-color>)"
                  >
                    <span className="text-[10px] uppercase tracking-wider">
                      Bg
                    </span>
                    <span
                      style={
                        currentSlide?.background
                          ? { backgroundColor: currentSlide.background }
                          : undefined
                      }
                      className={cn(
                        "h-3 w-3 rounded-xs border border-border",
                        !currentSlide?.background && "bg-secondary",
                      )}
                    />
                    <span className="max-w-26 truncate text-foreground">
                      {currentSlide?.background ?? "Default"}
                    </span>
                    {currentSlide?.background && (
                      <button
                        type="button"
                        onClick={() => setSlideBackground(undefined)}
                        className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Reset slide background (:bg)"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                  <Button
                    variant={showKeymapGuide ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 gap-1.5 font-mono text-xs"
                    onClick={() => setShowKeymapGuide((v) => !v)}
                    title="Toggle Which-Key reference"
                  >
                    <Keyboard className="h-3.5 w-3.5" />
                    Which-Key
                  </Button>
                </div>
              </div>
              <div
                className="flex-1 overflow-auto p-8"
                onClick={() => {
                  setMode("NORMAL")
                  setScope("BASE")
                }}
              >
                <div className="flex min-h-full min-w-full items-center justify-center">
                  <div
                    style={{
                      width: LOGICAL_WIDTH,
                      height: LOGICAL_HEIGHT,
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "center center",
                      ...(currentSlide?.background
                        ? { backgroundColor: currentSlide.background }
                        : {}),
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (mode === "INSERT") setMode("NORMAL")
                      setScope("BASE")
                    }}
                    className={cn(
                      "relative shrink-0 overflow-hidden rounded-md border border-border text-foreground shadow-sm transition-all duration-150",
                      !currentSlide?.background && "bg-secondary",
                    )}
                  >
                    {orderedBoxes.map((box) => {
                      const isTarget = box.id === selectedBoxId
                      const isDragging = draggingBoxId === box.id
                      if (isImageBox(box)) {
                        return (
                          <FreeFormImageBox
                            key={box.id}
                            box={box}
                            isTarget={isTarget}
                            isDragging={isDragging}
                            onMouseDown={(e) => handleBoxMouseDown(e, box)}
                          />
                        )
                      }
                      const isTextScope = isTarget && scope === "TEXT"
                      const isInserting = isTarget && mode === "INSERT"
                      return (
                        <FreeFormTextBox
                          key={box.id}
                          box={box}
                          isTarget={isTarget}
                          isTextScope={isTextScope}
                          isInserting={isInserting}
                          isDragging={isDragging}
                          textCursor={
                            isTextScope || isInserting ? textCursor : 0
                          }
                          visualTextRange={isTextScope ? visualTextRange : null}
                          onMouseDown={(e) => handleBoxMouseDown(e, box)}
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            setSelectedBoxId(box.id)
                            setScope("TEXT")
                            setMode("INSERT")
                          }}
                          onChangeText={(nextText) =>
                            updateBox(box.id, { text: nextText }, false)
                          }
                          onCursorSync={(pos) => setTextCursor(pos)}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
              {activeWhichKey && (
                <WhichKeyPopup
                  whichKey={activeWhichKey}
                  isPinned={whichKey === null && showKeymapGuide}
                  onClose={() => setShowKeymapGuide(false)}
                />
              )}
              <div className="z-10 flex items-center justify-between border-t border-border bg-secondary/80 px-3 py-1.5 backdrop-blur-md">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <ModeBadge mode={mode} />
                  <ScopeBadge scope={scope} />
                  {hasUnsavedChanges && (
                    <span
                      className="rounded border border-chart-3/30 bg-chart-3/15 px-1.5 py-0.5 text-[11px] font-medium text-chart-3"
                      title="Unsaved local draft (:w to write to cloud)"
                    >
                      [+]
                    </span>
                  )}
                  {mode === "COMMAND" ? (
                    <span className="text-foreground">:{commandBuffer}█</span>
                  ) : (
                    <>
                      {(countBuffer || pendingKey || pendingOperator) && (
                        <span className="rounded border border-border bg-background/70 px-1.5 py-0.5 text-foreground">
                          {countBuffer}
                          {pendingOperator}
                          {pendingKey}
                        </span>
                      )}
                      {statusMessage && (
                        <span
                          className={cn(
                            "max-w-md truncate",
                            isErrorStatus
                              ? "font-medium text-destructive"
                              : "text-muted-foreground",
                          )}
                        >
                          {statusMessage}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={zoomOut}
                    disabled={zoom <= 40}
                    title="Zoom out (-)"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <button
                    type="button"
                    onClick={resetZoom}
                    title="Reset zoom to 100% (0)"
                    className="min-w-14 rounded px-1.5 py-0.5 text-center font-mono text-xs tabular-nums text-secondary-foreground hover:bg-background/50"
                  >
                    {zoom}%
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={zoomIn}
                    disabled={zoom >= 200}
                    title="Zoom in (+)"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  {zoom !== 100 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={resetZoom}
                      title="Reset zoom (0)"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <div className="mx-1 h-4 w-px bg-border" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setIsPresenting(true)}
                    title="Present (:present)"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
      <div className="hidden print:block">
        {slides.map((slide, idx) => {
          const sorted = [...slide.boxes].sort((a, b) => a.zIndex - b.zIndex)
          return (
            <div
              key={slide.id}
              style={{
                width: LOGICAL_WIDTH,
                height: LOGICAL_HEIGHT,
                breakAfter: idx < slides.length - 1 ? "page" : "auto",
                ...(slide.background
                  ? { backgroundColor: slide.background }
                  : {}),
              }}
              className={cn(
                "relative overflow-hidden text-foreground",
                !slide.background && "bg-secondary",
              )}
            >
              {sorted.map((box) => (
                <StaticSlideBox key={box.id} box={box} />
              ))}
            </div>
          )
        })}
      </div>
      {isPresenting && currentSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6print:hidden">
          <div
            style={{
              width: LOGICAL_WIDTH,
              height: LOGICAL_HEIGHT,
              ...(currentSlide.background
                ? { backgroundColor: currentSlide.background }
                : {}),
            }}
            className={cn(
              "relative overflow-hidden rounded-md border border-border text-foreground shadow-2xl scale-110",
              !currentSlide.background && "bg-secondary",
            )}
          >
            {orderedBoxes.map((box) => (
              <StaticSlideBox key={box.id} box={box} />
            ))}
          </div>
          <p className="fixed bottom-4 right-6 rounded-md border border-border bg-secondary/80 px-3 py-1.5 text-xs text-secondary-foreground">
            {activeSlideIndex + 1} / {slides.length}
          </p>
        </div>
      )}
    </>
  )
}
interface WhichKeyPopupProps {
  whichKey: WhichKeyState
  isPinned: boolean
  onClose: () => void
}
function WhichKeyPopup({ whichKey, isPinned, onClose }: WhichKeyPopupProps) {
  return (
    <div className="animate-vim-whichkey pointer-events-auto absolute bottom-12 right-4 z-30 w-full max-w-md rounded-md border border-border bg-popover/95 p-3 font-mono text-xs text-popover-foreground shadow-lg backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between border-b border-border pb-1.5">
        <span className="font-semibold text-primary">{whichKey.title}</span>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <p className="flex items-center gap-2">
            Esc<span className={`border rounded px-1.5`}>Cancel</span>
          </p>
          {isPinned && (
            <button
              type="button"
              onClick={onClose}
              className="rounded px-1.5 py-0.5 hover:bg-muted hover:text-foreground"
            >
              Close
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
        {whichKey.bindings.map((binding) => (
          <div
            key={binding.key}
            className="flex items-baseline justify-between gap-2 truncate py-0.5"
          >
            <kbd className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-foreground">
              {binding.key}
            </kbd>
            <span className="truncate text-[11px] text-muted-foreground">
              {binding.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
function FreeFormImageBox({
  box,
  isTarget,
  isDragging,
  onMouseDown,
}: {
  box: ImageBox
  isTarget: boolean
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent) => void
}) {
  const [failed, setFailed] = useState(false)
  return (
    <button
      type="button"
      data-box-id={box.id}
      aria-label={box.alt ?? "Image"}
      onMouseDown={onMouseDown}
      style={{
        left: box.x,
        top: box.y,
        width: getImageRenderedWidth(box),
        height: "auto",
        zIndex: isDragging ? 999 : box.zIndex,
        transition: isDragging
          ? "transform 140ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 140ms ease"
          : "left 210ms cubic-bezier(0.22, 1, 0.36, 1), top 210ms cubic-bezier(0.22, 1, 0.36, 1), transform 160ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 180ms ease",
      }}
      className={cn(
        "animate-vim-box-enter absolute cursor-move overflow-hidden rounded-xs border-0 bg-transparent p-0",
        isDragging && "scale-[1.015] cursor-grabbing shadow-xl",
        isTarget && "ring-2 ring-primary",
      )}
      title={box.src}
    >
      {failed ? (
        <div className="flex w-full items-center justify-center bg-muted px-2 py-2 text-center text-xs text-muted-foreground">
          Image failed to load
        </div>
      ) : (
        <img
          src={box.src}
          alt={box.alt ?? ""}
          draggable={false}
          onError={() => setFailed(true)}
          className="pointer-events-none h-auto w-full select-none"
        />
      )}
    </button>
  )
}
interface FreeFormTextBoxProps {
  box: TextBox
  isTarget: boolean
  isTextScope: boolean
  isInserting: boolean
  isDragging: boolean
  textCursor: number
  visualTextRange: [number, number] | null
  onMouseDown: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  onChangeText: (text: string) => void
  onCursorSync: (pos: number) => void
}
function FreeFormTextBox({
  box,
  isTarget,
  isTextScope,
  isInserting,
  isDragging,
  textCursor,
  visualTextRange,
  onMouseDown,
  onDoubleClick,
  onChangeText,
  onCursorSync,
}: FreeFormTextBoxProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const textMeasureRef = useRef<HTMLSpanElement>(null)
  const prevTextRef = useRef(box.text)
  const [freshRange, setFreshRange] = useState<{
    start: number
    end: number
    gen: number
  } | null>(null)
  const [cursorRect, setCursorRect] = useState<{
    left: number
    top: number
    width: number
    height: number
    visible: boolean
  }>({ left: 0, top: 0, width: 10, height: 24, visible: false })
  const [isTypingActive, setIsTypingActive] = useState(false)
  useEffect(() => {
    const prev = prevTextRef.current
    const next = box.text
    prevTextRef.current = next
    if (next.length > prev.length) {
      let start = 0
      while (start < prev.length && prev[start] === next[start]) {
        start++
      }
      let prevEnd = prev.length - 1
      let nextEnd = next.length - 1
      while (
        prevEnd >= start
        && nextEnd >= start
        && prev[prevEnd] === next[nextEnd]
      ) {
        prevEnd--
        nextEnd--
      }
      if (nextEnd >= start) {
        setFreshRange((r) => ({ start, end: nextEnd, gen: (r?.gen ?? 0) + 1 }))
      }
    } else {
      setFreshRange(null)
    }
    setIsTypingActive(true)
    const timer = window.setTimeout(() => setIsTypingActive(false), 320)
    return () => window.clearTimeout(timer)
  }, [box.text])
  useEffect(() => {
    setIsTypingActive(true)
    const timer = window.setTimeout(() => setIsTypingActive(false), 320)
    return () => window.clearTimeout(timer)
  }, [])
  useEffect(() => {
    if (isInserting && textareaRef.current) {
      const clamped = Math.max(0, Math.min(textCursor, box.text.length))
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(clamped, clamped)
    }
  }, [isInserting, textCursor, box.text.length])
  useLayoutEffect(() => {
    const container = textMeasureRef.current
    if (!container || (!isTextScope && !isInserting)) {
      setCursorRect((prev) =>
        prev.visible ? { ...prev, visible: false } : prev,
      )
      return
    }
    const syncCursorGeometry = () => {
      const chars = Array.from(box.text)
      const clampedIdx = Math.max(0, Math.min(textCursor, chars.length))
      const targetEl = container.querySelector<HTMLElement>(
        `[data-char-idx="${clampedIdx}"]`,
      )
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect()
        const parentRect = container.getBoundingClientRect()
        const scale =
          container.offsetWidth > 0
            ? parentRect.width / container.offsetWidth
            : 1
        const left =
          scale > 0
            ? (rect.left - parentRect.left) / scale
            : targetEl.offsetLeft
        const top =
          scale > 0 ? (rect.top - parentRect.top) / scale : targetEl.offsetTop
        const measuredWidth =
          scale > 0 ? rect.width / scale : targetEl.offsetWidth
        const measuredHeight =
          scale > 0 ? rect.height / scale : targetEl.offsetHeight
        setCursorRect({
          left,
          top,
          width: Math.max(measuredWidth, Math.round(box.fontSize * 0.35)),
          height: measuredHeight || Math.round(box.fontSize * 1.25),
          visible: true,
        })
      }
    }
    syncCursorGeometry()
    let rafId = 0
    const startTime = performance.now()
    const tick = (now: number) => {
      syncCursorGeometry()
      if (now - startTime < 230) {
        rafId = window.requestAnimationFrame(tick)
      }
    }
    rafId = window.requestAnimationFrame(tick)
    const observer = new ResizeObserver(syncCursorGeometry)
    observer.observe(container)
    return () => {
      window.cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [box.text, box.fontSize, textCursor, isTextScope, isInserting])
  const typographyClasses = getBoxTypographyClasses(box)
  const renderAnimatedGlyphs = () => {
    const chars = Array.from(box.text)
    if (chars.length === 0 && !isTextScope && !isInserting) {
      return <span className="text-muted-foreground">Empty box</span>
    }
    return (
      <span
        ref={textMeasureRef}
        className={cn(
          "relative block whitespace-pre-wrap wrap-break-word",
          typographyClasses,
        )}
      >
        {chars.map((char, idx) => {
          const isSelected =
            isTextScope
            && !isInserting
            && visualTextRange !== null
            && idx >= visualTextRange[0]
            && idx <= visualTextRange[1]
          const isFresh =
            isInserting
            && freshRange !== null
            && idx >= freshRange.start
            && idx <= freshRange.end
          if (char === "\n") {
            return (
              <span key={idx} className="inline">
                <span
                  data-char-idx={idx}
                  className={cn(
                    "inline-block w-[0.35em] select-none",
                    isSelected && "rounded-xs bg-primary/30",
                  )}
                >
                  {"\u200b"}
                </span>
                <br />
              </span>
            )
          }
          return (
            <span
              key={isFresh ? `${idx}-${freshRange.gen}` : idx}
              data-char-idx={idx}
              className={cn(
                "transition-colors duration-100",
                isSelected && "rounded-xs bg-primary/30",
                isFresh && "animate-vim-char",
              )}
            >
              {char}
            </span>
          )
        })}
        <span
          data-char-idx={chars.length}
          className="inline-block w-[0.55em] select-none"
        >
          {"\u200b"}
        </span>
      </span>
    )
  }
  const showAnimatedLayer = isTextScope || isInserting
  const colorProps = getBoxColorProps(box.color)
  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      style={{
        left: box.x,
        top: box.y,
        zIndex: isDragging ? 999 : box.zIndex,
        fontSize: box.fontSize,
        ...colorProps.style,
        transition: isDragging
          ? "transform 140ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 140ms ease"
          : "left 210ms cubic-bezier(0.22, 1, 0.36, 1), top 210ms cubic-bezier(0.22, 1, 0.36, 1), font-size 180ms cubic-bezier(0.22, 1, 0.36, 1), color 160ms ease, transform 160ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 180ms ease",
      }}
      className={cn(
        "animate-vim-box-enter absolute inline-block max-w-205 select-none rounded-xs px-2 py-1 leading-snug will-change-[left,top,transform]",
        colorProps.className,
        typographyClasses,
        !isInserting && (isDragging ? "cursor-grabbing" : "cursor-move"),
        isDragging && "scale-[1.015] shadow-xl",
        isTarget && !isTextScope && "ring-2 ring-primary",
        isTextScope && !isInserting && "ring-2 ring-chart-2 bg-chart-2/5",
        isInserting && "ring-2 ring-chart-3 bg-chart-3/5",
      )}
    >
      {showAnimatedLayer ? (
        <div className="relative inline-grid">
          {cursorRect.visible && (
            <span
              aria-hidden="true"
              style={{
                transform: `translate3d(${cursorRect.left}px, ${cursorRect.top}px, 0)`,
                width: isInserting ? 2.5 : cursorRect.width,
                height: cursorRect.height,
                transition:
                  "transform 85ms cubic-bezier(0.22, 1, 0.36, 1), width 85ms cubic-bezier(0.22, 1, 0.36, 1), height 85ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              className={cn(
                "pointer-events-none absolute left-0 top-0 z-10 rounded-xs",
                isInserting
                  ? "bg-current shadow-[0_0_8px_currentColor]"
                  : "bg-primary/35 ring-1 ring-primary",
                !isTypingActive && "animate-vim-cursor-blink",
              )}
            />
          )}
          <div className="col-start-1 row-start-1">
            {renderAnimatedGlyphs()}
          </div>
          {isInserting && (
            <textarea
              ref={textareaRef}
              rows={1}
              value={box.text}
              onChange={(e) => {
                onChangeText(e.target.value)
                onCursorSync(e.target.selectionStart ?? e.target.value.length)
              }}
              onSelect={(e) =>
                onCursorSync(e.currentTarget.selectionStart ?? 0)
              }
              onKeyUp={(e) => onCursorSync(e.currentTarget.selectionStart ?? 0)}
              onClick={(e) => onCursorSync(e.currentTarget.selectionStart ?? 0)}
              className={cn(
                "col-start-1 row-start-1 h-full w-full resize-none overflow-hidden whitespace-pre-wrap wrap-break-word bg-transparent p-0 leading-snug text-transparent caret-transparent selection:bg-primary/25 focus:outline-none",
                typographyClasses,
              )}
            />
          )}
        </div>
      ) : (
        <span
          className={cn(
            "block whitespace-pre-wrap wrap-break-word",
            typographyClasses,
          )}
        >
          {box.text || <span className="text-muted-foreground">Empty box</span>}
        </span>
      )}
    </div>
  )
}
function ModeBadge({ mode }: { mode: VimMode }) {
  return (
    <span
      className={cn(
        "rounded px-2 py-0.5 text-[11px] font-semibold tracking-wider",
        mode === "NORMAL" && "bg-primary text-primary-foreground",
        mode === "INSERT" && "bg-chart-2 text-primary-foreground",
        mode === "VISUAL" && "bg-chart-3 text-primary-foreground",
        mode === "COMMAND" && "bg-chart-4 text-primary-foreground",
      )}
    >
      {mode}
    </span>
  )
}
function ScopeBadge({ scope }: { scope: EditorScope }) {
  return (
    <span
      className={cn(
        "rounded border px-1.5 py-0.5 text-[10px] font-medium tracking-wider",
        scope === "BASE"
          ? "border-border bg-background/70 text-foreground"
          : "border-primary/40 bg-primary/15 text-primary",
      )}
    >
      {scope}
    </span>
  )
}
interface SlideFilmstripProps {
  title: string
  slides: Slide[]
  activeIndex: number
  onSelectSlide: (index: number) => void
  onAddSlide: () => void
}
function SlideFilmstrip({
  title,
  slides,
  activeIndex,
  onSelectSlide,
  onAddSlide,
}: SlideFilmstripProps) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const hasMounted = useRef(false)
  useLayoutEffect(() => {
    const root = listRef.current
    const thumb = root?.querySelector<HTMLElement>("[data-thumbnail]")
    if (!root || !thumb) return
    const update = () => {
      if (thumb.clientWidth > 0) {
        root.style.setProperty(
          "--thumb-scale",
          String(thumb.clientWidth / LOGICAL_WIDTH),
        )
      }
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(thumb)
    return () => observer.disconnect()
  }, [slides[0]?.id, slides.length])
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])
  return (
    <aside className="flex h-full flex-col bg-muted/20 overflow-y-auto scrollbar-none">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 backdrop-blur-xs z-20 bg-popover/50 sticky top-0">
        <div className="min-w-0">
          <div
            className="truncate text-sm font-medium text-foreground"
            title={title}
          >
            {title}
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            Slides ({slides.length})
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onAddSlide}
          title="New slide (:s new)"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3">
          <div ref={listRef} className="flex flex-col gap-3">
            {slides.map((slide, index) => {
            const isActive = index === activeIndex
            return (
              <button
                key={slide.id}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
                type="button"
                onClick={() => onSelectSlide(index)}
                className="group flex w-full items-start gap-2.5 text-left focus:outline-none"
              >
                <span
                  className={cn(
                    "w-4 pt-1 text-right font-mono text-xs tabular-nums transition-colors",
                    isActive
                      ? "font-semibold text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <SlideThumbnail slide={slide} isActive={isActive} />
              </button>
            )
          })}
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}
function SlideThumbnail({
  slide,
  isActive,
}: {
  slide: Slide
  isActive: boolean
}) {
  const ordered = [...slide.boxes].sort((a, b) => a.zIndex - b.zIndex)
  return (
    <div
      data-thumbnail=""
      style={
        slide.background ? { backgroundColor: slide.background } : undefined
      }
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-sm border text-foreground shadow-xs transition-all",
        !slide.background && "bg-secondary",
        isActive
          ? "border-primary ring-2 ring-primary"
          : "border-border group-hover:border-foreground/40",
      )}
    >
      <div
        style={{
          width: LOGICAL_WIDTH,
          height: LOGICAL_HEIGHT,
          transform: "scale(var(--thumb-scale, 0.18))",
          transformOrigin: "top left",
        }}
        className="pointer-events-none relative"
      >
        {ordered.map((box) => (
          <StaticSlideBox key={box.id} box={box} />
        ))}
      </div>
    </div>
  )
}
