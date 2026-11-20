import { Pencil, Trash } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function PresentationActionsDropdown({
  onDelete,
}: {
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={buttonVariants({ size: "xs", variant: "secondary" })}
      >
        Actions
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Management</DropdownMenuLabel>
          <DropdownMenuItem>
            <Pencil /> Edit metadata
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuItem
          onClick={onDelete}
          className={buttonVariants({
            variant: "destructive",
            className: "w-full justify-start",
          })}
        >
          <Trash /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
