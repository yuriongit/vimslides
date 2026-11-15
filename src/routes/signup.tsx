import { createFileRoute } from "@tanstack/react-router"
import { SignUpForm } from "#/components/sign-up-form"

export const Route = createFileRoute("/signup")({
  component: RouteComponent,
})

function RouteComponent() {
  return SignUpForm({ className: "max-w-sm w-full" })
}
