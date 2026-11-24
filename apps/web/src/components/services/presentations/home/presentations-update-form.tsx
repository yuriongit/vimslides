import { useForm } from "@tanstack/react-form"
import type { UseMutateAsyncFunction } from "@tanstack/react-query"
import {
  DESCRIPTION_MAX_LENGTH,
  type Ok,
  type Presentation,
  type PresentationCreationForm,
  PresentationCreationFormSchema,
  type PresentationUpdate,
  TITLE_MAX_LENGTH,
} from "@vss/shared"
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
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { toast } from "@/components/ui/toast"
import { useInputComboShortcut } from "@/hooks/useInputComboShortcut"
import { errorMessage } from "@/utils/error-messages"

// Side-effect logic
export function useUpdatePresentation({
  updateFn,
}: {
  updateFn: UseMutateAsyncFunction<Ok, Error, PresentationUpdate>
}) {
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<Presentation | null>(null)

  function openUpdatePresentation(presentation: Presentation) {
    setTarget(presentation)
    setOpen(true)
  }

  async function updatePresentation({
    title,
    description,
  }: PresentationCreationForm) {
    if (!target) return

    await toast.promise(
      updateFn({
        id: target.id,
        fields: { title, description: description || null },
      }).then(() => setOpen(false)),
      {
        loading: "Updating presentation",
        success: "Successfully updated presentation",
        error: (err: unknown) => ({
          title: "Failed to update presentation",
          description: errorMessage(err),
        }),
      },
    )
  }

  return {
    open,
    setOpen,
    target,
    openUpdatePresentation,
    updatePresentation,
  }
}

// UI component
function UpdatePresentationForm({
  presentation,
  onSubmit,
}: {
  presentation: Presentation
  onSubmit: (data: PresentationCreationForm) => Promise<void>
}) {
  const form = useForm({
    defaultValues: {
      title: presentation.title,
      description: presentation.description ?? "",
    },
    validators: {
      onSubmit: PresentationCreationFormSchema,
      onChange: PresentationCreationFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
      form.reset()
    },
  })
  const onUpdateShortcut = useInputComboShortcut({
    keys: ["ctrl", "enter"],
    handleSubmit: form.handleSubmit,
  })

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Update presentation</CardTitle>
        <CardDescription>
          Update your presentation&apos;s metadata.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="presentation-update-form"
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
                        onKeyDown={onUpdateShortcut.onKeyDown}
                        aria-invalid={isInvalid}
                        placeholder="My Awesome Presentation Title…"
                        autoComplete="off"
                        rows={4}
                        className="min-h-14 resize-none"
                      />
                      <InputGroupAddon align="block-end">
                        <InputGroupText className="tabular-nums">
                          {field.state.value.length}/{TITLE_MAX_LENGTH}
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
                        onKeyDown={onUpdateShortcut.onKeyDown}
                        placeholder="My awesome presentation description…"
                        rows={6}
                        className="min-h-24 resize-none"
                        aria-invalid={isInvalid}
                      />
                      <InputGroupAddon align="block-end">
                        <InputGroupText className="tabular-nums">
                          {field.state.value.length}/{DESCRIPTION_MAX_LENGTH}
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
          <Button type="button" variant="ghost" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button
            type="submit"
            variant={"outline"}
            form="presentation-update-form"
            shortcut={onUpdateShortcut.shortcut}
          >
            Update
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}

export function UpdatePresentationSheet({
  open,
  onOpenChange,
  presentation,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  presentation: Presentation | null
  onSubmit: (data: PresentationCreationForm) => Promise<void>
}) {
  if (!presentation) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <UpdatePresentationForm
          key={presentation.id}
          presentation={presentation}
          onSubmit={onSubmit}
        />
      </SheetContent>
    </Sheet>
  )
}
