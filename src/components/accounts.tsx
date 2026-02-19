import { useApiSuspenseQuery } from "@app/hooks/use-api-query"
import type { AccountsApiResponse } from "@shared/types/api"
import AccountCard from "@app/components/account-card"
import AccountCardSkeleton from "@app/components/account-card-skeleton"
import AccountCardError from "@app/components/account-card-error"
import ErrorBoundaryAndSuspenseWrapper from "@app/components/error-boundary-and-suspense-wrapper"

const AccountsContent = () => {
  const { data: accounts } = useApiSuspenseQuery<AccountsApiResponse>("/api/accounts")
 
  if (accounts.data.length < 1) {
    return <div>No accounts available.</div>
  }

  return (
    <>
      {accounts.data.map((account) => (
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
