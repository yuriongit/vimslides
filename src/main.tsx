import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { RouterProvider } from "@tanstack/react-router"
import ReactDOM from "react-dom/client"
import { ThemeProvider } from "./components/theme-provider"
import { getRouter } from "./router"

const router = getRouter()
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000 * 60, // 5 minute
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})

// biome-ignore lint: --
const rootElement = document.getElementById("app")!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} position="left" />
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  )
}
