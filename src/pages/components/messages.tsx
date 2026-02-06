import { useApiSuspenseQuery } from "@/hooks/use-api-query"
import type { MessagesResponse } from "@/types/api"
import ErrorBoundaryAndSuspenseWrapper from "@/components/error-boundary-and-suspense-wrapper"
import MessageCard from "./message-card"
import MessageCardError from "./message-card-error"
import MessageCardSkeleton from "./message-card-skeleton"

const MessagesContent = () => {
  const result = useApiSuspenseQuery<MessagesResponse>("/api/messages")

  const messages = result.data?.messages ?? []
  if (messages.length < 1) {
    return <div>No messages available.</div>
  }

  return <MessageCard messages={messages} />
}

const Messages = () => {
  return (
    <ErrorBoundaryAndSuspenseWrapper
      fallback={<MessageCardSkeleton />}
      errorFallback={<MessageCardError />}
    >
      <MessagesContent />
    </ErrorBoundaryAndSuspenseWrapper>
  )
}

export default Messages
