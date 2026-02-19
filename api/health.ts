import type { VercelRequest, VercelResponse } from '@vercel/node';

// Original Express route:
// app.get("/api/health", (_req, res) => {
//   res.json({ status: "ok" })
// })

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({ status: "ok" });
}