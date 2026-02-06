import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const AccountCardError = () => (
  <Card>
    <CardHeader>
      <CardTitle>Accounts</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-destructive">Unable to load accounts.</p>
    </CardContent>
  </Card>
)

export default AccountCardError
