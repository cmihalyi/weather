import { useEffect, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { getSession, onAuthChange } from "@app/lib/auth"

type AuthState = {
  session: Session | null
  user: User | null
  loading: boolean
}

export const useAuth = (): AuthState => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadSession = async () => {
      const { data, error } = await getSession()
      if (!mounted) return
      if (error) {
        setSession(null)
        setUser(null)
      } else {
        setSession(data.session)
        setUser(data.session?.user ?? null)
      }
      setLoading(false)
    }

    loadSession()

    const { data: subscription } = onAuthChange(async (_event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  return { session, user, loading }
}
