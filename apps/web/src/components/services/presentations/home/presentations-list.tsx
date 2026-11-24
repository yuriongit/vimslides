import type { User } from "@supabase/supabase-js"
import type { UseMutateAsyncFunction } from "@tanstack/react-query"
import type {
  Ok,
  Presentation,
  PresentationId,
  PresentationInsert,
  PresentationUpdate,
} from "@vss/shared"
import { ArrowUpRightIcon, RefreshCcwIcon } from "lucide-react"
import { useState } from "react"
import { DeletePresentationDialog } from "@/components/services/presentations/home/command-bar/delete-presentation-dialog"
import { definePresentationCommands } from "@/components/services/presentations/home/presentation-commands"
import { PresentationActionsDropdown } from "@/components/services/presentations/home/presentations-actions-dropdown"
import {
  CreatePresentationSheet,
  useCreatePresentation,
} from "@/components/services/presentations/home/presentations-creation-form"
import {
  UpdatePresentationSheet,
  useUpdatePresentation,
} from "@/components/services/presentations/home/presentations-update-form"
import { Button } from "@/components/ui/button"
import {
  PresentationsCmdBar,
  usePresentationsViewBar,
} from "@/components/ui/command-bar"
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
import { errorMessage } from "@/utils/error-messages"

export function PresentationsList({
  user,
  presentations,
  createFn,
  syncFn,
  deleteFn,
  updateFn,
}: {
  presentations: Presentation[]
  user: User
  createFn: UseMutateAsyncFunction<Ok, Error, PresentationInsert>
  syncFn: () => Promise<unknown>
  deleteFn: UseMutateAsyncFunction<void, Error, PresentationId>
  updateFn: UseMutateAsyncFunction<Ok, Error, PresentationUpdate>
}) {
  const { open, setOpen, openCreatePresentation, createPresentation } =
    useCreatePresentation({ user, createFn })

  const {
    open: openEdit,
    setOpen: setEditOpen,
    target: editTarget,
    openUpdatePresentation,
    updatePresentation,
  } = useUpdatePresentation({ updateFn })

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
      error: (err) => ({
        title: "Failed to delete presentation",
        description: errorMessage(err),
      }),
      success: "Successfully deleted presentation",
    })
  }

  function syncPresentations() {
    toast.promise(syncFn(), {
      loading: "Syncing presentations",
      error: (err) => ({
        title: "Failed to sync presentations",
        description: errorMessage(err),
      }),
      success: "Presentations synced",
    })
  }

  const commands = definePresentationCommands({
    onCreate: openCreatePresentation,
    onEdit: openUpdatePresentation,
    onDelete: requestDelete,
    onSync: syncPresentations,
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
      <UpdatePresentationSheet
        open={openEdit}
        onOpenChange={setEditOpen}
        presentation={editTarget}
        onSubmit={updatePresentation}
      />
      {presentations.length >= 1 ? (
        // List of projects view
        <main className="rounded-sm border bg-card p-8 flex flex-col gap-5 xl:h-[53em] min-h-full xl:max-w-7xl w-full">
          <div className="flex justify-between min-w-full items-center">
            <div>
              <header className="text-2xl font-semibold tracking-[-0.045em] text-balance sm:text-3xl text-primary font-special">
                Presentations
              </header>
              <p className="text-accent-foreground text-sm sm:text-base font-sans">
                All your presentations - manage them here.
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant={"ghost"} onClick={syncPresentations}>
                <RefreshCcwIcon />
              </Button>
              <CreatePresentationSheet
                toggleBtn={true}
                open={open}
                onOpenChange={setOpen}
                onSubmit={createPresentation}
              />
            </div>
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

                  <Separator />
                  <ItemActions>
                    <PresentationActionsDropdown
                      onDelete={() => requestDelete(p)}
                      onEdit={() => openUpdatePresentation(p)}
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
              open={open}
              onOpenChange={setOpen}
              onSubmit={createPresentation}
            />
            <Button variant="ghost">
              {/*Sync*/}
              <RefreshCcwIcon />
            </Button>
          </EmptyContent>
          <Button
            variant="link"
            className="text-muted-foreground"
            size="sm"
            nativeButton={false}
            render={
              // biome-ignore lint: ...
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
