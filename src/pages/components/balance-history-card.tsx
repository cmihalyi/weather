import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel } from "@app/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@app/components/ui/card"
import type { BalanceHistoryPoint, DateRangeOption } from "@shared/types/api"
import { RechartsDevtools } from "@recharts/devtools"
import type React from "react"

type BalanceHistoryCardProps = {
  title: string
  range: string
  onRangeChange: React.Dispatch<React.SetStateAction<DateRangeOption>>
  onAccountChange: React.Dispatch<React.SetStateAction<string>>
  account: string
  accounts: string[]
  ranges: DateRangeOption[]
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

const BalanceHistoryCard = ({ points, title, ranges, range, onRangeChange, account, onAccountChange, accounts }: BalanceHistoryCardProps) => {
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
        <div>
          <Select value={account} onValueChange={(value) => onAccountChange(value as string)}>
            <SelectTrigger className="w-full max-w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Account</SelectLabel>
                {accounts.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={range} onValueChange={(value) => onRangeChange(value as DateRangeOption)}>
            <SelectTrigger className="w-full max-w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Range</SelectLabel>
                {ranges.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
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
