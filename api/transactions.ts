import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

// Original Express route:
// app.get("/api/transactions", (req, res) => {
//   const data = readJson("transactions.json") as {
//     transactions: Array<{ accountId: string }>
//   }
//   const accountId = typeof req.query.accountId === "string" ? req.query.accountId : undefined
//   if (!accountId) {
//     res.json(data)
//     return
//   }
//   res.json({
//     transactions: data.transactions.filter((txn) => txn.accountId === accountId),
//   })
// })

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const filePath = path.join(process.cwd(), 'api/src/data/transactions.json');
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content) as {
      transactions: Array<{ accountId: string }>
    };
    
    const accountId = typeof req.query.accountId === 'string' ? req.query.accountId : undefined;
    
    if (!accountId) {
      res.json(data);
      return;
    }
    
    res.json({
      transactions: data.transactions.filter((txn) => txn.accountId === accountId),
    });
  } catch (error) {
    console.error('Error reading transactions.json:', error);
    res.status(500).json({ error: 'Failed to load transactions data' });
  }
}