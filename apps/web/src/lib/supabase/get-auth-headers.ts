import { supabase } from "./client"

export async function getAuthHeaders() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    throw new Error("Not authenticated")
  }

  return { authorization: `Bearer ${session.access_token}` }
}
