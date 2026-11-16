import type { Database } from "@/../database.types"

type Project = Database["public"]["Tables"]["projects"]["Row"]

export function ProjectsList({ projects }: {projects: Project[]}) {
  return (
    <main>
      projects list
      <ul>
        {projects.map((p) => {
          return (
            <div>
              {p.created_at}
            </div>
          )
        })}
      </ul>
    </main>
  )
}
