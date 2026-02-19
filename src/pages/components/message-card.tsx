import { AlertTriangle, Mail, MessageCircle, PiggyBank } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@app/components/ui/card"
import { ScrollArea } from "@app/components/ui/scroll-area"
import { cn } from "@app/lib/utils"
import type { Message } from "@shared/types/api"

type MessageCardProps = {
  messages: Message[]
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
})

const iconMap = {
  mail: Mail,
  alert: AlertTriangle,
  conversation: MessageCircle,
  transfer: PiggyBank,
}

const MessageCard = ({ messages }: MessageCardProps) => {
  if (messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No messages available.</p>
        </CardContent>
      </Card>
    )
  }

  const orderedMessages = [...messages].sort((a, b) => b.time.localeCompare(a.time))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72 pr-4">
          <div className="space-y-4">
            {orderedMessages.map((message) => {
              const Icon =
                message.icon === "mail"
                  ? iconMap.mail
                  : message.icon === "alert"
                  ? iconMap.alert
                  : message.type === "transfer"
                  ? iconMap.transfer
                  : iconMap.conversation

              return (
                <div
                  key={message.id}
                  className="flex items-start justify-between gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start gap-3">
                    {message.avatar ? (
                      <img
                        src={message.avatar}
                        alt={message.title}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full",
                          message.type === "alert"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {message.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {message.body}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {dateFormatter.format(new Date(message.time))}
                  </span>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default MessageCard
