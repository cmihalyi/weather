import { useApiSuspenseQuery } from "@/hooks/use-api-query"
import type { TransactionsResponse } from "@/types/api"
import ErrorBoundaryAndSuspenseWrapper from "@/components/error-boundary-and-suspense-wrapper"
import ExpendituresCard from "./expenditures-card"
import ExpendituresCardError from "./expenditures-card-error"
import ExpendituresCardSkeleton from "./expenditures-card-skeleton"

const ExpendituresContent = () => {
  const result = useApiSuspenseQuery<TransactionsResponse>("/api/transactions")

  const transactions = result.data?.transactions ?? []
  if (transactions.length < 1) {
    return <div>No transaction data available.</div>
  }

  return <ExpendituresCard transactions={transactions} />
}

const Expenditures = () => {
  return (
    <ErrorBoundaryAndSuspenseWrapper
      fallback={<ExpendituresCardSkeleton />}
      errorFallback={<ExpendituresCardError />}
    >
      <ExpendituresContent />
    </ErrorBoundaryAndSuspenseWrapper>
  )
}

export default Expenditures
