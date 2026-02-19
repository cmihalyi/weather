import type { VercelRequest, VercelResponse } from "@vercel/node"
import { withAuth, authorizeResourceOwner } from "./src/lib/auth.js"
import { readJson } from "./src/lib/api-helpers.js"
import type { AuthenticatedUser } from "./src/lib/auth.js"
import type { Account, Transaction, BalanceHistoryPoint as BalancePoint, DateRangeOption } from "../shared/types/api.js"
import { BALANCE_HISTORY_RANGES } from "../shared/types/api.js"

/**
 * Generate bucket end-of-period timestamps going back from now,
 * ordered oldest to newest.
 *
 * 1m -> 30 daily points
 * 3m -> 13 weekly points
 * 6m -> 13 bi-weekly points
 * 1y -> 12 monthly points (end of each calendar month)
 */
function generateBuckets(range: DateRangeOption, now: Date): Date[] {
  const buckets: Date[] = []

  if (range === "1m") {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      d.setHours(23, 59, 59, 999)
      buckets.push(d)
    }
  } else if (range === "3m") {
    for (let i = 12; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i * 7)
      d.setHours(23, 59, 59, 999)
      buckets.push(d)
    }
  } else if (range === "6m") {
    for (let i = 12; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i * 14)
      d.setHours(23, 59, 59, 999)
      buckets.push(d)
    }
  } else if (range === "1y") {
    for (let i = 11; i >= 0; i--) {
      // End of each calendar month going back i months
      const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
      buckets.push(d)
    }
  }

  return buckets
}

/**
 * Derive balance history for a single account by reverse-walking
 * transactions from the current balance.
 *
 * Algorithm:
 *   1. Start at the current known balance
 *   2. Process bucket boundaries from newest to oldest
 *   3. For each bucket, reverse all transactions that occurred
 *      after that bucket end timestamp
 *   4. The running balance at each bucket boundary is the balance at that point in time
 */
function deriveBalanceHistory(
  account: Account,
  transactions: Transaction[],
  range: DateRangeOption,
  now: Date
): BalancePoint[] {
  const accountTxns = transactions
    .filter((t) => t.accountId === account.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const buckets = generateBuckets(range, now)

  let runningBalance = account.balance
  let txnIndex = 0
  const points: BalancePoint[] = []

  for (let i = buckets.length - 1; i >= 0; i--) {
    const bucketEnd = buckets[i]

    while (
      txnIndex < accountTxns.length &&
      new Date(accountTxns[txnIndex].date) > bucketEnd
    ) {
      const t = accountTxns[txnIndex]
      if (t.type === "credit") {
        runningBalance -= t.amount
      } else {
        runningBalance += t.amount
      }
      txnIndex++
    }

    points.unshift({
      date: bucketEnd.toISOString(),
      balance: Math.round(runningBalance * 100) / 100,
    })
  }

  return points
}

const handler = async (
  req: VercelRequest,
  res: VercelResponse,
  user: AuthenticatedUser
) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }
  console.log("Received balance history request with query:", req.query) // Debug log to check incoming query parameters
  const accountId =
    typeof req.query.accountId === "string" ? req.query.accountId : undefined
  const range =
    typeof req.query.range === "string" ? req.query.range : undefined

  if (!accountId) {
    return res.status(400).json({ error: "accountId query parameter is required" })
  }

  if (!range || !BALANCE_HISTORY_RANGES.includes(range as DateRangeOption)) {
    return res.status(400).json({
      error: `range query parameter is required and must be one of: ${BALANCE_HISTORY_RANGES.join(", ")}`,
    })
  }

  const { accounts } = readJson("accounts.json") as { accounts: Account[] }
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

  const now = new Date()
  const points = deriveBalanceHistory(account, transactions, range as DateRangeOption, now)

  return res.json({data:points})
}

export default withAuth(handler, { permission: "read:balance-history" })