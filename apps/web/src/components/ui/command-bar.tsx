import type { Presentation } from "@vss/shared"
import { useEffect, useState } from "react"
import type {
  PickerCommand,
  PresentationCommand,
} from "@/components/services/presentations/home/presentation-commands"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export function usePresentationsViewBar(
  isOpen: boolean,
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement

      const isInteractive = target.closest(
        "input, textarea, select, button, a, [role='button'], [role='menuitem'], [role='dialog'], [role='alertdialog'], [contenteditable='true']",
      )

      if (e.key === ":" && !isOpen && !isInteractive) {
        e.preventDefault()
        setIsOpen(true)
      }

      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, setIsOpen])
}

function formatDate(value?: string | null) {
  if (!value) return "N/A"
  const date = new Date(value)
  const currentDate = new Date()
  if (date.getFullYear() === currentDate.getFullYear()) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

type PresentationsViewBarProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  commands: PresentationCommand[]
  presentations: Presentation[]
}

export function PresentationsCmdBar({
  open,
  onOpenChange,
  commands,
  presentations,
}: PresentationsViewBarProps) {
  const [activePicker, setActivePicker] = useState<PickerCommand | null>(null)
  const [search, setSearch] = useState("")

  // Covers every way the bar can close (Escape, outside click, :q, a pick)
  useEffect(() => {
    if (!open) {
      setActivePicker(null)
      setSearch("")
    }
  }, [open])

  function goBack() {
    setActivePicker(null)
    setSearch("")
  }

  function handleSelectCommand(command: PresentationCommand) {
    if (command.kind === "picker") {
      setActivePicker(command)
      setSearch("")
      return
    }
    command.execute()
    onOpenChange(false)
  }

  function handleSelectPresentation(presentation: Presentation) {
    activePicker?.onPick(presentation)
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      {/* key remounts Command on page change so cmdk's highlighted item resets */}
      <Command key={activePicker?.name ?? "root"}>
        <CommandInput
          autoFocus
          className="font-mono"
          placeholder={
            activePicker
              ? `${activePicker.name}: type a presentation title…`
              : "Execute a command…"
          }
          value={search}
          onValueChange={setSearch}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && search === "" && activePicker) {
              e.preventDefault()
              goBack()
            }
          }}
        />

        <CommandList>
          <CommandEmpty>
            {activePicker ? "No presentations found." : "No results found."}
          </CommandEmpty>

          {activePicker ? (
            <>
              <CommandGroup>
                <CommandItem value=":back" onSelect={goBack}>
                  <div className="flex flex-col">
                    <span>:back</span>
                    <span className="text-xs text-muted-foreground">
                      Return to commands
                    </span>
                  </div>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading={activePicker.description}>
                {presentations.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={String(p.id)}
                    keywords={[p.title, String(p.id), formatDate(p.created_at)]}
                    onSelect={() => handleSelectPresentation(p)}
                  >
                    <div className="min-w-full">
                      <div className="flex min-w-full items-center justify-between gap-4">
                        <span className="truncate max-w-2xs">{p.title}</span>
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          id={String(p.id)}
                        </span>
                      </div>

                      <div className="w-full flex flex-col">
                        <span className="shrink-0 text-xs text-primary">
                          {/*//@ts-expect-error - TODO: Add last_modified once files are available*/}
                          Modified: {formatDate(p?.last_modified)}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          Creation: {formatDate(p.created_at)}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : (
            <CommandGroup heading="Presentations">
              {commands.map((command) => (
                <CommandItem
                  key={command.name}
                  value={command.name}
                  onSelect={() => handleSelectCommand(command)}
                >
                  <div className="flex flex-col">
                    <span>{command.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {command.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
