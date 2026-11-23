import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useRouteContext } from "@tanstack/react-router"
import type {
  PresentationId,
  PresentationInsert,
  PresentationUpdate,
} from "@vss/shared"
import { PresentationsList } from "@/components/services/presentations/home/presentations-list"
import { Loading } from "@/components/ui/loading"
import { MINUTE } from "@/constants/constants"
import { getAuthHeaders } from "@/lib/auth/get-auth-headers"
import { api } from "@/lib/clients/api/api.client"

export const Route = createFileRoute("/_authenticated/presentations")({
  component: Presentations,
})
function Presentations() {
  const user = useRouteContext({ from: "/_authenticated" })
  // Access the client
  const queryClient = useQueryClient()
  // Queries
  const presentationsQuery = useQuery({
    queryKey: ["presentations"],
    queryFn: async () => {
      const headers = await getAuthHeaders()
      const { data, error } = await api.presentations.get({ headers: headers })

      if (error) throw error
      return data
    },
    staleTime: MINUTE * 5,
    refetchInterval: MINUTE * 20,
    refetchIntervalInBackground: false,
  })
  // Mutations
  const presentationCreateMutation = useMutation({
    mutationFn: async (presentation: PresentationInsert) => {
      const authHeaders = await getAuthHeaders()
      const { data, error } = await api.presentations.post(presentation, {
        headers: authHeaders,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["presentations"] })
    },
  })
  const presentationDeleteMutation = useMutation({
    mutationFn: async (id: PresentationId) => {
      const authHeaders = await getAuthHeaders()
      const { error } = await api.presentations.delete(
        { id },
        { headers: authHeaders },
      )
      if (error) throw error
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["presentations"] })
    },
  })
  const presentationUpdateMutation = useMutation({
    mutationKey: ["presentations"],
    mutationFn: async (presentation: PresentationUpdate) => {
      const authHeaders = await getAuthHeaders()
      const { data, error } = await api.presentations.patch(presentation, {headers: authHeaders})
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["presentations"] })
    },
  })

  return (
    <div className="flex flex-col items-center justify-center">
      {presentationsQuery.isLoading ? (
        <Loading />
      ) : presentationsQuery.isError ? (
        <p>{`Error: ${presentationsQuery.error.message}`}</p>
      ) : (
        <PresentationsList
          user={user.user}
          presentations={presentationsQuery.data ?? []}
          syncFn={() => presentationsQuery.refetch({ throwOnError: true })}
          createFn={presentationCreateMutation.mutateAsync}
          deleteFn={presentationDeleteMutation.mutateAsync}
          updateFn={presentationUpdateMutation.mutateAsync}
        />
      )}
    </div>
  )
}

// type Deck = {
//   schemaVersion: number
//   slide: { width: 1920; height: 1080 } // 16:9
//   slides: Slide[] // array order = slide order
// }
//
// type Slide = {
//   id: string
//   elements: Element[] // array order = back to front
// }
