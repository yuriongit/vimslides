import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { PresentationCanvas } from "@/components/services/presentations/canvas/presentation-canvas"
import type { Slide } from "@/components/services/presentations/canvas/vim-slides.types"
import { Loading } from "@/components/ui/loading"
import { getAuthHeaders } from "@/lib/auth/get-auth-headers"
import { api } from "@/lib/clients/api/api.client"

export const Route = createFileRoute("/_authenticated/presentations/$id")({
  component: PresentationEditor,
})

function PresentationEditor() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const presentationId = Number(id)
  const isValidId = Number.isInteger(presentationId) && presentationId > 0

  const presentationQuery = useQuery({
    queryKey: ["presentation", presentationId],
    enabled: isValidId,
    queryFn: async () => {
      const headers = await getAuthHeaders()
      const { data, error, status } = await api
        .presentations({ id: presentationId })
        .get({ headers })

      if (error || !data) {
        throw new Error(
          status === 404
            ? "Presentation not found"
            : "Failed to load presentation",
        )
      }
      return data
    },
  })

  if (!isValidId) return <p>Invalid presentation</p>
  if (presentationQuery.isLoading) return <Loading />
  if (presentationQuery.isError || !presentationQuery.data) {
    return <p>Error: {presentationQuery.error?.message ?? "Not found"}</p>
  }

  const presentation = presentationQuery.data
  const cloudSlides = Array.isArray(presentation.slides)
    ? (presentation.slides as unknown as Slide[])
    : []

  return (
    <PresentationCanvas
      initialCloudSlides={cloudSlides}
      onCloudWrite={async (slides) => {
        const { error } = await api
          .presentations({ id: presentation.id })
          .patch({ slides }, { headers: await getAuthHeaders() })

        if (error) throw new Error("Cloud write failed")

        await queryClient.invalidateQueries({
          queryKey: ["presentation", presentation.id],
        })
        await queryClient.invalidateQueries({ queryKey: ["presentations"] })
      }}
      presentationId={String(presentation.id)}
      title={presentation.title}
      onExitToDashboard={() => void navigate({ to: "/presentations" })}
    />
  )
}
