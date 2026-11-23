import { defineRailway, github, preserve, project, service } from "railway/iac"

export default defineRailway((ctx) => {
  const isProd = ctx.environment === "production"

  // 1. API Service (apps/api)
  const api = service("API", {
    source: github("yuriongit/vimslides", {
      branch: "main",
    }),
    build: "bun install --frozen-lockfile && bun run build:api",
    start: "bun run start:api",
    healthcheck: "/health",
    env: {
      NODE_ENV: isProd ? "production" : "development",
      // Secrets already set in Railway dashboard are kept via preserve()
      FRONTEND_URL: preserve(),
      SUPABASE_URL: preserve(),
      SUPABASE_SECRET_KEY: preserve(),
    },
  })

  // 2. Web Frontend Service (apps/web)
  const web = service("WEB", {
    source: github("yuriongit/vimslides", {
      branch: "main",
    }),
    build: "bun install --frozen-lockfile && bun run build:web",
    start: "bun run start:web",
    env: {
      NODE_ENV: isProd ? "production" : "development",
      VITE_API_URL: preserve(),
      VITE_SUPABASE_URL: preserve(),
      VITE_SUPABASE_PUBLISHABLE_KEY: preserve(),
    },
    cdn: {
      enabled: true,
    },
  })

  return project("VimSlides", {
    resources: [api, web],
  })
})
