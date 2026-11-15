import * as React from "react"

import { buttonVariants } from "@/components/ballmac/button"
import { cn } from "@/lib/utils"
import { Link } from "@tanstack/react-router"

type Action = { label: string; to: string }

type Hero4Props = Omit<React.ComponentProps<"section">, "title"> & {
  /** Short line in the pill above the heading. */
  announcement?: string
  /** The heading. */
  title?: React.ReactNode
  /** One or two sentences under the heading. */
  description?: string
  /** Main call to action. */
  primaryAction?: Action
  /** Secondary call to action. */
  secondaryAction?: Action
  /** Headline numbers under the actions. */
  stats?: { value: string; label: string }[]
  /** Your own image instead of the globe. An image URL (give it mediaAlt), an object with alt text and a dark-mode file, or your own element. */
  media?: MediaSource
  /** Describes `media` when it is a plain URL. */
  mediaAlt?: string
}

function Hero4({
  title = "Create your next presentation with",
  description = "Ever wish Google Slides or Microsoft Powerpoint had Vim? Don't wish further.",
  primaryAction = { label: "Start", to: "/login" },
  secondaryAction = { label: "Source", to: "https://github.com/yuriongit/vimslides" },
  stats = [
    { value: "85%", label: "more productive" }, // 85% is just a placeholder up until verified stats are provided
    { value: "Fast.", label: "avg. latency ~ 40ms" }, // 40ms is just a placeholder up until verified stats are provided
    { value: "Free", label: "0 cost; MIT license" },
  ],
  className,
  ...props
}: Hero4Props) {
  return (
    <section data-slot="hero-4" className={cn("relative isolate overflow-hidden", className)} {...props}>
      <div className="mx-auto justify-center text-center max-w-6xl flex items-center px-4 pt-20 sm:px-6 lg:py-16">
        <div className="relative z-10 py-4 lg:py-24 flex flex-col text-center items-center">
          <h1 className="mt-6 text-4xl leading-[1.04] max-w-2xl font-semibold tracking-[-0.045em] text-balance sm:text-6xl">{title} <span className={`text-primary font-special`}>Vim.</span>
</h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-pretty text-muted-foreground">{description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={primaryAction.to} className={buttonVariants({ size: "default", shape: "default" })+" font-special text-special"}>
              {primaryAction.label}
            </Link>
            <a href={secondaryAction.to} className={buttonVariants({ size: "default", shape: "pill", variant: "outline" })}>
              {secondaryAction.label}
            </a>
          </div>
          {stats.length > 0 && (
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t pt-6">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col-reverse gap-1">
                  <dt className="text-sm text-muted-foreground">{s.label}</dt>
                  <dd className="text-2xl font-semibold tracking-tight font-special tabular-nums">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  )
}

export { Hero4, type Hero4Props }
