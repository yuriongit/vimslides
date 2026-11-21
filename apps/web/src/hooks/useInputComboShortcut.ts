import { useCallback, useEffect, useMemo, useState } from "react"

type ShortcutKey = "ctrl" | "shift" | "alt" | "meta" | string

type UseInputComboShortcutProps = {
  keys: ShortcutKey[]
  handleSubmit?: () => unknown
}

const MODIFIERS = ["ctrl", "shift", "alt", "meta"]

export function useInputComboShortcut({
  keys,
  handleSubmit,
}: UseInputComboShortcutProps) {
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(navigator.platform.toLowerCase().includes("mac"))
  }, [])

  const SYMBOLS: Record<string, string> = {
    ctrl: isMac ? "⌘" : "Ctrl",
    shift: "⇧",
    alt: isMac ? "⌥" : "Alt",
    meta: "⌘",
    enter: "↵",
    escape: "⎋",
    backspace: "⌫",
    delete: "⌦",
    tab: "⇥",
    arrowup: "↑",
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→",
  }

  // Normalize Ctrl to Command on macOS.
  const normalizedKeys = useMemo(
    () =>
      keys.map((key) => {
        const normalized = key.toLowerCase()
        return isMac && normalized === "ctrl" ? "meta" : normalized
      }),
    [keys, isMac],
  )

  // Generate the display string.
  const shortcut = [
    ...MODIFIERS.filter((key) => normalizedKeys.includes(key)),
    ...normalizedKeys.filter((key) => !MODIFIERS.includes(key)),
  ]
    .map((key) => SYMBOLS[key] ?? key.toUpperCase())
    .join(" + ")

  // Handle keyboard events.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const pressedModifiers = {
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey,
      }

      const requiredModifiers = normalizedKeys.filter((key) =>
        MODIFIERS.includes(key),
      )

      const mainKey = normalizedKeys.find((key) => !MODIFIERS.includes(key))

      const modifiersMatch = MODIFIERS.every(
        (key) =>
          pressedModifiers[key as keyof typeof pressedModifiers]
          === requiredModifiers.includes(key),
      )

      const keyMatches = mainKey === e.key.toLowerCase()

      if (modifiersMatch && keyMatches) {
        e.preventDefault()
        handleSubmit?.()
      }
    },
    [normalizedKeys, handleSubmit],
  )

  return {
    onKeyDown,
    shortcut,
  }
}
