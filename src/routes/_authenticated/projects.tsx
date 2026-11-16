import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useRouteContext } from "@tanstack/react-router"
import { ArrowUpRightIcon } from "lucide-react"
import { Loading } from "#/components/custom/loading"
import { ProjectsList } from "#/components/custom/services/projects"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { supabase } from "@/lib/supabase/client"

export const Route = createFileRoute("/_authenticated/projects")({
  component: Projects,
})

function Projects() {
  const user = useRouteContext({ from: "/_authenticated" })
  // Access the client
  const queryClient = useQueryClient()

  // Queries
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      // TODO: create API for such methods - GET /user_projects
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.user.id)
      if (error)
        return `An error has occurred: ${error.message} \nCause: ${error.cause}`

      return data
    },
  })
  // Mutations
  const _projectsMutation = useMutation({
    mutationFn: async () => {
      const exampleProject = {
        user_id: user.user.id,
        description: "slide desc",
        title: "My First Slide",
        slide_count: 2,
        file_url: "https://cdn.aws.s3-buckets.fake.api.com",
      }
      const { error } = await supabase.from("projects").insert(exampleProject)
      if (error)
        return `An error has occurred: ${error.message} \nCause: ${error.cause}`
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
        <p>{`An error has occurred: ${projectsQuery.error.message}`}</p>
      ) : projectsQuery.data === undefined
        || typeof projectsQuery.data === "string"
        || projectsQuery.data.length === 0 ? (
        <EmptyProjects />
      ) : (
        <ProjectsList projects={projectsQuery.data} />
      )}
    </div>
  )
}

function EmptyProjects() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No Projects Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any projects yet. Get started by creating
          your first project.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button>Create</Button>
        <Button variant="outline">Import</Button>
      </EmptyContent>
      <Button
        variant="link"
        className="text-muted-foreground"
        size="sm"
        nativeButton={false}
        render={
          <a
            href={`https://github.com/yuriongit/vimslides`}
            target="_blank"
            rel="noreferrer"
            className={` `}
          >
            Learn More <ArrowUpRightIcon />
          </a>
        }
      />
    </Empty>
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
