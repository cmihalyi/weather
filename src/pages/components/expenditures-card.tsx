import { useState } from "react"
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Transaction } from "@/types/api"

type ExpendituresCardProps = {
  transactions: Transaction[]
  title?: string
}

type PieDatum = {
  name: string
  value: number
}

const amountFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    value,
  } = props

  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-foreground text-sm">
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="fill-muted-foreground text-xs">
        {amountFormatter.format(value)}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  )
}

const ExpendituresCard = ({ transactions, title = "Spending Breakdown" }: ExpendituresCardProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const totals = new Map<string, number>()
  transactions.forEach((transaction) => {
    if (transaction.amount >= 0) return
    const current = totals.get(transaction.category) ?? 0
    totals.set(transaction.category, current + Math.abs(transaction.amount))
  })

  const data: PieDatum[] = Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No expenditure data available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(value: number) => amountFormatter.format(value)}
              separator=": "
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default ExpendituresCard
