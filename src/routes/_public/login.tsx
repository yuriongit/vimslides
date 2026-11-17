import { createFileRoute, redirect } from "@tanstack/react-router"
import { LoginForm } from "#/components/login-form"
import { supabase } from "@/lib/supabase/client"

export const Route = createFileRoute("/_public/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const r = search.redirect
    const safe =
      typeof r === "string" && r.startsWith("/") && !r.startsWith("//")

    return { redirect: safe ? r : undefined }
  },
  beforeLoad: async ({ search }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      throw redirect({ href: search.redirect ?? "/projects" })
    }
  },
  component: Login,
})

function Login() {
  return LoginForm({ className: "max-w-sm w-full" })
}
