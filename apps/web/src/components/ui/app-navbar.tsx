import { Link, useNavigate, useRouteContext } from "@tanstack/react-router"
import { Cog, LogOut, Pencil, UserCircle2 } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/clients/supabase/supabase.client"

export function AppNavbar() {
  const navigate = useNavigate()
  const { user } = useRouteContext({ from: "/_authenticated" })

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("sign out failed:", error.message)
      return
    }
    await navigate({ to: "/login" })
  }

  return (
    <nav className="flex w-full items-center justify-between border-b px-6 py-3">
      <div className="flex items-center">
        <ModeToggle />
      </div>

      <Link to="/presentations" className="font-special text-xl font-semibold">
        <span className="text-primary">Vim</span>
        Slides
      </Link>

      <UserDropdownMenu email={user.email} onSignOut={handleSignOut} />
    </nav>
  )
}

type UserDropdownMenuProps = {
  email: string | undefined
  onSignOut: () => void
}

function UserDropdownMenu({ email, onSignOut }: UserDropdownMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <UserCircle2 />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-fit">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col items-start gap-0">
            My Account
            {email && (
              <span className="text-xs font-normal text-muted-foreground">
                {email}
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Pencil />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Cog />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            className={buttonVariants({
              variant: "destructive",
              className: "w-full justify-start",
            })}
            onClick={onSignOut}
          >
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
