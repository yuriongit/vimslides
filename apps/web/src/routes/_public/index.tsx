import { createFileRoute } from "@tanstack/react-router"
import { Hero } from "@/components/pages/landing/blocks/hero"

export const Route = createFileRoute("/_public/")({ component: Home })

function Home() {
  return <Hero />
}
