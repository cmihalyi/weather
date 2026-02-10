import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

// Original Express route:
// app.get("/api/balance-history", (req, res) => {
//   const data = readJson("balance-history.json") as {
//     histories: Array<{ accountId: string; range: string }>
//   }
//   const accountId = typeof req.query.accountId === "string" ? req.query.accountId : undefined
//   const range = typeof req.query.range === "string" ? req.query.range : undefined
//
//   if (!accountId || !range) {
//     res.json(data)
//     return
//   }
//
//   res.json({
//     histories: data.histories.filter(
//       (history) => history.accountId === accountId && history.range === range
//     ),
//   })
// })

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const filePath = path.join(process.cwd(), 'api/src/data/balance-history.json');
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content) as {
      histories: Array<{ accountId: string; range: string }>
    };
    
    const accountId = typeof req.query.accountId === 'string' ? req.query.accountId : undefined;
    const range = typeof req.query.range === 'string' ? req.query.range : undefined;
    
    if (!accountId || !range) {
      res.json(data);
      return;
    }
    
    res.json({
      histories: data.histories.filter(
        (history) => history.accountId === accountId && history.range === range
      ),
    });
  } catch (error) {
    console.error('Error reading balance-history.json:', error);
    res.status(500).json({ error: 'Failed to load balance history data' });
  }
}