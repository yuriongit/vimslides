import { AppNavbar } from "@/components/custom/app-navbar"
import { createClient } from '#/lib/supabase/client'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

const supabase = createClient()

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppNavbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}