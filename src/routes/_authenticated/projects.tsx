import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useRouteContext } from "@tanstack/react-router"
import { Loading } from "@/components/custom/loading"
import {
  EmptyProjectsList,
  type ProjectInsert,
  ProjectsList,
} from "@/components/custom/services/projects"
import { supabase } from "@/lib/supabase/client"

export const Route = createFileRoute("/_authenticated/projects")({
  component: Presentations,
})

function Presentations() {
  const user = useRouteContext({ from: "/_authenticated" })
  // Access the client
  const queryClient = useQueryClient()

  // Queries
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      // TODO: create API for such methods - GET /user_project
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.user.id) // not strictly necessary due to RLS policy
      if (error) return `Error: ${error.message} \nCause: ${error.cause}`

      return data
    },
  })
  // Mutations
  const projectMutation = useMutation({
    mutationFn: async (presentation: ProjectInsert) => {
      const { error } = await supabase.from("projects").insert(presentation)
      if (error)
        throw new Error(`Error: ${error.message} \nCause: ${error.cause}`)
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })

  return (
    <div className="flex flex-col items-center justify-center">
      {projectsQuery.isLoading ? (
        <Loading />
      ) : projectsQuery.isError ? (
        <p>{`Error: ${projectsQuery.error.message}`}</p>
      ) : projectsQuery.data === undefined
        || typeof projectsQuery.data === "string"
        || projectsQuery.data.length === 0 ? (
        <EmptyProjectsList
          user={user.user}
          projectsCreateFn={projectMutation.mutateAsync}
        />
      ) : (
        <ProjectsList
          user={user.user}
          projectsCreateFn={projectMutation.mutateAsync}
          projects={projectsQuery.data}
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

// export function handleCreateNewProject() {}
