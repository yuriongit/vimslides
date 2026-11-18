type PresentationCommand = {
  name: string
  description: string
  execute: () => void
}

type PresentationCommands = {
  onCreate: () => void
  onDelete: () => void
  onSync: () => void
  onClose: () => void
}

export function definePresentationCommands({
  onCreate,
  onDelete,
  onSync,
  onClose,
}: PresentationCommands): PresentationCommand[] {
  return [
    {
      name: ":newp",
      description: "Create presentation",
      execute: onCreate,
    },
    {
      name: ":delp",
      description: "Delete presentation",
      execute: onDelete,
    },
    {
      name: ":sync",
      description: "Sync / refresh presentations",
      execute: onSync,
    },
    {
      name: ":q",
      description: "Close command bar",
      execute: onClose,
    },
  ]
}
