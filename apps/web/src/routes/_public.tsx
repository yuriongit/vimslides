import { createFileRoute, Outlet } from "@tanstack/react-router"
import { HomeNavbar } from "@/components/ui/home-navbar"

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
})

function PublicLayout() {
  return (
    <main>
      <HomeNavbar />
      <div className="min-h-[94vh] flex flex-col justify-center w-full items-center">
        <Outlet />
      </div>
    </main>
  )
}
