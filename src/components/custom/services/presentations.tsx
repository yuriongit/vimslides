import { Separator } from "@/components/ui/separator"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Drawer } from "@/components/ui/drawer"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { UseMutateAsyncFunction } from "@tanstack/react-query"
import { ArrowUpRightIcon, Ellipsis, Pencil, Trash } from "lucide-react"
import type { Database } from "@/../database.types"
import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import {
  ItemHeader,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"
import { toast } from "@/components/ui/toast"

export type Presentation = Database["public"]["Tables"]["presentations"]["Row"]
export type PresentationId = Database["public"]["Tables"]["presentations"]["Row"]["id"]
export type PresentationInsert = Database["public"]["Tables"]["presentations"]["Insert"]

export function PresentationsList(
  {
    user,
    presentations,
    createFn,
    deleteFn
  }:
  {
    presentations: Presentation[]
    user: User
    createFn: UseMutateAsyncFunction<void, Error, PresentationInsert>
    deleteFn: UseMutateAsyncFunction<void, Error, PresentationId>
  }
) {
  function PresentationActionsDropdown({id}: {id: PresentationId}) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className={buttonVariants({size: "sm", variant: "ghost"})}>
          <Ellipsis/>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={"w-full"}>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Management</DropdownMenuLabel>
            <DropdownMenuItem>
              <Pencil/> Edit metadata
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuItem className={"w-full"} render={
            <AlertDialog>
            <AlertDialogTrigger render={<Button className={buttonVariants({variant: "destructive", className: "w-full justify-start"})}><Trash /> Delete </Button>} />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    presentation from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant={"destructive"}
                    onClick={() => {
                      toast.promise(deleteFn(id), {loading: "Deleting presentation", error: "Failed to delete presentation", success: "Successfully deleted presentation"
                      })
                    }}>
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          }>
          </DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <main className="rounded-sm bg-card xl:max-h-200 xl:min-h-200 p-8 flex flex-col gap-5
      xl:max-w-7xl w-full">
      <div className="flex justify-between min-w-full items-center h-full">
        <div>
          <header className="text-2xl font-semibold tracking-[-0.045em] text-balance sm:text-3xl text-primary font-special">
            Presentations
          </header>
          <p className="text-accent-foreground text-sm sm:text-base font-sans">
            All your presentations - manage them here.
          </p>
        </div>
        <CreatePresentationSheet
          user={user}
          createFn={createFn} />
      </div>
      <Separator/>
      <ItemGroup className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4overflow-hidden overflow-y-auto scrollbar-none min-h-full h-full w-full min-w-full mt-2 ">
        {presentations.map((p, idx) => {
          idx+=1
          return (
            <Item key={p.id} variant={"muted"}>
              <ItemHeader>
                <img
                  loading="lazy"
                  // TODO: add `preview_url` to DB schema - not in the database
                  // Temporarily serving a placeholder image
                  //@ts-expect-error - TODO: replace
                  src={p?.preview_url ?? "https://images.unsplash.com/photo-1650804068570-7fb2e3dbf888?q=80&w=640&auto=format&fit=crop"}
                  alt={`Presentation - ${p.title}`}
                  className="aspect-video rounded-sm object-cover"
                />
              </ItemHeader>

              <ItemContent>
                <ItemTitle>
                  <code className="font-mono text-primary">
                    :{idx}
                  </code>
                  {" "}
                  {p.title}
                </ItemTitle>
                <ItemDescription>{p.description ?? "No description."}</ItemDescription>
              </ItemContent>

              <ItemActions>
                <PresentationActionsDropdown id={p.id} />
              </ItemActions>
            </Item>
          )
        })}
      </ItemGroup>
    </main>
  )
}

export function EmptyPresentationsList({
  user,
  createFn,
}: {
  user: User
  createFn: UseMutateAsyncFunction<void, Error, PresentationInsert>
}) {
  return (
    <div>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No Presentations Yet</EmptyTitle>
          <EmptyDescription>
            You haven&apos;t created any presentations yet. Get started by creating
            your first presentation.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-2">
          <CreatePresentationSheet
            user={user}
            createFn={createFn} />
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
        <Drawer/>
      </Empty>
    </div>
  )
}

function CreatePresentationSheet(
  { user, createFn }:
    {
      user: User,
      createFn: UseMutateAsyncFunction<void, Error, PresentationInsert>
    }
) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetTitle, setSheetTitle] = useState("Vim is the Best!")
  const [sheetDesc, setSheetDesc] = useState("The best way to edit text.")

  async function handleCreatePresentationConfirmation() {
    try {
      await createFn({
        user_id: user.id,
        title: sheetTitle,
        description: sheetDesc || null,
        slide_count: 0,
        // Workers will update the presentation entry's URL with the new file (from queue work)
        file_url: "",
      })
      setSheetOpen(false)
      setSheetTitle("")
      setSheetDesc("")
    } catch (error) {
      console.error("Failed to create presentation:", error)
    }
  }
  
  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger render={<Button>Create</Button>} />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create a new presentation</SheetTitle>
          <SheetDescription>
            Fill out basic metadata for your new presentation.
          </SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <div className="grid gap-3">
            <Label htmlFor="sheet-title-label">Title</Label>
            <Input
              value={sheetTitle}
              onEnter={handleCreatePresentationConfirmation}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSheetTitle(e.target.value)}
              id="sheet-title-input"
              placeholder="Vim is the Best!"
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="sheet-desc-label">Description</Label>
            <Input
              // onKeyDown example usage:
              // onKeyDown={(e) => {
              //   if (e.key == "e")
              //   console.log(5)
              // }}
              value={sheetDesc}
              onEnter={handleCreatePresentationConfirmation}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSheetDesc(e.target.value)}
              id="sheet-desc-input"
              placeholder="Optional"
            />
          </div>
        </div>
        <SheetFooter>
          <Button
            type="submit"
            onClick={handleCreatePresentationConfirmation}>Confirm</Button>
          <SheetClose render={<Button variant="outline">Close</Button>} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
