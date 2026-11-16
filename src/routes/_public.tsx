import { createFileRoute, Outlet } from "@tanstack/react-router"
import { HomeFooter } from "@/components/custom/home-footer"
import { HomeNavbar } from "@/components/custom/home-navbar"

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
})

function PublicLayout() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-between px-6 py-3">
      <HomeNavbar />
      <div className="flex w-full max-w-7xl flex-col items-center justify-center">
        <Outlet />
      </div>
      <HomeFooter />
    </main>
  )
}
