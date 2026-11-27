import { Github } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
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
    <nav className="flex w-full items-center justify-between bg-sidebar top-0 sticky px-6 py-3 z-30">
      <NavigationMenu className={"z-10"}>
        <NavigationMenuList className="flex gap-2 pr-0.5">
          <NavigationMenuItem>
            <ModeToggle />
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink
              target="_blank"
              rel="noopener"
              href="https://github.com/yuriongit/vimslides"
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            >
              <HugeiconsIcon strokeWidth={2} icon={Github} />
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={buttonVariants({ variant: "ghost", size: "sm" })}
              render={<Link to="/" />}
            >
              Home
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink
              className={buttonVariants({ variant: "ghost", size: "sm" })}
              render={<Link to="/docs" />}
            >
              Docs
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <Link
        to="/presentations"
        className="fixed left-0 right-0 flex justify-center z-0 font-special text-xl font-semibold"
      >
        <span className="text-primary">Vim</span>
        Slides
      </Link>

      <NavigationMenu className={"z-10"}>
        <NavigationMenuList className={"flex gap-1 "}>
          <NavigationMenuItem>
            <NavigationMenuLink
              render={
                <Link
                  to="/sign-up"
                  className={buttonVariants({
                    variant: "default",
                    size: "sm",
                  })}
                >
                  Get Started
                </Link>
              }
            ></NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink
              render={
                <Link
                  to="/login"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
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
