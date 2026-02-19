import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {

"@app":       path.resolve(__dirname, "src"),
"@api":    path.resolve(__dirname, "api"),
"@shared": path.resolve(__dirname, "shared")    },
  },
})
