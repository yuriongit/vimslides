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
import type { PresentationInsert } from "../presentation.types"
import { PresentationCreationSchema, type PresentationCreation } from "../presentation.schemas"

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

  async function createPresentation({title, description}: PresentationCreation) {
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
  onSubmit: (data: PresentationCreation) => Promise<void>
}) {
  const [presentationTitle, setPresentationTitle] = useState("Vim is the Best!") // defaults set for dev purposes 
  const [presentationDesc, setPresentationDesc] = useState("The best way to edit text.") // defaults set for dev purposes

  const [errors, setErrors] = useState<{ title?: string; description?: string }>({})
  
  async function handleCreatePresentation() {
    const result = PresentationCreationSchema.safeParse({
      title: presentationTitle,
      description: presentationDesc,
    })
  
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setErrors({
        title: fieldErrors.title?.[0],
        description: fieldErrors.description?.[0],
      })
      return
    }
  
    setErrors({})
    await onSubmit(result.data)
    setPresentationTitle("")
    setPresentationDesc("")
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
              id="sheet-title-input"
              value={presentationTitle}
              aria-invalid={!!errors.title}
              onEnter={handleCreatePresentation}
              onChange={(e) => {
                setPresentationTitle(e.target.value)
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }))
              }}
              placeholder="Vim is the Best!"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>
          
          <div className="grid gap-3">
            <Label htmlFor="sheet-desc-input">Description</Label>
            <Input
              id="sheet-desc-input"
              value={presentationDesc}
              aria-invalid={!!errors.description}
              onEnter={handleCreatePresentation}
              onChange={(e) => {
                setPresentationDesc(e.target.value)
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }))
              }}
              placeholder="Optional"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
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
