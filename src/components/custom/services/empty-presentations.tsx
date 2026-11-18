import type { User } from "@supabase/supabase-js"
import type { UseMutateAsyncFunction } from "@tanstack/react-query"
import { ArrowUpRightIcon } from "lucide-react"
import { CreatePresentationSheet } from "@/components/custom/services/create-presentation"
import type { PresentationInsert } from "@/components/custom/services/presentation.types"
import { Button } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

export function EmptyPresentationsList({
  user,
  createFn,
}: {
  user: User
  createFn: UseMutateAsyncFunction<void, Error, PresentationInsert>
}) {
  return (
    <div>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No Presentations Yet</EmptyTitle>
          <EmptyDescription>
            You haven&apos;t created any presentations yet. Get started by
            creating your first presentation.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-2">
          <CreatePresentationSheet user={user} createFn={createFn} />
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
        {/* TODO: Use Sheet */}
        <Drawer />
      </Empty>
    </div>
  )
}
