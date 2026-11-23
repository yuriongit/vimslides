import { supabase } from "@/lib/clients/supabase/supabase.client"

export async function getAuthHeaders() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    throw new Error("Not authenticated")
  }

  return { Authorization: `Bearer ${session.access_token}` }
}
