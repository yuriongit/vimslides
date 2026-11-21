import { Elysia } from "elysia"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export const errorHandler = new Elysia({ name: "error-handler" })
  .error({ API_ERROR: ApiError })
  .onError({ as: "global" }, ({ code, error, set }) => {
    if (code === "API_ERROR") {
      set.status = error.status
      return { message: error.message }
    }
    if (code === "VALIDATION") {
      set.status = 422
      return { message: "Invalid request body" }
    }
    if (code === "NOT_FOUND") {
      set.status = 404
      return { message: "Not found" }
    }
    console.error(error)
    set.status = 500
    return { message: "Something went wrong" }
  })
