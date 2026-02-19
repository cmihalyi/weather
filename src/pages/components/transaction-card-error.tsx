import { Card, CardContent, CardHeader, CardTitle } from "@app/components/ui/card"

const TransactionCardError = () => (
  <Card>
    <CardHeader>
      <CardTitle>Transactions</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-destructive">Unable to load transactions.</p>
    </CardContent>
  </Card>
)

export default TransactionCardError
