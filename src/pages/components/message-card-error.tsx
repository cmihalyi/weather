import { Card, CardContent, CardHeader, CardTitle } from "@app/components/ui/card"

const MessageCardError = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-destructive">Unable to load messages.</p>
      </CardContent>
    </Card>
  )
}

export default MessageCardError
