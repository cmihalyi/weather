import Accounts from "@/components/accounts"
import Transactions from "@/pages/components/transactions"
import Messages from "@/pages/components/messages"
import BalanceHistory from "@/pages/components/balance-history"
import Expenditures from "@/pages/components/expenditures"
import { useEffect } from "react"

const Dashboard = () => {

  useEffect(() => {
    console.log("Dashboard effect")
  }, [])

  console.log("Rendering Dashboard")
  return (
    <>
      <h1 className="scroll-m-20 text-4xl font-semibold tracking-tight text-balance">
        Accounts Dashboard
      </h1>
      <Accounts />
      <BalanceHistory />
      <Expenditures />
      <Transactions />
      <Messages />
    </>
  )
}

export default Dashboard
