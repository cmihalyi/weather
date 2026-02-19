import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

export const signUpWithEmail = async (email: string, password: string) => {
  return supabase.auth.signUp({ email, password })
}

export const signInWithEmail = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password })
}

export const signOut = async () => {
  return supabase.auth.signOut()
}

export const getSession = async () => {
  return supabase.auth.getSession()
}

export const onAuthChange = (
  callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]
) => {
  return supabase.auth.onAuthStateChange(callback)
}