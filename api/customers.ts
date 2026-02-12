import { createUserFilteredRoute } from "../src/lib/api-helpers.js"

export default createUserFilteredRoute("customers.json", "read:customers", "id")