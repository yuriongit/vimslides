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

export function CreatePresentationSheet({
  user,
  createFn,
}: {
  user: User
  createFn: UseMutateAsyncFunction<void, Error, PresentationInsert>
}) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetTitle, setSheetTitle] = useState("Vim is the Best!")
  const [sheetDesc, setSheetDesc] = useState("The best way to edit text.")

  async function createPresentationConfirmation() {
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
  }

  function handleCreatePresentation() {
    toast.promise(createPresentationConfirmation(), createPresentationToast)
  }
  const createPresentationToast = {
    loading: "Creating presentation",
    success: "Successfully created presentation",
    error: "Failed to create presentation",
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
              onEnter={handleCreatePresentation}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSheetTitle(e.target.value)
              }
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
              onEnter={handleCreatePresentation}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSheetDesc(e.target.value)
              }
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
