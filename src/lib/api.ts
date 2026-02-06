
export const fetchJson = async <T>(endpoint: string): Promise<T> => {
  const delayMs = Number(import.meta.env.VITE_API_DELAY_MS || 0)
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  const response = await fetch(endpoint)

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}
