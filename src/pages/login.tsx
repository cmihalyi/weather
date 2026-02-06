import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { signInWithEmail } from "@/lib/auth"

const LoginPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const { error: signInError } = await signInWithEmail(email, password)
    if (signInError) {
      setError(signInError.message)
      setSubmitting(false)
      return
    }

    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Sign in</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Use your demo credentials to access the dashboard.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
