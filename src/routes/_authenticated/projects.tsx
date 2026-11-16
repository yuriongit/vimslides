import { createFileRoute } from "@tanstack/react-router"
import { ArrowUpRightIcon, FolderOpen } from "lucide-react"

export const Route = createFileRoute("/_authenticated/projects")({
  component: Projects,
})

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

function Projects() {
  return (
    <div className="flex flex-col items-center justify-center">
      <EmptyProjects />
    </div>
  )
}
function EmptyProjects() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderOpen />
        </EmptyMedia>
        <EmptyTitle>No Projects Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any projects yet. Get started by creating
          your first project.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button>New</Button>
        <Button variant="outline">Import Project</Button>
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
