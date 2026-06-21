"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { MessageSquare, Trash2, CornerDownRight } from "lucide-react"
import { ReplyForm } from "./ReplyForm"

interface Message {
  id: string
  content: string
  createdAt: string
  parentId: string | null
  isSpam: boolean
}

interface MessageCardProps {
  message: Message
  replies?: Message[]
  onReply?: (parentId: string, content: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  isAdmin?: boolean
  level?: number
}

export function MessageCard({
  message,
  replies = [],
  onReply,
  onDelete,
  isAdmin = false,
  level = 0,
}: MessageCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(message.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReply = async (content: string) => {
    if (!onReply) return
    await onReply(message.id, content)
    setShowReplyForm(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "刚刚"
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`

    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className={`${level > 0 ? "ml-6 mt-2" : ""}`}>
      <div className="group rounded-lg border border-border/40 bg-background/50 p-4 transition-all duration-200 hover:border-border/60 hover:bg-background">
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            {level > 0 ? (
              <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center">
                <CornerDownRight className="h-3 w-3 text-muted-foreground/50" />
              </div>
            ) : (
              <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary">
                  {message.id.slice(-2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <time className="text-xs text-muted-foreground/60">
                {formatDate(message.createdAt)}
              </time>
              {level > 0 && (
                <span className="text-[10px] text-muted-foreground/40 bg-muted px-1.5 py-0.5 rounded">
                  回复
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="h-6 px-2 text-xs rounded-md"
              >
                <MessageSquare className="h-3 w-3" />
              </Button>
            )}
            {isAdmin && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-6 px-2 text-xs text-destructive hover:text-destructive rounded-md"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg prose-pre:text-xs">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <div className="ml-6 mt-2">
          <ReplyForm onSubmit={handleReply} onCancel={() => setShowReplyForm(false)} />
        </div>
      )}

      {/* Replies */}
      {replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {replies.map((reply) => (
            <MessageCard
              key={reply.id}
              message={reply}
              onReply={onReply}
              onDelete={onDelete}
              isAdmin={isAdmin}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
