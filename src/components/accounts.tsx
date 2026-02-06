import { useApiSuspenseQuery } from "@/hooks/use-api-query"
import type { AccountsResponse } from "@/types/api"
import AccountCard from "@/components/account-card"
import AccountCardSkeleton from "@/components/account-card-skeleton"
import AccountCardError from "@/components/account-card-error"
import ErrorBoundaryAndSuspenseWrapper from "@/components/error-boundary-and-suspense-wrapper"

const AccountsContent = () => {
  const result = useApiSuspenseQuery<AccountsResponse>("/api/accounts")

  const accounts = result.data?.accounts ?? []
  if (accounts.length < 1) {
    return <div>No accounts available.</div>
  }

  return (
    <>
      {accounts.map((account) => (
        <AccountCard key={account.id} account={account} />
      ))}
    </>
  )
}

const Accounts = () => {
  return (
    <ErrorBoundaryAndSuspenseWrapper
      fallback={<AccountCardSkeleton />}
      errorFallback={<AccountCardError />}
    >
      <AccountsContent />
    </ErrorBoundaryAndSuspenseWrapper>
  )
}

export default Accounts
