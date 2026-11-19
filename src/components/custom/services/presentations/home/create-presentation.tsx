import type { User } from "@supabase/supabase-js"
import type { UseMutateAsyncFunction } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { toast } from "@/components/ui/toast"
import {
  type PresentationCreationForm,
  PresentationCreationFormSchema,
} from "../presentation.schemas"
import type { PresentationInsert } from "../presentation.types"
import { useForm } from "@tanstack/react-form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group"

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

  async function createPresentation({
    title,
    description,
  }: PresentationCreationForm) {
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
      },
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
  onSubmit: (data: PresentationCreationForm) => Promise<void>
}) {
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
    validators: {
      onSubmit: PresentationCreationFormSchema, 
      onChange: PresentationCreationFormSchema, 
    },
    onSubmit: async ({ value }) => {
      onSubmit(value)
      form.reset()
    },
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {toggleBtn && <SheetTrigger render={<Button>Create</Button>} />}
      <SheetContent>
        <Card className="w-full sm:max-w-md">
          <CardHeader>
            <CardTitle>Create a presentation</CardTitle>
            <CardDescription>Add your presentation's metadata.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              id="presentation-creation-form"
              onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
              }}
            >
              <FieldGroup>
                <form.Field
                  name="title"
                  // biome-ignore lint: UI form
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel
                          htmlFor={field.name}
                          className="items-center flex justify-between"
                        >
                          Title
                          <FieldDescription className="text-xs text-primary">
                            Required.
                          </FieldDescription>
                        </FieldLabel>
    
                        <InputGroup>
                          <InputGroupTextarea
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="My Awesome Presentation Title…"
                            autoComplete="off"
                            rows={4}
                            className="min-h-14 resize-none"
                          />
                          <InputGroupAddon align="block-end">
                            <InputGroupText className="tabular-nums">
                              {field.state.value.length}/100 characters
                            </InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>
    
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />
                <form.Field
                  name="description"
                  // biome-ignore lint: shadcn UI component
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel
                          htmlFor={field.name}
                          className="items-center flex justify-between"
                        >
                          Description
                          <FieldDescription className="text-xs">
                            Optional.
                          </FieldDescription>
                        </FieldLabel>
                        <InputGroup>
                          <InputGroupTextarea
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="My awesome presentation description…"
                            rows={6}
                            className="min-h-24 resize-none"
                            aria-invalid={isInvalid}
                          />
                          <InputGroupAddon align="block-end">
                            <InputGroupText className="tabular-nums">
                              {field.state.value.length}/250 characters
                            </InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter>
            <Field orientation="horizontal">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Reset
              </Button>
              <Button type="submit" form="presentation-creation-form">
                Submit
              </Button>
            </Field>
          </CardFooter>
        </Card>
      </SheetContent>
    </Sheet>
  )
}

//     <Sheet open={open} onOpenChange={onOpenChange}>
//       {toggleBtn && <SheetTrigger render={<Button>Create</Button>} />}
// 
//       <SheetContent>
//         <SheetHeader>
//           <SheetTitle>Create a new presentation</SheetTitle>
//           <SheetDescription>
//             Fill out basic metadata for your new presentation.
//           </SheetDescription>
//         </SheetHeader>
// 
//         <div className="grid flex-1 auto-rows-min gap-6 px-4">
//           <div className="grid gap-3">
//             <Label htmlFor="sheet-title-input">Title</Label>
//             <Input
//               id="sheet-title-input"
//               value={presentationTitle}
//               aria-invalid={!!errors.title}
//               onEnter={handleCreatePresentation}
//               onChange={(e) => {
//                 setPresentationTitle(e.target.value)
//                 if (errors.title)
//                   setErrors((prev) => ({ ...prev, title: undefined }))
//               }}
//               placeholder="Vim is the Best!"
//             />
//             {errors.title && (
//               <p className="text-sm text-destructive">{errors.title}</p>
//             )}
//           </div>
// 
//           <div className="grid gap-3">
//             <Label htmlFor="sheet-desc-input">Description</Label>
//             <Input
//               id="sheet-desc-input"
//               value={presentationDesc}
//               aria-invalid={!!errors.description}
//               onEnter={handleCreatePresentation}
//               onChange={(e) => {
//                 setPresentationDesc(e.target.value)
//                 if (errors.description)
//                   setErrors((prev) => ({ ...prev, description: undefined }))
//               }}
//               placeholder="Optional"
//             />
//             {errors.description && (
//               <p className="text-sm text-destructive">{errors.description}</p>
//             )}
//           </div>
//         </div>
// 
//         <SheetFooter>
//           <Button type="submit" onClick={handleCreatePresentation}>
//             Confirm
//           </Button>
//           <SheetClose render={<Button variant="outline">Close</Button>} />
//         </SheetFooter>
//       </SheetContent>
//     </Sheet>