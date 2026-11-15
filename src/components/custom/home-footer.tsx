import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Link } from "@tanstack/react-router";

export function HomeFooter() {
  return (
    <nav className="w-fit">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={"opacity-0"}
              render={<Link to="/" />}
            >
              Placeholder
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>   
      </NavigationMenu>
    </nav>
  )
}
