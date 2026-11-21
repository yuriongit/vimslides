export function errorMessage(err: unknown, fallback = "Something went wrong") {
  const value = (err as { value?: unknown } | null)?.value
  if (
    value
    && typeof value === "object"
    && "message" in value
    && typeof value.message === "string"
  ) {
    return value.message
  }
  return fallback
}
