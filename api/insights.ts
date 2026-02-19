import { createReadOnlyRoute } from "./src/lib/api-helpers.js"

export default createReadOnlyRoute("insights.json", "read:insights")