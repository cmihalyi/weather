import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

// Original Express route:
// app.get("/api/insights", (_req, res) => {
//   res.json(readJson("insights.json"))
// })

export default function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const filePath = path.join(process.cwd(), 'api/src/data/insights.json');
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    res.json(data);
  } catch (error) {
    console.error('Error reading insights.json:', error);
    res.status(500).json({ error: 'Failed to load insights data' });
  }
}