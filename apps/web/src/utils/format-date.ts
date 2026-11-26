export function formatDate(value?: string | null) {
  if (!value) return "N/A"
  const date = new Date(value)
  const currentDate = new Date()
  if (date.getFullYear() === currentDate.getFullYear()) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
