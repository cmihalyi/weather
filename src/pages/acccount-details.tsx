import { useParams, Link } from "react-router-dom"
import { useApiSuspenseQuery, useApiInfiniteQuery } from "@app/hooks/use-api-query"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@app/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@app/components/ui/table"
import { Button } from "@app/components/ui/button"
import ErrorBoundaryAndSuspenseWrapper from "@app/components/error-boundary-and-suspense-wrapper"
import type { Account, ApiResponse, Transaction, TransactionsPaginatedApiResponse } from "@shared/types/api"
import { cn } from "@app/lib/utils"

const balanceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const amountFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

// --- Account header ---

type AccountHeaderProps = {
  accountId: string
}

const AccountHeader = ({ accountId }: AccountHeaderProps) => {
  const { data: accounts } = useApiSuspenseQuery<ApiResponse<Account[]>>("/api/accounts")
  console.log("Accounts query result:", accounts) // Debug log to check the query result
  const account = accounts.data.find((a: Account) => a.id === accountId)

  if (!account) {
    return <p className="text-sm text-destructive">Account not found.</p>
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{account.type}</h1>
        <p className="text-sm text-muted-foreground">Account ID: {account.id}</p>
      </div>
      <p className="text-3xl font-bold">{balanceFormatter.format(account.balance)}</p>
    </div>
  )
}

// --- Transaction table with infinite scroll ---

type AccountTransactionsProps = {
  accountId: string
}

const AccountTransactions = ({ accountId }: AccountTransactionsProps) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useApiInfiniteQuery<TransactionsPaginatedApiResponse>(
    "/api/transactions",
    (cursor) => {
      const params = new URLSearchParams({ accountId, range: "1m" })
      if (cursor) params.set("cursor", cursor)
      return `/api/transactions?${params.toString()}`
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    }
  )

  if (status === "pending") {
    return <p className="text-sm text-muted-foreground">Loading transactions...</p>
  }

  if (status === "error") {
    return <p className="text-sm text-destructive">Failed to load transactions.</p>
  }

  console.log("data", data.pages)
  const transactions = data.pages.flatMap((page) => page.data)
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No transactions in the past month.</p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Table containerClassName="overflow-y-auto">
        <TableHeader className="bg-background">
          <TableRow>
            <TableHead className="sticky top-0 z-10 bg-background">Date</TableHead>
            <TableHead className="sticky top-0 z-10 bg-background">Description</TableHead>
            <TableHead className="sticky top-0 z-10 bg-background">Category</TableHead>
            <TableHead className="sticky top-0 z-10 bg-background text-right">
              Amount
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((txn: Transaction) => {
            console.log("txn", txn)
            return(
            <TableRow key={txn.id}>
              <TableCell>{dateFormatter.format(new Date(txn.date))}</TableCell>
              <TableCell className="font-medium">{txn.description}</TableCell>
              <TableCell className="capitalize text-muted-foreground">
                {txn.category}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-semibold",
                  txn.type === "debit" ? "text-destructive" : "text-green-600"
                )}
              >
                {txn.type === "debit" ? "-" : "+"}
                {amountFormatter.format(txn.amount)}
              </TableCell>
            </TableRow>
            )

          })}
        </TableBody>
      </Table>

      {hasNextPage && (
        <Button
          variant="outline"
          className="self-center"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading..." : "Load more"}
        </Button>
      )}

      {!hasNextPage && transactions.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          All transactions loaded
        </p>
      )}
    </div>
  )
}

// --- Page ---

const AccountDetailsPage = () => {
  const { accountId } = useParams<{ accountId: string }>()

  if (!accountId) {
    return <p className="text-sm text-destructive">No account ID provided.</p>
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Link
        to="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        ← Back to dashboard
      </Link>

      <ErrorBoundaryAndSuspenseWrapper
        fallback={<p className="text-sm text-muted-foreground">Loading account...</p>}
        errorFallback={<p className="text-sm text-destructive">Failed to load account.</p>}
      >
        <AccountHeader accountId={accountId} />
      </ErrorBoundaryAndSuspenseWrapper>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountTransactions accountId={accountId} />
        </CardContent>
      </Card>
    </div>
  )
}

export default AccountDetailsPage