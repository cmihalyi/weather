import type { VercelRequest, VercelResponse } from "@vercel/node"
import { createClient } from "@supabase/supabase-js"

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

export const onAuthChange = (callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) => {
  return supabase.auth.onAuthStateChange(callback)
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""

// Support both legacy and new API key formats
// Priority: New secret key > Legacy service_role key
const supabaseServerKey = process.env.SUPABASE_SECRET_KEY || ""

if (!supabaseServerKey) {
  console.warn(
    "⚠️  No Supabase server key found. Set either SUPABASE_SECRET_KEY (recommended) or SUPABASE_SERVICE_ROLE_KEY"
  )
}

// Create a Supabase client with elevated privileges for server-side auth verification
const supabase = createClient(supabaseUrl, supabaseServerKey)

export type AuthenticatedUser = {
  id: string
  email?: string
  role?: string
}

/**
 * Authenticate a request and return the user
 * @throws Error if authentication fails
 */
export const authenticate = async (
  req: VercelRequest
): Promise<AuthenticatedUser> => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Authentication required")
  }

  const token = authHeader.substring(7)

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new Error("Invalid or expired token")
  }

  return {
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role || "user",
  }
}

/**
 * Check if user has required permission
 */
export const authorize = (
  user: AuthenticatedUser,
  permission: string
): boolean => {
  const userRole = user.role || "user"

  const permissions: Record<string, string[]> = {
    admin: [
      "read:accounts",
      "write:accounts",
      "read:transactions",
      "write:transactions",
      "read:customers",
      "write:customers",
      "read:messages",
      "read:insights",
      "read:balance-history",
    ],
    user: [
      "read:accounts",
      "read:transactions",
      "read:customers",
      "read:messages",
      "read:insights",
      "read:balance-history",
    ],
    readonly: ["read:accounts"],
  }

  const userPermissions = permissions[userRole] || []
  return userPermissions.includes(permission)
}

type HandlerReturn = Promise<void | VercelResponse> | void | VercelResponse

/**
 * Handler that always receives an authenticated user.
 * Use with withAuth(...) or withAuth(..., { requireAuth: true }) — the default.
 */
export type AuthenticatedHandler = (
  req: VercelRequest,
  res: VercelResponse,
  user: AuthenticatedUser
) => HandlerReturn

/**
 * Handler that may receive null if the user is not authenticated.
 * Use with withAuth(..., { requireAuth: false }).
 */
export type OptionalAuthHandler = (
  req: VercelRequest,
  res: VercelResponse,
  user: AuthenticatedUser | null
) => HandlerReturn

/**
 * Overload: requireAuth: true (default) — user is always AuthenticatedUser
 */
export function withAuth(
  handler: AuthenticatedHandler,
  options?: { requireAuth?: true; permission?: string }
): (req: VercelRequest, res: VercelResponse) => HandlerReturn

/**
 * Overload: requireAuth: false — user may be null
 */
export function withAuth(
  handler: OptionalAuthHandler,
  options: { requireAuth: false; permission?: string }
): (req: VercelRequest, res: VercelResponse) => HandlerReturn

export function withAuth(
  handler: AuthenticatedHandler | OptionalAuthHandler,
  options: { requireAuth?: boolean; permission?: string } = {}
) {
  const { permission, requireAuth = true } = options
  console.log("withAuth options:", options)
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      const user = await authenticate(req)

      if (permission && !authorize(user, permission)) {
        return res.status(403).json({
          error: "Insufficient permissions",
          required: permission,
        })
      }

      return await handler(req, res, user)
    } catch (authError) {
      if (!requireAuth) {
        return await (handler as OptionalAuthHandler)(req, res, null)
      }

      return res.status(401).json({
        error: authError instanceof Error ? authError.message : "Authentication failed",
      })
    }
  }
}

/**
 * Check if a user owns a resource. Admins bypass this check.
 */
export const authorizeResourceOwner = (
  user: AuthenticatedUser,
  resourceOwnerId: string
): boolean => {
  if (user.role === "admin") {
    return true
  }
  return user.id === resourceOwnerId
}