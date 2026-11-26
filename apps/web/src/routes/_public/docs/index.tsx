import { createFileRoute } from "@tanstack/react-router"
import { DocsView } from "@/components/pages/docs/docs"

export const Route = createFileRoute("/_public/docs/")({
  component: RouteComponent,
})

function RouteComponent() {
  return <DocsView slug={"index"} />
}
