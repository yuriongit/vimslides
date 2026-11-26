import type { Presentation } from "@vss/shared"

type CommandBase = {
  name: string
  description: string
}

export type ActionCommand = CommandBase & {
  kind: "action"
  execute: () => void
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
  onClose: () => void
  onOpen: (presentation: Presentation) => void
  onDelete: (presentation: Presentation) => void
  onEdit: (presentation: Presentation) => void
}

export function definePresentationCommands({
  onCreate,
  onSync,
  onGrid,
  onList,
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
      name: ":q",
      description: "Close command bar",
      execute: onClose,
    },
  ]
}
