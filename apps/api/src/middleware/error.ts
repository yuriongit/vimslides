import { Elysia, status } from "elysia"

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type HttpStatusCode = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500

export const errorHandler = new Elysia({ name: "error-handler" })
  .error({ API_ERROR: ApiError })
  .onError({ as: "global" }, ({ code, error, set }) => {
    if (code === "API_ERROR") {
      set.status = error.status
      return status(error.status as HttpStatusCode, { message: error.message })
    }
    if (code === "VALIDATION") {
      set.status = 422
      return status(422, { message: "Invalid request body (422)" })
    }
    if (code === "NOT_FOUND") {
      set.status = 404
      return status(404, { message: "Not found (404)" })
    }
    // console.error(error)
    set.status = 500
    return status(500, { message: "Something went wrong (500)" })
  })
