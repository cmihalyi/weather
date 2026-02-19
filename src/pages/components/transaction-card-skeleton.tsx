import { Card, CardContent, CardHeader } from "@app/components/ui/card"
import { Skeleton } from "@app/components/ui/skeleton"

const TransactionsCardSkeleton = () => {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-24" />
      </CardContent>
    </Card>
  )
}

export default TransactionsCardSkeleton
