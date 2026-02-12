import type { VercelRequest, VercelResponse } from "@vercel/node"
import { withAuth, authorizeResourceOwner } from "../src/lib/auth.js"
import { readJson } from "../src/lib/api-helpers.js"
import type { AuthenticatedUser } from "../src/lib/auth.js"

const handler = async (
  req: VercelRequest,
  res: VercelResponse,
  user: AuthenticatedUser
) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const data = readJson("transactions.json") as {
    transactions: Array<{ accountId: string }>
  }

  const accountId =
    typeof req.query.accountId === "string" ? req.query.accountId : undefined

  if (accountId) {
    const accounts = readJson("accounts.json") as {
      accounts: Array<{ id: string; customerId: string }>
    }
    const account = accounts.accounts.find((a) => a.id === accountId)

    if (!account) {
      return res.status(404).json({ error: "Account not found" })
    }

    if (!authorizeResourceOwner(user, account.customerId)) {
      return res.status(403).json({ error: "Access denied to this account" })
    }

    return res.json({
      transactions: data.transactions.filter((txn) => txn.accountId === accountId),
    })
  }

  if (user.role !== "admin") {
    const accounts = readJson("accounts.json") as {
      accounts: Array<{ id: string; customerId: string }>
    }
    const userAccountIds = accounts.accounts
      .filter((a) => a.customerId === user.id)
      .map((a) => a.id)

    data.transactions = data.transactions.filter((txn) =>
      userAccountIds.includes(txn.accountId)
    )
  }

  return res.json(data)
}

export default withAuth(handler, { permission: "read:transactions" })