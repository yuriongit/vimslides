import type { Presentation } from "@/components/custom/services/presentation.types"

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
  onClose: () => void
  onDelete: (presentation: Presentation) => void
}

export function definePresentationCommands({
  onCreate,
  onSync,
  onClose,
  onDelete,
}: PresentationCommands): PresentationCommand[] {
  return [
    { kind: "action", name: ":newp", description: "Create presentation", execute: onCreate },
    { kind: "picker", name: ":delp", description: "Delete presentation", onPick: onDelete },
    { kind: "action", name: ":sync", description: "Sync / refresh presentations", execute: onSync },
    { kind: "action", name: ":q", description: "Close command bar", execute: onClose },
  ]
}
