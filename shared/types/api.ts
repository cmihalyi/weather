export type Account = {
  id: string
  customerId: string
  type: string
  nickname: string
  currency: string
  balance: number
  updatedAt: string
}

export type Transaction = {
  id: string
  accountId: string
  amount: number
  date: string
  description: string
  category: string
  type: "debit" | "credit"
}

export type BalanceHistoryPoint = {
  date: string
  balance: number
}

export type DateRangeOption = "5d" | "1m" | "3m" | "6m" | "1y"
export type TransactionRange = "5d" | "1m";

export const TRANSACTION_PAGE_SIZE = 20
export const BALANCE_HISTORY_RANGES: DateRangeOption[] = ["1m", "3m", "6m", "1y"]

export type Message = {
  id: string
  type: "notice" | "alert" | "conversation" | "transfer"
  title: string
  body: string
  time: string
  icon?: "mail" | "alert"
  avatar?: string
}

export type BalanceHistoryApiResponse = ApiResponse<BalanceHistoryPoint[]>
export type AccountsApiResponse = ApiResponse<Account[]>
export type MessagesApiResponse = ApiResponse<Message[]>
export type TransactionsPaginatedApiResponse = PaginatedApiResponse<Transaction>

export type ApiResponse<T> = {
  data: T
}

export type PaginatedApiResponse<T> = {
  data: T[]
  nextCursor: string | null
}