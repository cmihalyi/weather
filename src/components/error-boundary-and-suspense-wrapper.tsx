import { Suspense, type ReactNode } from "react"
import ErrorBoundary from "@/components/error-boundary"

type QueryCardProps = {
  fallback: ReactNode
  children: ReactNode
  errorFallback?: ReactNode
}

const ErrorBoundaryAndSuspenseWrapper = ({ fallback, children, errorFallback }: QueryCardProps) => {
  return (
    <ErrorBoundary fallback={errorFallback ?? <div>Something went wrong.</div>}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  )
}

export default ErrorBoundaryAndSuspenseWrapper
