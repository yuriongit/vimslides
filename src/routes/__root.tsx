import { TanStackDevtools } from "@tanstack/react-devtools"
import { createRootRoute, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import "../index.css"
import { HomeFooter } from "#/components/custom/home-footer"
import { HomeNavbar } from "@/components/custom/home-navbar"

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-between px-6 py-3">
      <HomeNavbar />

      <div className="flex w-full max-w-7xl flex-col items-center justify-center">
        <Outlet />

        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "TanStack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
      </div>

      <HomeFooter />
    </main>
  )
}
