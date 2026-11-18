import type { User } from "@supabase/supabase-js"
import type { UseMutateAsyncFunction } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { toast } from "@/components/ui/toast"
import type { PresentationInsert } from "./presentation.types"

// Side-effect logic
export function useCreatePresentation({
  user,
  createFn,
}: {
  user: User
  createFn: UseMutateAsyncFunction<void, Error, PresentationInsert>
}) {
  const [open, setOpen] = useState(false)

  function openCreatePresentation() {
    setOpen(true)
  }

  async function createPresentation(title: string, description: string) {
    await toast.promise(
      createFn({
        user_id: user.id,
        title,
        description: description || null,
        slide_count: 0,
        file_url: "",
      }).then(() => setOpen(false)),
      {
        loading: "Creating presentation",
        success: "Successfully created presentation",
        error: "Failed to create presentation",
      }
    )
  }

  return {
    open,
    setOpen,
    openCreatePresentation,
    createPresentation,
  }
}

// UI component
export function CreatePresentationSheet({
  toggleBtn,
  open,
  onOpenChange,
  onSubmit,
}: {
  toggleBtn: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (title: string, description: string) => Promise<void>
}) {
  const [sheetTitle, setSheetTitle] = useState("Vim is the Best!")
  const [sheetDesc, setSheetDesc] = useState("The best way to edit text.")

  async function handleCreatePresentation() {
    await onSubmit(sheetTitle, sheetDesc)
    setSheetTitle("")
    setSheetDesc("")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {toggleBtn && <SheetTrigger render={<Button>Create</Button>} />}

      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create a new presentation</SheetTitle>
          <SheetDescription>
            Fill out basic metadata for your new presentation.
          </SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <div className="grid gap-3">
            <Label htmlFor="sheet-title-input">Title</Label>
            <Input
              value={sheetTitle}
              onEnter={handleCreatePresentation}
              onChange={(e) => setSheetTitle(e.target.value)}
              id="sheet-title-input"
              placeholder="Vim is the Best!"
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="sheet-desc-input">Description</Label>
            <Input
              value={sheetDesc}
              onEnter={handleCreatePresentation}
              onChange={(e) => setSheetDesc(e.target.value)}
              id="sheet-desc-input"
              placeholder="Optional"
            />
          </div>
        </div>

        <SheetFooter>
          <Button type="submit" onClick={handleCreatePresentation}>
            Confirm
          </Button>
          <SheetClose render={<Button variant="outline">Close</Button>} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
