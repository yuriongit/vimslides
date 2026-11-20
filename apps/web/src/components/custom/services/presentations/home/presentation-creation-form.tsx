import {
  type PresentationCreationForm,
  PresentationCreationFormSchema,
} from "@repo/shared"
import type { User } from "@supabase/supabase-js"
import { useForm } from "@tanstack/react-form"
import type { UseMutateAsyncFunction } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "@/components/ui/toast"
import { useInputComboShortcut } from "@/hooks/useInputComboShortcut"
import type { PresentationInsert } from "../presentation.types"

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
  const onCreateShortcut = useInputComboShortcut({
    keys: ["ctrl", "enter"],
    handleSubmit: form.handleSubmit,
  })

  const titleMaxLength = PresentationCreationFormSchema.shape.title.maxLength
  const descriptionMaxLength =
    PresentationCreationFormSchema.shape.description.options[1].maxLength

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {toggleBtn && (
        <SheetTrigger render={<Button shortcut=":newp">Create</Button>} />
      )}
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
                            onKeyDown={onCreateShortcut.onKeyDown}
                            aria-invalid={isInvalid}
                            placeholder="My Awesome Presentation Title…"
                            autoComplete="off"
                            rows={4}
                            className="min-h-14 resize-none"
                          />
                          <InputGroupAddon align="block-end">
                            <InputGroupText className="tabular-nums">
                              {field.state.value.length}/{titleMaxLength}
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
                            onKeyDown={onCreateShortcut.onKeyDown}
                            placeholder="My awesome presentation description…"
                            rows={6}
                            className="min-h-24 resize-none"
                            aria-invalid={isInvalid}
                          />
                          <InputGroupAddon align="block-end">
                            <InputGroupText className="tabular-nums">
                              {field.state.value.length}/{descriptionMaxLength}
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
            <Field orientation="horizontal" className="justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => form.reset()}
              >
                Reset
              </Button>
              <Button
                type="submit"
                variant={"outline"}
                form="presentation-creation-form"
                shortcut={onCreateShortcut.shortcut}
              >
                Create
              </Button>
            </Field>
          </CardFooter>
        </Card>
      </SheetContent>
    </Sheet>
  )
}
