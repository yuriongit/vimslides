import { Link, useRouterState } from "@tanstack/react-router"
import type { ComponentProps } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Presentations",
      items: [{ title: "All Presentations", url: "/presentations" }],
    },
    {
      title: "Learn",
      items: [
        { title: "Docs", url: "/docs" },
        { title: "Getting Started", url: "/docs/getting-started" },
        { title: "Ex Commands", url: "/docs/ex-commands" },
        { title: "Keybindings", url: "/docs/keybindings" },
      ],
    },
  ],
}

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <Sidebar {...props}>
      <SidebarContent>
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      className="m-0 p-0"
                      isActive={pathname === item.url}
                    >
                      <Link className="w-full p-2" to={item.url}>
                        {item.title}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
