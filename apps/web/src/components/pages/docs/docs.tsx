import { Link } from "@tanstack/react-router"
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Info,
  Search,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DOCS_PAGES, type DocBlock, type DocSlug } from "./docs-data"

function normalizeSlug(raw?: string): DocSlug {
  const clean = (raw ?? "").replace(/^\/+|\/+$/g, "").replace(/^docs\/?/, "")
  if (
    clean === "getting-started"
    || clean === "ex-commands"
    || clean === "keybindings"
  )
    return clean
  return "index"
}
function FilterableTable({
  searchable,
  headers,
  rows,
}: {
  searchable?: boolean
  headers: string[]
  rows: string[][]
}) {
  const [q, setQ] = useState("")
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((r) =>
      r.some((cell) => cell.toLowerCase().includes(term)),
    )
  }, [q, rows])
  return (
    <div className="space-y-3">
      {searchable && (
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter commands or keys..."
            className="h-9 pl-8 text-sm"
          />
        </div>
      )}
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {headers.map((h) => (
                <TableHead
                  key={h}
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={headers.length}
                  className="h-20 text-center text-sm text-muted-foreground"
                >
                  No matching entries.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static docs rows; stateless cells; filter removes rows but never reorders
                <TableRow key={i}>
                  {row.map((cell, ci) => (
                    // biome-ignore-start lint/suspicious/noArrayIndexKey: column index fixed per table; cells stateless
                    <TableCell
                      key={ci}
                      className={
                        ci === 0
                          ? "font-mono text-xs"
                          : "text-sm text-muted-foreground"
                      }
                    >
                      {ci === 0 ? (
                        <Badge
                          variant="secondary"
                          className="font-mono text-[11px] font-medium"
                        >
                          {cell}
                        </Badge>
                      ) : (
                        cell
                      )}
                    </TableCell>
                    // biome-ignore-end lint/suspicious/noArrayIndexKey: column index fixed per table; cells stateless
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
function BlockRenderer({ blocks }: { blocks: DocBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "p":
            return (
              // biome-ignore-start lint/suspicious/noArrayIndexKey: static docs config blocks; order never changes at runtime
              <p
                key={idx}
                className="text-sm leading-7 text-foreground/90 sm:text-base"
              >
                {block.text}
              </p>
              // biome-ignore-end lint/suspicious/noArrayIndexKey: static docs config blocks; order never changes at runtime
            )
          case "callout":
            // biome-ignore-start lint/suspicious/noArrayIndexKey: static docs config blocks; order never changes at runtime
            return (
              <Alert key={idx} variant={block.variant ?? "default"}>
                <Info className="h-4 w-4" />
                <AlertTitle>{block.title}</AlertTitle>
                <AlertDescription>{block.body}</AlertDescription>
              </Alert>
              // biome-ignore-end lint/suspicious/noArrayIndexKey: static docs config blocks; order never changes at runtime
            )
          case "cards":
            // biome-ignore-start lint/suspicious/noArrayIndexKey: static docs config blocks; order never changes at runtime
            return (
              <div key={idx} className="grid gap-4 lg:grid-cols-1">
                {block.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="group block focus:outline-none"
                  >
                    <Card className="h-full transition-colors group-hover:border-primary/60 group-hover:bg-muted/40">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-base group-hover:text-primary">
                            {item.title}
                          </CardTitle>
                          {item.badge && (
                            <Badge variant="outline" className="text-[11px]">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm leading-relaxed">
                          {item.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
              // biome-ignore-end lint/suspicious/noArrayIndexKey: static docs config blocks; order never changes at runtime
            )
          case "table":
            // biome-ignore-start lint/suspicious/noArrayIndexKey: static docs config blocks; order never changes at runtime
            return (
              <FilterableTable
                key={idx}
                searchable={block.searchable}
                headers={block.headers}
                rows={block.rows}
              />
              // biome-ignore-end lint/suspicious/noArrayIndexKey: static docs config blocks; order never changes at runtime
            )
          case "tabs":
            // biome-ignore-start lint/suspicious/noArrayIndexKey: static docs config blocks; order never changes at runtime
            return (
              <Tabs
                key={idx}
                defaultValue={block.items[0]?.value}
                className="w-full"
              >
                <TabsList>
                  {block.items.map((t) => (
                    <TabsTrigger key={t.value} value={t.value}>
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {block.items.map((t) => (
                  <TabsContent
                    key={t.value}
                    value={t.value}
                    className="mt-4 rounded-md border border-border bg-card p-4"
                  >
                    <BlockRenderer blocks={t.blocks} />
                  </TabsContent>
                ))}
              </Tabs>
              // biome-ignore-end lint/suspicious/noArrayIndexKey: static docs config blocks; order never changes at runtime
            )
          case "steps":
            // biome-ignore-start lint/suspicious/noArrayIndexKey: static docs config (blocks and ordered steps); order never changes at runtime
            return (
              <div
                key={idx}
                className="ml-2 space-y-5 border-l border-border pl-6"
              >
                {block.items.map((step, si) => (
                  <div key={si} className="relative space-y-1.5">
                    <span className="absolute -left-8.25 top-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background font-mono text-[10px] font-semibold text-foreground">
                      {si + 1}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {step.title}
                      </h3>
                      {step.keys?.map((k) => (
                        <kbd
                          key={k}
                          className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.detail}
                    </p>
                  </div>
                ))}
              </div>
              // biome-ignore-end lint/suspicious/noArrayIndexKey: static docs config blocks; order never changes at runtime
            )
          default:
            return null
        }
      })}
    </div>
  )
}
export function DocsView({ slug }: { slug?: string }) {
  const resolved = normalizeSlug(slug)
  const page = DOCS_PAGES[resolved]
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hasMoreBelow, setHasMoreBelow] = useState(false)
  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setHasMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 4)
  }, [])
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = 0
    checkScroll()
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    const mo = new MutationObserver(checkScroll)
    mo.observe(el, { childList: true, subtree: true })
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [checkScroll])
  return (
    <div className="mx-auto min-h-full overflow-hidden overflow-y-auto flex w-full max-w-5xl justify-center gap-10 py-8">
      <article className="min-w-0 min-h-full max-w-3xl flex-1 space-y-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink>
                <Link to="/docs">Docs</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {page.slug !== "index" && (
              <>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3.5 w-3.5" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>{page.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
        <header className="space-y-3">
          {page.badge && (
            <Badge variant="secondary" className="font-mono text-xs">
              {page.badge}
            </Badge>
          )}
          <h1 className="scroll-m-20 text-3xl font-bold tracking-tight text-foreground">
            {page.title}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            {page.description}
          </p>
        </header>
        <Separator />
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="space-y-10 scrollbar-none overflow-hidden overflow-y-auto max-h-[55vh]"
        >
          {page.sections.map((sec) => (
            <section
              key={sec.id}
              id={sec.id}
              className="scroll-mt-20 space-y-4"
            >
              <h2 className="border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
                {sec.title}
              </h2>
              <BlockRenderer blocks={sec.blocks} />
            </section>
          ))}
        </div>
        <div className="flex min-h-7 items-center justify-center">
          <AnimatePresence>
            {hasMoreBelow && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  y: 6,
                  transition: { duration: 0.18, ease: "easeIn" },
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={() =>
                  scrollRef.current?.scrollBy({ top: 180, behavior: "smooth" })
                }
                aria-label="Scroll down for more"
                className="flex items-center gap-1.5 rounded-full border border-border bg-muted/60 p-1.5 text-base text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                <motion.span
                  animate={{ y: [0, 2.5, 0] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </article>
      <aside className="hidden w-40 shrink-0 xl:block">
        <div className="sticky top-40 flex h-full flex-col justify-between">
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-foreground">
              On This Page
            </p>
            <nav className="flex flex-col space-y-1.5 border-l border-border pl-3">
              {page.sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="text-[13px] text-muted-foreground transition-colors hover:text-primary"
                >
                  {sec.title}
                </a>
              ))}
            </nav>
          </div>
          <footer className="flex items-center flex-col gap-1">
            {page.prev ? (
              <Link
                to={page.prev.href}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                {page.prev.title}
              </Link>
            ) : (
              <div />
            )}
            {page.next && (
              <Link
                to={page.next.href}
                className={buttonVariants({ variant: "default", size: "sm" })}
              >
                {page.next.title}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            )}
          </footer>
        </div>
      </aside>
    </div>
  )
}
