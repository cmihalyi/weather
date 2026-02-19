import Accounts from "@app/components/accounts"
import Messages from "@app/pages/components/messages"
import BalanceHistory from "@app/pages/components/balance-history"

const Dashboard = () => {

  return (
    <>
      <h1 className="scroll-m-20 text-4xl font-semibold tracking-tight text-balance">
        Accounts Dashboard
      </h1>
      <Accounts />
      <BalanceHistory />
      <Messages />
    </>
  )
}

export default Dashboard
