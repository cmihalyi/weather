import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const ExpendituresCardError = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-destructive">Unable to load spending data.</p>
      </CardContent>
    </Card>
  )
}

export default ExpendituresCardError
