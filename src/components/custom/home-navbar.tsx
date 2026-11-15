import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { Link } from "@tanstack/react-router"
import { ModeToggle } from "../mode-toggle"

export function HomeNavbar() {
  return (
    <nav className="w-full font-medium flex justify-between">
      <NavigationMenu>
        <NavigationMenuList>
          
          <NavigationMenuItem>
            <ModeToggle/>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <NavigationMenuLink
              render={<Link to="/" />}
            >
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
              render={<Link to="/login" />}
            >
              Login
            </NavigationMenuLink>
          </NavigationMenuItem>
          
        </NavigationMenuList>
      </NavigationMenu>
      
    </nav>
  )
}
