import type { VercelRequest, VercelResponse } from "@vercel/node"
import { withAuth, type AuthenticatedUser} from "./src/lib/auth.js"
import { readJson } from "./src/lib/api-helpers.js"

// Your actual handler - now receives authenticated user as third parameter
const handler = async (req: VercelRequest, res: VercelResponse, user: AuthenticatedUser) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }
 
  const data = readJson("accounts.json") as { accounts: Array<{ customerId: string }> }
  
  // Filter accounts by user if not admin
  if (user.role !== "admin") {
    // In the future with a real DB, this would be:
    // const accounts = await db.accounts.findMany({ where: { userId: user.id } })
    data.accounts = data.accounts.filter(
      (account) => account.customerId === user.id
    )
  }

  return res.json({ data: data.accounts })
}

// Export with authentication/authorization wrapper
export default withAuth(handler, {
  permission: "read:accounts",
})