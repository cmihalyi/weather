import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const ExpendituresCardSkeleton = () => {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <Skeleton className="h-48 w-48 rounded-full" />
      </CardContent>
    </Card>
  )
}

export default ExpendituresCardSkeleton
