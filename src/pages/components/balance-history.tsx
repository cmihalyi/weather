import { useApiSuspenseQuery } from "@/hooks/use-api-query"
import type { BalanceHistoryResponse } from "@/types/api"
import ErrorBoundaryAndSuspenseWrapper from "@/components/error-boundary-and-suspense-wrapper"
import BalanceHistoryCard from "./balance-history-card"
import BalanceHistoryCardError from "./balance-history-card-error"
import BalanceHistoryCardSkeleton from "./balance-history-card-skeleton"

const BalanceHistoryContent = () => {
  const result = useApiSuspenseQuery<BalanceHistoryResponse>("/api/balance-history")

  const histories = result.data?.histories ?? []
  if (histories.length === 0) {
    return <div>No balance history available.</div>
  }

  const preferred =
    histories.find((history) => history.accountId === "acc_1001" && history.range === "6m") ??
    histories[0]

  return (
    <BalanceHistoryCard
      title={`Balance History (${preferred.range})`}
      points={preferred.points}
    />
  )
}

const BalanceHistory = () => {
  return (
    <ErrorBoundaryAndSuspenseWrapper
      fallback={<BalanceHistoryCardSkeleton />}
      errorFallback={<BalanceHistoryCardError />}
    >
      <BalanceHistoryContent />
    </ErrorBoundaryAndSuspenseWrapper>
  )
}

export default BalanceHistory
