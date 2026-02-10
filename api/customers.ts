import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

// Original Express route:
// app.get("/api/customers", (_req, res) => {
//   res.json(readJson("customers.json"))
// })

export default function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const filePath = path.join(process.cwd(), 'api/src/data/customers.json');
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    res.json(data);
  } catch (error) {
    console.error('Error reading customers.json:', error);
    res.status(500).json({ error: 'Failed to load customers data' });
  }
}