import { useEffect } from "react"
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
        "input, textarea, select, button, a, [role='button'], [role='menuitem'], [contenteditable='true']",
      )

      if (e.key === ":" && !isOpen && !isInteractive) {
        e.preventDefault()
        setIsOpen(true)
      }

      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement

      if (!target.closest("[data-ex-command-bar]")) {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("pointerdown", handlePointerDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [isOpen, setIsOpen])
}

type PresentationCommand = {
  name: string
  description: string
  execute: () => void
}

type PresentationsViewBarProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  commands: PresentationCommand[]
}

export function PresentationsCmdBar({
  open,
  onOpenChange,
  commands,
}: PresentationsViewBarProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
        <CommandInput className="font-mono" placeholder="Execute a command…" />

        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Presentations">
            {commands.map((command) => (
              <CommandItem
                key={command.name}
                value={command.name}
                onSelect={() => {
                  command.execute()
                  onOpenChange(false)
                }}
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
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
