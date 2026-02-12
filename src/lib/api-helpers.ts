import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth, type AuthenticatedUser } from "@/lib/auth";
import fs from "node:fs"
import path from "node:path"

/**
 * Helper to read JSON files from the data directory
 */
export const readJson = (filename: string) => {
  const filePath = path.join(process.cwd(), "api/src/data", filename);
  const content = fs.readFileSync(filePath, "utf8");
  return JSON.parse(content) as Record<string, unknown>;
}

/**
 * Generic factory for creating simple read-only API routes
 * Useful for endpoints like insights, messages, etc. that just return static data
 * 
 * @example
 * // api/insights.ts
 * export default createReadOnlyRoute("insights.json", "read:insights")
 */
export const createReadOnlyRoute = (
    jsonFileName: string,
    permission: string
) => {
    const handler = async (req: VercelRequest, res: VercelResponse) => {
        if(req.method !== "GET") {
            return res.status(405).json({ error: "Method not allowed" })
        }

        const data = readJson(jsonFileName)
        return res.json(data)
    }
    
    return withAuth(handler, { permission })
}

/**
 * Factory for creating routes that filter data by user ownership
 * Useful for customer-specific data
 * 
 * @param jsonFileName - Name of the JSON file to read
 * @param permission - Required permission
 * @param filterKey - Key to filter by (e.g., 'customerId', 'userId')
 */
export const createUserFilteredRoute = (
    jsonFileName: string,
    permission: string,
    filterKey: string = "customerId"
) => {
    const handler = async (req: VercelRequest, res: VercelResponse, user: AuthenticatedUser) => {
        if(req.method !== "GET") {
            return res.status(405).json({ error: "Method not allowed" })
        }

        const data = readJson(jsonFileName)

        if(user.role === "admin"){
            return res.json(data);
        }

        const dataKey = Object.keys(data)[0]
        if(Array.isArray(data[dataKey])){
            data[dataKey] = data[dataKey].filter((item: unknown) =>{
                if(typeof item !== "object" || item === null){
                    return false;
                }
                const record = item as Record<string, unknown>
                return record[filterKey] === user.id;
            })
        }
        
    return res.json(data)
    }

    return withAuth(handler, { permission })
}

