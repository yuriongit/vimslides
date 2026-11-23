import { Link } from "@tanstack/react-router"
import { ModeToggle } from "@/components/mode-toggle"
import { buttonVariants } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"

export function HomeNavbar() {
  return (
    <nav className="absolute top-0 flex w-full justify-between border-b px-6 py-3 font-medium">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <ModeToggle />
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink render={<Link to="/" />}>
              Home
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink
              target="_blank"
              rel="noreferrer"
              href="https://github.com/yuriongit/vimslides"
            >
              GitHub
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              render={
                <Link
                  to="/login"
                  className={buttonVariants({
                    variant: "outline",
                    size: "default",
                  })}
                >
                  Login
                </Link>
              }
            ></NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  )
}
