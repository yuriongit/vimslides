import { Spinner } from "@/components/ui/spinner"

export function Loading() {
  return (
    <div className="absolute left-0 right-0 flex justify-center">
      <Spinner className="size-7" />
    </div>
  )
}
