import { Card, CardContent, CardHeader } from "@app/components/ui/card"
import { Skeleton } from "@app/components/ui/skeleton"

const BalanceHistoryCardSkeleton = () => {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-72 w-full" />
      </CardContent>
    </Card>
  )
}

export default BalanceHistoryCardSkeleton
