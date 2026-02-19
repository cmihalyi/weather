import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@app/components/ui/card"
import { Button } from "./ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"
import { Link } from "react-router-dom"
import type { Account } from "@shared/types/api"
import ErrorBoundaryAndSuspenseWrapper from "@app/components/error-boundary-and-suspense-wrapper"
import RecentTransactions from "@app/pages/components/recent-transactions"

export type AccountCardProps = {
  account: Account
}

const balanceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const AccountCard = ({ account }: AccountCardProps) => {
  const { type, balance, id } = account

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Link to={`/accounts/${id}/details`}>{type}</Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{balanceFormatter.format(balance)}</p>
        <Collapsible className="rounded-md">
          <CollapsibleTrigger asChild>
            <Button variant="link" className="mt-2 p-0">
              Recent Transactions
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <ErrorBoundaryAndSuspenseWrapper
              fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
              errorFallback={<p className="text-sm text-destructive">Failed to load transactions.</p>}
            >
              <RecentTransactions accountId={id} />
            </ErrorBoundaryAndSuspenseWrapper>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

export default AccountCard