import { Link, useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { LogOut } from "lucide-react"

const supabase = createClient()

export type UserBasicProfile = {
  email: string
  error: string
}

async function getUserBasicProfile(): Promise<UserBasicProfile> {
  try {
    const user = (await supabase.auth.getUser()).data.user
    console.log(user)
    if (user !== null && user !== undefined) {
      return {
        email: user.email!, // cannot be null / undefined because it's needed for signup
        error: "",
      }
    }
    return { email: "", error: "user null / undefined" }
  } catch (error) {
    console.error("cause: ", error)
    return { email: "", error: "error: error occured in getUserBasicProfile()" }
  }
}

// const userBasicData = await getUserBasicProfile()

export function AppNavbar() {
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    await navigate({ to: "/login" })
  }

  return (
    <nav className="flex items-center justify-between border-b px-6 py-3">
      <Link to="/projects" className="font-special text-xl font-semibold">
        <span className={`text-primary`}>Vim</span>
        Slides
      </Link>

      <Button variant="destructive" size={"sm"} onClick={handleSignOut}>
        Sign out
        <LogOut />
      </Button>
    </nav>
  )
}
