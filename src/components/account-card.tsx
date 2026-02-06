import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Account } from "@/types/api"

export type AccountCardProps = {
  account: Account
}

const AccountCard = ({ account }: AccountCardProps) => {
  const { type, balance } = account

  return (
    <Card>
  <CardHeader>
    <CardTitle>{type}</CardTitle>
  </CardHeader>
  <CardContent>
    <p>{balance}</p>
  </CardContent>
</Card>
  )
}

export default AccountCard
