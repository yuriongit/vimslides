import type { User } from "@supabase/supabase-js"
import type { UseMutateAsyncFunction } from "@tanstack/react-query"
import { ArrowUpRightIcon, Ellipsis, Pencil, Trash } from "lucide-react"
import { useState } from "react"
import { DeletePresentationDialog } from "@/components/custom/services/presentations/home/command-bar/delete-presentation-dialog"
import {
  CreatePresentationSheet,
  useCreatePresentation,
} from "@/components/custom/services/presentations/home/create-presentation"
import { definePresentationCommands } from "@/components/custom/services/presentations/home/presentation-commands"
import type {
  Presentation,
  PresentationId,
  PresentationInsert,
} from "@/components/custom/services/presentations/presentation.types"
import {
  PresentationsCmdBar,
  usePresentationsViewBar,
} from "@/components/custom/ui/command-bar"
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
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
  const {
    open: createSheetOpen,
    setOpen: setCreateSheetOpen,
    openCreatePresentation,
    createPresentation,
  } = useCreatePresentation({ user, createFn })

  const [openCmdBar, setOpenCmdBar] = useState(false)
  usePresentationsViewBar(openCmdBar, setOpenCmdBar)

  // target and open are separate so the title doesn't vanish during the close animation
  const [deleteTarget, setDeleteTarget] = useState<Presentation | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  function requestDelete(presentation: Presentation) {
    setDeleteTarget(presentation)
    setDeleteOpen(true)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    setDeleteOpen(false)
    toast.promise(deleteFn(deleteTarget.id), {
      loading: "Deleting presentation",
      error: "Failed to delete presentation",
      success: "Successfully deleted presentation",
    })
  }

  const commands = definePresentationCommands({
    onCreate: openCreatePresentation,
    onDelete: requestDelete,
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
        presentations={presentations}
      />
      <DeletePresentationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={deleteTarget?.title}
        onConfirm={confirmDelete}
      />
      {presentations.length >= 1 ? (
        // List of projects view
        <main className="rounded-sm bg-card p-8 flex flex-col gap-5 xl:h-[53em] min-h-full xl:max-w-8xl w-full">
          <div className="flex justify-between min-w-full items-center">
            <div>
              <header className="text-2xl font-semibold tracking-[-0.045em] text-balance sm:text-3xl text-primary font-special">
                Presentations
              </header>
              <p className="text-accent-foreground text-sm sm:text-base font-sans">
                All your presentations - manage them here.
              </p>
            </div>
            <CreatePresentationSheet
              toggleBtn={true}
              open={createSheetOpen}
              onOpenChange={setCreateSheetOpen}
              onSubmit={createPresentation}
            />
          </div>
          <Separator />
          <ItemGroup className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-hidden overflow-y-auto scrollbar-none h-fit w-full min-w-full mt-2">
            {presentations.map((p) => {
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
                    <ItemTitle>{p.title}</ItemTitle>
                    <ItemDescription>{p.description ?? "N/A"}</ItemDescription>
                  </ItemContent>

                  <ItemActions>
                    <PresentationActionsDropdown
                      onDelete={() => requestDelete(p)}
                    />
                  </ItemActions>
                </Item>
              )
            })}
          </ItemGroup>
        </main>
      ) : (
        // Empty "list" of projects view
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No Presentations Yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t created any presentations yet. Get started by
              creating your first presentation.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center gap-2">
            <CreatePresentationSheet
              toggleBtn={true}
              open={createSheetOpen}
              onOpenChange={setCreateSheetOpen}
              onSubmit={createPresentation}
            />
            <Button variant="outline">Import</Button>
          </EmptyContent>
          <Button
            variant="link"
            className="text-muted-foreground"
            size="sm"
            nativeButton={false}
            render={
              <a
                href={`https://github.com/yuriongit/vimslides`}
                target="_blank"
                rel="noreferrer"
                className={` `}
              >
                Learn More <ArrowUpRightIcon />
              </a>
            }
          />
        </Empty>
      )}
    </>
  )
}

function PresentationActionsDropdown({ onDelete }: { onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={buttonVariants({ size: "sm", variant: "ghost" })}
      >
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Management</DropdownMenuLabel>
          <DropdownMenuItem>
            <Pencil /> Edit metadata
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuItem onClick={onDelete} variant="destructive">
          <Trash /> Delete
        </DropdownMenuItem>
        {/*<DropdownMenuItem onClick={onDelete} className={buttonVariants({variant: "destructive", className: "w-full justify-start"})}>
          <Trash /> Delete
        </DropdownMenuItem>*/}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
