import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useRouteContext } from "@tanstack/react-router"
import { Loading } from "@/components/custom/loading"
import {
  EmptyPresentationsList,
  type PresentationId,
  type PresentationInsert,
  PresentationsList,
} from "#/components/custom/services/presentations"
import { supabase } from "@/lib/supabase/client"

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
      // TODO: create API for such methods - GET /user_presentation
      const { data, error } = await supabase
        .from("presentations")
        .select("*")
        .eq("user_id", user.user.id) // not strictly necessary due to RLS policy
        .order("created_at")
      if (error) return `Error: ${error.message} \nCause: ${error.cause}`

      return data
    },
  })
  // Mutations
  const presentationCreateMutation = useMutation({
    mutationFn: async (presentation: PresentationInsert) => {
      const { error } = await supabase.from("presentations").insert(presentation)
      if (error)
        throw new Error(`Error: ${error.message} \nCause: ${error.cause}`)
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["presentations"] })
    },
  })
  const presentationDeleteMutation = useMutation({
    mutationFn: async (id: PresentationId) => {
      const { error } = await supabase.from("presentations").delete().eq("id", id)
      if (error)
        throw new Error(`Error: ${error.message} \nCause: ${error.cause}`)
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
      ) : presentationsQuery.data === undefined
        || typeof presentationsQuery.data === "string"
        || presentationsQuery.data.length === 0 ? (
        <EmptyPresentationsList
          user={user.user}
          createFn={presentationCreateMutation.mutateAsync}
        />
      ) : (
        <PresentationsList
          user={user.user}
          createFn={presentationCreateMutation.mutateAsync}
          deleteFn={presentationDeleteMutation.mutateAsync}
          presentations={presentationsQuery.data}
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
