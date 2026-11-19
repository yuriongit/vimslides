import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useRouteContext } from "@tanstack/react-router"
import { Loading } from "@/components/custom/loading"
import { PresentationsList } from "@/components/custom/services/presentations/home/presentations"
import type {
  Presentation,
  PresentationId,
  PresentationInsert,
} from "@/components/custom/services/presentations/presentation.types"
import { MINUTE } from "@/constants/constants"
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
    queryFn: async (): Promise<Presentation[]> => {
      // TODO: create API for such methods - GET /user_presentation
      const { data, error } = await supabase
        .from("presentations")
        .select("*")
        .eq("user_id", user.user.id) // not strictly necessary due to RLS policy
        .order("created_at")
      if (error) throw error.message

      return data
    },
    staleTime: MINUTE * 5,
    refetchInterval: MINUTE * 20,
    refetchIntervalInBackground: false,
  })
  // Mutations
  const presentationCreateMutation = useMutation({
    mutationFn: async (presentation: PresentationInsert) => {
      const { error } = await supabase
        .from("presentations")
        .insert(presentation)
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
      const { error } = await supabase
        .from("presentations")
        .delete()
        .eq("id", id)
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
      ) : (
        <PresentationsList
          user={user.user}
          presentations={presentationsQuery.data ?? []}
          syncFn={() => presentationsQuery.refetch({ throwOnError: true })}
          // ={presentationsQuery.refetch}
          createFn={presentationCreateMutation.mutateAsync}
          deleteFn={presentationDeleteMutation.mutateAsync}
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
