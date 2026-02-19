import { Card, CardContent, CardHeader, CardTitle } from "@app/components/ui/card"

const BalanceHistoryCardError = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance History</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-destructive">Unable to load balance history.</p>
      </CardContent>
    </Card>
  )
}

export default BalanceHistoryCardError
