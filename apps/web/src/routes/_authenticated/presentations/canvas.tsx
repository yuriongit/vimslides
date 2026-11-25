import { createFileRoute } from "@tanstack/react-router"
import { PresentationCanvas } from "@/components/services/presentations/canvas/presentation-canvas"

export const Route = createFileRoute("/_authenticated/presentations/canvas")({
  component: RouteComponent,
})

function RouteComponent() {
  return <PresentationCanvas presentationId="canvas-beta" />
}
