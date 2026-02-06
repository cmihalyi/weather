import express from "express"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const app = express()
const port = process.env.PORT ? Number(process.env.PORT) : 3001
const baseDir = path.dirname(fileURLToPath(import.meta.url))

const readJson = (fileName: string) => {
  const filePath = path.join(baseDir, "data", fileName)
  const content = fs.readFileSync(filePath, "utf8")
  return JSON.parse(content)
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" })
})

app.get("/api/customers", (_req, res) => {
  res.json(readJson("customers.json"))
})

app.get("/api/accounts", (_req, res) => {
  res.json(readJson("accounts.json"))
})

app.get("/api/transactions", (req, res) => {
  const data = readJson("transactions.json") as {
    transactions: Array<{ accountId: string }>
  }
  const accountId = typeof req.query.accountId === "string" ? req.query.accountId : undefined
  if (!accountId) {
    res.json(data)
    return
  }
  res.json({
    transactions: data.transactions.filter((txn) => txn.accountId === accountId),
  })
})

app.get("/api/insights", (_req, res) => {
  res.json(readJson("insights.json"))
})

app.get("/api/messages", (_req, res) => {
  res.json(readJson("messages.json"))
})

app.get("/api/balance-history", (req, res) => {
  const data = readJson("balance-history.json") as {
    histories: Array<{ accountId: string; range: string }>
  }
  const accountId = typeof req.query.accountId === "string" ? req.query.accountId : undefined
  const range = typeof req.query.range === "string" ? req.query.range : undefined

  if (!accountId || !range) {
    res.json(data)
    return
  }

  res.json({
    histories: data.histories.filter(
      (history) => history.accountId === accountId && history.range === range
    ),
  })
})

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
