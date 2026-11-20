import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useRouteContext } from "@tanstack/react-router"
import type {
  Presentation,
  PresentationId,
  PresentationInsertion,
} from "@vss/shared"
import { Loading } from "@/components/custom/loading"
import { PresentationsList } from "@/components/custom/services/presentations/home/presentations-list"
import { MINUTE } from "@/constants/constants"
import { api } from "@/lib/api"
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
    mutationFn: async (presentation: PresentationInsertion) => {
      const { data, error } = await api.presentations.post(presentation)
      console.log(error?.status)
      if (error) throw error.value
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["presentations"] })
    },
    onError: (err) => {
      if (err.cause === 422) {
        // validation failure, err.value is Elysia's validation object
        // 422 === Unprocessable Content
      } else if (err.cause === 500) {
        console.log(err.message)
        // err.value.message is the string you returned from status(500, ...)
      }
    },
  })
  const presentationDeleteMutation = useMutation({
    mutationFn: async (id: PresentationId) => {
      const { data, error } = await supabase
        .from("presentations")
        .delete()
        .eq("id", id)
        .select()

      if (error) throw error
      if (!data || data.length === 0)
        // This error handling will happen server side
        // Frontend will just perform `if (error) throw error`
        throw new Error(
          "Unauthorized: You do not have permission to perform this action.",
        )
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
