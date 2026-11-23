import { createFileRoute, Outlet } from "@tanstack/react-router"
import { HomeNavbar } from "@/components/ui/home-navbar"

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
})

function PublicLayout() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center">
      <HomeNavbar />
      <Outlet />
    </main>
  )
}
