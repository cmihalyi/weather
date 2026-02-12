import { supabase } from "./supabase"

export const fetchJson = async <T>(endpoint: string): Promise<T> => {
  const delayMs = Number(import.meta.env.VITE_API_DELAY_MS || 0)
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  const {
    data: {session},
  } = await supabase.auth.getSession()

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if(session?.access_token){
    headers.Authorization = `Bearer ${session.access_token}`
  }


  const response = await fetch(endpoint, { headers })
 
  console.log(response)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}
