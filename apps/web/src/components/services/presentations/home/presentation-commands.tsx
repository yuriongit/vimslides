import type { Presentation, PresentationOrderBy } from "@vss/shared"
import { toast } from "@/components/ui/toast"

type CommandBase = {
  name: string
  description: string
}

export type ActionCommand = CommandBase & {
  kind: "action"
  execute: () => void
  /**
   * Accepts typed arguments from the command input, e.g. `:order mod asc`.
   * When present, the command bar renders a "run with arguments" item for
   * `<name> <args>` input.
   */
  apply?: (args: string) => void
}

export type PickerCommand = CommandBase & {
  kind: "picker"
  onPick: (presentation: Presentation) => void
}

export type PresentationCommand = ActionCommand | PickerCommand

type PresentationCommands = {
  onCreate: () => void
  onSync: () => void
  onGrid: () => void
  onList: () => void
  onOrder: (order: PresentationOrderBy) => void
  onClose: () => void
  onOpen: (presentation: Presentation) => void
  onDelete: (presentation: Presentation) => void
  onEdit: (presentation: Presentation) => void
}

const ORDER_USAGE = "Usage: :order <modified/mod|created/cre> <asc|desc>"

export function parseOrderArgs(args: string): PresentationOrderBy | null {
  const match = /^(mod(?:ified)?|cre(?:ated)?)\s+(asc|desc)$/i.exec(args.trim())
  if (!match) return null
  const [keyArg, directionArg] = match.slice(1)
  if (!keyArg || !directionArg) return null
  return {
    key: keyArg.toLowerCase().startsWith("cre") ? "createdAt" : "lastModified",
    direction: directionArg.toLowerCase() === "desc" ? "desc" : "asc",
  }
}

export function definePresentationCommands({
  onCreate,
  onSync,
  onGrid,
  onList,
  onOrder,
  onClose,
  onOpen,
  onDelete,
  onEdit,
}: PresentationCommands): PresentationCommand[] {
  return [
    {
      kind: "action",
      name: ":newp",
      description: "Create presentation",
      execute: onCreate,
    },
    {
      kind: "picker",
      name: ":openp",
      description: "Open presentation",
      onPick: onOpen,
    },
    {
      kind: "picker",
      name: ":metap",
      description: "Edit presentation metadata",
      onPick: onEdit,
    },
    {
      kind: "picker",
      name: ":delp",
      description: "Delete presentation",
      onPick: onDelete,
    },
    {
      kind: "action",
      name: ":sync",
      description: "Sync / refresh presentations",
      execute: onSync,
    },
    {
      kind: "action",
      name: ":grid",
      description: "Switch to grid layout",
      execute: onGrid,
    },
    {
      kind: "action",
      name: ":list",
      description: "Switch to list layout",
      execute: onList,
    },
    {
      kind: "action",
      name: ":order",
      description: "Order presentations — :order <mod|cre> <asc|desc>",
      execute: () => toast.add({ title: ORDER_USAGE }),
      apply: (args) => {
        const order = parseOrderArgs(args)
        if (!order) {
          toast.add({ title: ORDER_USAGE })
          return
        }
        onOrder(order)
      },
    },
    {
      kind: "action",
      name: ":q",
      description: "Close command bar",
      execute: onClose,
    },
  ]
}
