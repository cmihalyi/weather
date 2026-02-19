import { useApiSuspenseQuery } from "@app/hooks/use-api-query"
import type { TransactionsPaginatedApiResponse } from "@shared/types/api"
import AccountCardSkeleton from "@app/components/account-card-skeleton"
import AccountCardError from "@app/components/account-card-error"
import ErrorBoundaryAndSuspenseWrapper from "@app/components/error-boundary-and-suspense-wrapper"
import TransactionCard from "./transaction-card"

const TransactionsContent = () => {
  const { data } = useApiSuspenseQuery<TransactionsPaginatedApiResponse>("/api/transactions")
  console.log("Transactions query result:", data) // Debug log to check the query result
  const transactions = data.data ?? []
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
