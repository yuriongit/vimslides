import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { AppNavbar } from "@/components/ui/app-navbar"
import { Toaster } from "@/components/ui/toast"
import { TooltipProvider } from "@/components/ui/tooltip"
import { supabase } from "@/lib/clients/supabase/supabase.client"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      })
    }

    return { user: session.user }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppNavbar />
      <main className="mx-auto flex flex-col justify-center w-full max-w-8xl flex-1 px-6 py-6">
        <TooltipProvider>
          <Outlet />
        </TooltipProvider>
        <Toaster />
      </main>
    </div>
  )
}
