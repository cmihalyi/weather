import { createReadOnlyRoute } from "./src/lib/api-helpers.js"

export default createReadOnlyRoute("messages.json", "read:messages")