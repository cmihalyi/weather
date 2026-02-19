import { useApiSuspenseQuery } from "@app/hooks/use-api-query"
import type { TransactionsPaginatedApiResponse } from "@shared/types/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@app/components/ui/table"

type RecentTransactionsProps = {
  accountId: string
}

const amountFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
})

const RecentTransactions = ({ accountId }: RecentTransactionsProps) => {
  const { data: transactions } = useApiSuspenseQuery<TransactionsPaginatedApiResponse>(
    `/api/transactions?accountId=${accountId}&range=5d`
  )

  if (transactions.data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No transactions in the past 5 days.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.data.map((txn) => (
          <TableRow key={txn.id}>
            <TableCell>{dateFormatter.format(new Date(txn.date))}</TableCell>
            <TableCell className="font-medium">{txn.description}</TableCell>
            <TableCell className="capitalize text-muted-foreground">
              {txn.category}
            </TableCell>
            <TableCell className={`text-right font-semibold ${txn.type === "debit" ? "text-destructive" : "text-green-600"}`}>
              {txn.type === "debit" ? "-" : "+"}
              {amountFormatter.format(txn.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default RecentTransactions