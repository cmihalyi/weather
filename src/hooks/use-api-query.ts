import type { UseQueryOptions, UseSuspenseQueryOptions } from "@tanstack/react-query"
import { useQueries, useQuery, useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query"
import { fetchJson } from "@/lib/api"

type ApiQueryOptions<T> = Omit<
  UseQueryOptions<T, Error, T, readonly [string, string]>,
  "queryKey" | "queryFn"
>

type ApiSuspenseQueryOptions<T> = Omit<
  UseSuspenseQueryOptions<T, Error, T, readonly [string, string]>,
  "queryKey" | "queryFn"
>

export const useApiQuery = <T>(endpoint: string, options?: ApiQueryOptions<T>) => {
  return useQuery({
    queryKey: ["api", endpoint] as const,
    queryFn: () => fetchJson<T>(endpoint),
    ...options,
  })
}

export const useApiQueries = <T>(endpoints: string[], options?: ApiQueryOptions<T>) => {
  return useQueries({
    queries: endpoints.map((endpoint) => ({
      queryKey: ["api", endpoint] as const,
      queryFn: () => fetchJson<T>(endpoint),
      ...options,
    })),
  })
}

export const useApiSuspenseQuery = <T>(
  endpoint: string,
  options?: ApiSuspenseQueryOptions<T>
) => {
  return useSuspenseQuery({
    queryKey: ["api", endpoint] as const,
    queryFn: () => fetchJson<T>(endpoint),
    ...options,
  })
}

export const useApiSuspenseQueries = <T>(
  endpoints: string[],
  options?: ApiSuspenseQueryOptions<T>
) => {
  return useSuspenseQueries({
    queries: endpoints.map((endpoint) => ({
      queryKey: ["api", endpoint] as const,
      queryFn: () => fetchJson<T>(endpoint),
      ...options,
    })),
  })
}
