import { useApiSuspenseQuery } from "@app/hooks/use-api-query"
import type { TransactionsPaginatedApiResponse } from "@shared/types/api"
import ErrorBoundaryAndSuspenseWrapper from "@app/components/error-boundary-and-suspense-wrapper"
import VisualizationCard from "@app/pages/components/visualization-card"
import VisualizationCardError from "@app/pages/components/visualization-card-error"
import VisualizationCardSkeleton from "@app/pages/components/visualization-card-skeleton"

const VisualizationContent = () => {
  const account = "account1" // Replace with dynamic account selection if needed
  const range = "1m" // Replace with dynamic range selection if needed
  const { data: transactions } = useApiSuspenseQuery<TransactionsPaginatedApiResponse>(`/api/balance-history?accountId=${account}&range=${range}`)

  if (transactions.data.length < 1) {
    return <div>No transaction data available.</div>
  }

  return <VisualizationCard transactions={transactions.data} />
}

const Expenditures = () => {
  return (
    <ErrorBoundaryAndSuspenseWrapper
      fallback={<VisualizationCardSkeleton />}
      errorFallback={<VisualizationCardError />}
    >
      <VisualizationContent />
    </ErrorBoundaryAndSuspenseWrapper>
  )
}

export default Expenditures
