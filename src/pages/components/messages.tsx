import { useApiSuspenseQuery } from "@app/hooks/use-api-query"
import type { MessagesApiResponse } from "@shared/types/api"
import ErrorBoundaryAndSuspenseWrapper from "@app/components/error-boundary-and-suspense-wrapper"
import MessageCard from "./message-card"
import MessageCardError from "./message-card-error"
import MessageCardSkeleton from "./message-card-skeleton"

const MessagesContent = () => {
  const { data: messages } = useApiSuspenseQuery<MessagesApiResponse>("/api/messages")

  if (messages.data.length < 1) {
    return <div>No messages available.</div>
  }

  return <MessageCard messages={messages.data} />
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
