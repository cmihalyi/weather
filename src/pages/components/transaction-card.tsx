import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/types/api"

type TransactionCardProps = {
  transactions: Transaction[]
}

const amountFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  signDisplay: "always",
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
})

const TransactionCard = ({ transactions }: TransactionCardProps) => {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No transactions available.</p>
        </CardContent>
      </Card>
    )
  }

  const orderedTransactions = [...transactions].sort((a, b) =>
    b.date.localeCompare(a.date)
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table containerClassName="max-h-80 overflow-y-auto">
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
            {orderedTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {dateFormatter.format(new Date(transaction.date))}
                </TableCell>
                <TableCell className="font-medium">
                  {transaction.description}
                </TableCell>
                <TableCell className="capitalize text-muted-foreground">
                  {transaction.category}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold",
                    transaction.amount < 0 ? "text-destructive" : "text-emerald-600"
                  )}
                >
                  {amountFormatter.format(transaction.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default TransactionCard
