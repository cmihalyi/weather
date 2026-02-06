export type Account = {
  id: string
  customerId: string
  type: string
  nickname: string
  currency: string
  balance: number
  updatedAt: string
}

export type AccountsResponse = {
  accounts: Account[]
}

export type Transaction = {
  id: string
  accountId: string
  amount: number
  date: string
  description: string
  category: string
}

export type TransactionsResponse = {
  transactions: Transaction[]
}

export type BalanceHistoryPoint = {
  date: string
  balance: number
}

export type BalanceHistoryEntry = {
  accountId: string
  range: "3m" | "6m" | "1y"
  points: BalanceHistoryPoint[]
}

export type BalanceHistoryResponse = {
  histories: BalanceHistoryEntry[]
}


export type Message = {
  id: string
  type: "notice" | "alert" | "conversation" | "transfer"
  title: string
  body: string
  time: string
  icon?: "mail" | "alert"
  avatar?: string
}

export type MessagesResponse = {
  messages: Message[]
}
