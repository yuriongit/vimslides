import { createFileRoute, notFound, redirect } from "@tanstack/react-router"
import { DocsView } from "@/components/pages/docs/docs"
import { DOCS_PAGES, type DocSlug } from "@/components/pages/docs/docs-data"
export const Route = createFileRoute("/_public/docs/$slug")({
  beforeLoad: ({ params: { slug } }) => {
    if (slug === "index") throw redirect({ to: "/docs" })
    if (!(slug in DOCS_PAGES)) throw notFound()
  },
  component: RouteComponent,
})
function RouteComponent() {
  const { slug } = Route.useParams()
  return <DocsView slug={slug as DocSlug} />
}
