import type { User } from "@supabase/supabase-js"
import type { UseMutateAsyncFunction } from "@tanstack/react-query"
import { Ellipsis, Pencil, Trash } from "lucide-react"
import { useState } from "react"
import { CreatePresentationSheet } from "@/components/custom/services/create-presentation"
import type {
  Presentation,
  PresentationId,
  PresentationInsert,
} from "@/components/custom/services/presentation.types"
import { usePresentationCommands as definePresentationCommands } from "@/components/custom/services/presentation-commands"
import {
  PresentationsCmdBar,
  usePresentationsViewBar,
} from "@/components/custom/ui/command-bar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/toast"

export function PresentationsList({
  user,
  presentations,
  createFn,
  deleteFn,
}: {
  presentations: Presentation[]
  user: User
  createFn: UseMutateAsyncFunction<void, Error, PresentationInsert>
  deleteFn: UseMutateAsyncFunction<void, Error, PresentationId>
}) {
  const [openCmdBar, setOpenCmdBar] = useState(false)
  usePresentationsViewBar(openCmdBar, setOpenCmdBar)
  const commands = definePresentationCommands({
    onCreate: () => {
      // Open your create presentation flow
    },
    onDelete: () => {
      // Open your delete presentation flow
    },
    onSync: () => {
      // Sync (refresh) presentations
    },
    onClose: () => setOpenCmdBar(false),
  })

  return (
    <>
      <PresentationsCmdBar
        open={openCmdBar}
        onOpenChange={setOpenCmdBar}
        commands={commands}
      />
      <main className="rounded-sm bg-card p-8 flex flex-col gap-5 xl:max-h-180 xl:min-h-180 xl:max-w-7xl w-full">
        <div className="flex justify-between min-w-full items-center h-full">
          <div>
            <header className="text-2xl font-semibold tracking-[-0.045em] text-balance sm:text-3xl text-primary font-special">
              Presentations
            </header>
            <p className="text-accent-foreground text-sm sm:text-base font-sans">
              All your presentations - manage them here.
            </p>
          </div>
          <CreatePresentationSheet user={user} createFn={createFn} />
        </div>
        <Separator />
        <ItemGroup className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4overflow-hidden overflow-y-auto scrollbar-none min-h-full h-full w-full min-w-full mt-2 ">
          {presentations.map((p, idx) => {
            idx += 1
            return (
              <Item key={p.id} variant={"muted"}>
                <ItemHeader>
                  <img
                    loading="lazy"
                    // TODO: add `preview_url` to DB schema - not in the database
                    // Temporarily serving a placeholder image
                    src={
                      //@ts-expect-error - TODO: replace
                      p?.preview_url
                      ?? "https://images.unsplash.com/photo-1650804068570-7fb2e3dbf888?q=80&w=640&auto=format&fit=crop"
                    }
                    alt={`Presentation - ${p.title}`}
                    className="aspect-video rounded-sm object-cover"
                  />
                </ItemHeader>

                <ItemContent>
                  <ItemTitle>
                    <code className="font-mono text-primary">:{idx}</code>{" "}
                    {p.title}
                  </ItemTitle>
                  <ItemDescription>
                    {p.description ?? "No description."}
                  </ItemDescription>
                </ItemContent>

                <ItemActions>
                  <PresentationActionsDropdown
                    id={p.id}
                    deleteFn={deleteFn}
                  />
                </ItemActions>
              </Item>
            )
          })}
        </ItemGroup>
      </main>
    </>
  )
}

function PresentationActionsDropdown(
  { id, deleteFn }:
  { id: PresentationId, deleteFn: UseMutateAsyncFunction<void, Error, PresentationId> }
) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={buttonVariants({ size: "sm", variant: "ghost" })}
      >
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent className={"w-full"}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Management</DropdownMenuLabel>
          <DropdownMenuItem>
            <Pencil /> Edit metadata
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuItem
          className={"w-full"}
          render={
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    className={buttonVariants({
                      variant: "destructive",
                      className: "w-full justify-start",
                    })}
                  >
                    <Trash /> Delete{" "}
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your presentation from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant={"destructive"}
                    onClick={() => {
                      toast.promise(deleteFn(id), {
                        loading: "Deleting presentation",
                        error: "Failed to delete presentation",
                        success: "Successfully deleted presentation",
                      })
                    }}
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          }
        ></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
