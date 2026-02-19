import { useState } from "react"
import { useApiSuspenseQuery } from "@app/hooks/use-api-query"
import type{ AccountsApiResponse, BalanceHistoryApiResponse, DateRangeOption } from "@shared/types/api"
import { BALANCE_HISTORY_RANGES } from "@shared/types/api"
import ErrorBoundaryAndSuspenseWrapper from "@app/components/error-boundary-and-suspense-wrapper"
import BalanceHistoryCard from "./balance-history-card"
import BalanceHistoryCardError from "./balance-history-card-error"
import BalanceHistoryCardSkeleton from "./balance-history-card-skeleton"

const BalanceHistoryContent = () => {
  const [range, setRange] = useState<DateRangeOption>("1m")
  const { data: accounts } = useApiSuspenseQuery<AccountsApiResponse>("/api/accounts")
  const accountIds = accounts.data.map((account) => account.id) ?? []
  const [selectedAccount, setSelectedAccount] = useState<string>(accountIds[0] || "")
  
  const {data: balanceHistory} = useApiSuspenseQuery<BalanceHistoryApiResponse>(`/api/balance-history?accountId=${selectedAccount}&range=${range}`)  
  
  if (balanceHistory.data.length === 0) {
    return <div>No balance history available.</div>
  }

  return (
    <BalanceHistoryCard
      title="Balance History"
      accounts={accountIds}
      account={selectedAccount}
      points={balanceHistory.data}
      range={range}
      onRangeChange={setRange}
      onAccountChange={setSelectedAccount}
      ranges={BALANCE_HISTORY_RANGES}
    />
  )}

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
