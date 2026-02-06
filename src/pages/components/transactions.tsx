import { useApiSuspenseQuery } from "@/hooks/use-api-query"
import type { TransactionsResponse } from "@/types/api"
import AccountCardSkeleton from "@/components/account-card-skeleton"
import AccountCardError from "@/components/account-card-error"
import ErrorBoundaryAndSuspenseWrapper from "@/components/error-boundary-and-suspense-wrapper"
import TransactionCard from "./transaction-card"

const TransactionsContent = () => {
  const result = useApiSuspenseQuery<TransactionsResponse>("/api/transactions")

  const transactions = result.data?.transactions ?? []
  if (transactions.length < 1) {
    return <div>No transactions available.</div>
  }

  return (
        <TransactionCard transactions={transactions} />
  )
}


const Transactions = () => {


  return (
    <ErrorBoundaryAndSuspenseWrapper
      fallback={<AccountCardSkeleton />}
      errorFallback={<AccountCardError />}
    >
      <TransactionsContent />
    </ErrorBoundaryAndSuspenseWrapper>
  )
}

export default Transactions
