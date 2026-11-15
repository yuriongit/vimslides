import { RouterProvider } from "@tanstack/react-router"
import ReactDOM from "react-dom/client"
import { ThemeProvider } from "./components/theme-provider"
import { getRouter } from "./router"

const router = getRouter()

// biome-ignore lint: --
const rootElement = document.getElementById("app")!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
    </ThemeProvider>,
  )
}
