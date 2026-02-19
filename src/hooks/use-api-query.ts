import type { UseQueryOptions, UseSuspenseQueryOptions, UseInfiniteQueryOptions, InfiniteData } from "@tanstack/react-query"
import { useQueries, useQuery, useSuspenseQueries, useSuspenseQuery, useInfiniteQuery } from "@tanstack/react-query"
import { fetchJson } from "@app/lib/api"

const API_BASE_KEY = "api"

type ApiQueryOptions<T> = Omit<
  UseQueryOptions<T, Error, T, readonly [string, string]>,
  "queryKey" | "queryFn"
>

type ApiSuspenseQueryOptions<T> = Omit<
  UseSuspenseQueryOptions<T, Error, T, readonly [string, string]>,
  "queryKey" | "queryFn"
>

type ApiInfiniteQueryOptions<T> = Omit<
  UseInfiniteQueryOptions<T, Error, InfiniteData<T>, readonly [string, ...string[]], string | undefined>,
  "queryKey" | "queryFn" | "initialPageParam" | "getNextPageParam"
> & {
  getNextPageParam: (lastPage: T) => string | undefined
}

export const useApiQuery = <T>(endpoint: string, options?: ApiQueryOptions<T>) => {
  return useQuery({
    queryKey: [API_BASE_KEY, endpoint] as const,
    queryFn: () => fetchJson<T>(endpoint),
    ...options,
  })
}

export const useApiQueries = <T>(endpoints: string[], options?: ApiQueryOptions<T>) => {
  return useQueries({
    queries: endpoints.map((endpoint) => ({
      queryKey: [API_BASE_KEY, endpoint] as const,
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
    queryKey: [API_BASE_KEY, endpoint] as const,
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
      queryKey: [API_BASE_KEY, endpoint] as const,
      queryFn: () => fetchJson<T>(endpoint),
      ...options,
    })),
  })
}

export const useApiInfiniteQuery = <T>(
  endpoint: string,
  buildUrl: (pageParam: string | undefined) => string,
  options: ApiInfiniteQueryOptions<T>
) => {
  const { getNextPageParam, ...restOptions } = options
  
  return useInfiniteQuery({
    queryKey: [API_BASE_KEY, endpoint, buildUrl(undefined)] as const,
    queryFn: ({ pageParam }) => fetchJson<T>(buildUrl(pageParam as string | undefined)),
    initialPageParam: undefined as string | undefined,
    getNextPageParam,
    ...restOptions,
  })
}