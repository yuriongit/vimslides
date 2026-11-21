import { createFileRoute } from "@tanstack/react-router"
import { Hero4 } from "@/components/ballmac/blocks/hero-4/hero-4"

export const Route = createFileRoute("/_public/")({ component: Home })

function Home() {
  return <Hero4 />
}
