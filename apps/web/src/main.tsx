import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { RouterProvider } from "@tanstack/react-router"
import ReactDOM from "react-dom/client"
import { MINUTE } from "@/constants/constants"
import { ThemeProvider } from "./components/theme-provider"
import { getRouter } from "./router"

const router = getRouter()
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // global query client configuration
      staleTime: MINUTE * 5, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      retry: 1,
    },
  },
})

// biome-ignore lint: -- boilerplate
const rootElement = document.getElementById("app")!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} position="left" />
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  )
}
