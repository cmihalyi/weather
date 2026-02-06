import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BalanceHistoryPoint } from "@/types/api"
import { RechartsDevtools } from "@recharts/devtools"

type BalanceHistoryCardProps = {
  title?: string
  points: BalanceHistoryPoint[]
}

const amountFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
})

const BalanceHistoryCard = ({ points, title = "Balance History" }: BalanceHistoryCardProps) => {
  if (points.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No balance history available.</p>
        </CardContent>
      </Card>
    )
  }

  const data = [...points].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
                <stop offset="90%" stopColor="var(--chart-2)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => dateFormatter.format(new Date(value))}
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) => amountFormatter.format(Number(value))}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={72}
            />
            <Tooltip
              formatter={(value) => amountFormatter.format(Number(value))}
              labelFormatter={(label) => dateFormatter.format(new Date(label))}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="var(--chart-2)"
              fillOpacity={1}
              fill="url(#colorBalance)"
              dot={false}
            />
            <RechartsDevtools />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default BalanceHistoryCard
