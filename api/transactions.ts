import type { VercelRequest, VercelResponse } from "@vercel/node"
import { withAuth, authorizeResourceOwner, type AuthenticatedUser } from "./src/lib/auth.js"
import { readJson } from "./src/lib/api-helpers.js"
import type { Transaction, TransactionRange } from "../shared/types/api.js"
import { TRANSACTION_PAGE_SIZE } from "../shared/types/api.js"

function getRangeStartDate(range: TransactionRange): Date {
  const now = new Date()
  if (range === "5d") {
    now.setDate(now.getDate() - 5)
  } else if (range === "1m") {
    now.setMonth(now.getMonth() - 1)
  }
  now.setHours(0, 0, 0, 0)
  return now
}

const handler = async (
  req: VercelRequest,
  res: VercelResponse,
  user: AuthenticatedUser
) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const accountId =
    typeof req.query.accountId === "string" ? req.query.accountId : undefined
  const range =
    typeof req.query.range === "string" ? req.query.range : undefined
  const cursor =
    typeof req.query.cursor === "string" ? req.query.cursor : undefined

  if (!accountId) {
    return res.status(400).json({ error: "accountId query parameter is required" })
  }

  if (!range || !["5d", "1m"].includes(range)) {
    return res.status(400).json({
      error: "range query parameter is required and must be one of: 5d, 1m",
    })
  }

  const { accounts } = readJson("accounts.json") as {
    accounts: Array<{ id: string; customerId: string }>
  }
  const account = accounts.find((a) => a.id === accountId)

  if (!account) {
    return res.status(404).json({ error: "Account not found" })
  }

  if (!authorizeResourceOwner(user, account.customerId)) {
    return res.status(403).json({ error: "Access denied to this account" })
  }

  const { transactions } = readJson("transactions.json") as {
    transactions: Transaction[]
  }

  const rangeStart = getRangeStartDate(range as TransactionRange)

  // Filter to this account and within range, sorted newest first
  let filtered = transactions
    .filter((t) => t.accountId === accountId && new Date(t.date) >= rangeStart)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Apply cursor — exclude anything newer than or equal to the cursor date
  // (cursor is the date of the last item from the previous page)
  if (cursor) {
    const cursorDate = new Date(cursor)
    filtered = filtered.filter((t) => new Date(t.date) < cursorDate)
  }

  const page = filtered.slice(0, TRANSACTION_PAGE_SIZE)
  const nextCursor =
    page.length === TRANSACTION_PAGE_SIZE
      ? page[page.length - 1].date
      : null

  return res.json({
    data: page,
    nextCursor,
    accountId,
    range,
  })
}

export default withAuth(handler, { permission: "read:transactions" })