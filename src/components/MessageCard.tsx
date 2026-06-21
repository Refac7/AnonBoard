"use client"

import { useState, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { MessageSquare, Trash2, CornerDownRight } from "lucide-react"
import { ReplyForm } from "./ReplyForm"
import { cn } from "@/lib/utils"

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
  allReplies?: Record<string, Message[]>
  onReply?: (parentId: string, content: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  isAdmin?: boolean
  level?: number
}

export function MessageCard({
  message,
  replies = [],
  allReplies = {},
  onReply,
  onDelete,
  isAdmin = false,
  level = 0,
}: MessageCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── Content fold ──
  const CONTENT_FOLD_THRESHOLD = 500
  const [isContentExpanded, setIsContentExpanded] = useState(false)
  const needsContentFold = message.content.length > CONTENT_FOLD_THRESHOLD

  // ── Reply collapse ──
  const MAX_VISIBLE_REPLIES = 3
  const [showAllReplies, setShowAllReplies] = useState(false)
  const hasExcessReplies = replies.length > MAX_VISIBLE_REPLIES
  const visibleReplies = useMemo(
    () => (showAllReplies ? replies : replies.slice(0, MAX_VISIBLE_REPLIES)),
    [replies, showAllReplies]
  )

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

  // Generate a stable hue for the ID badge based on the message ID
  const idHue = (message.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 36) * 10

  return (
    <div className={level > 0 ? "ml-5 mt-3 pl-4 border-l border-border/30" : ""}>
      <div
        className="group relative rounded-lg bg-card/80 ring-1 ring-border/30
                   transition-all duration-200 ease-out
                   hover:bg-card hover:ring-border/50
                   animate-fade-in-up"
      >
        <div className="p-4 md:p-5">
          {/* Meta row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* ID badge with dynamic color */}
              <span
                className="inline-flex items-center justify-center h-5 w-5 rounded text-[9px] font-bold
                           leading-none select-none"
                style={{
                  backgroundColor: `oklch(0.65 0.08 ${idHue} / 0.12)`,
                  color: `oklch(0.45 0.08 ${idHue})`,
                }}
              >
                {message.id.slice(-2).toUpperCase()}
              </span>

              <time className="text-xs text-muted-foreground/50 tabular-nums">
                {formatDate(message.createdAt)}
              </time>

              {level > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/35">
                  <CornerDownRight className="h-2.5 w-2.5" />
                  回复
                </span>
              )}
            </div>

            {/* Actions — visible on hover */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {onReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="h-7 w-7 p-0 rounded-md text-muted-foreground/50 hover:text-foreground"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              )}
              {isAdmin && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-7 w-7 p-0 rounded-md text-muted-foreground/40 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none dark:prose-invert
                          prose-p:my-1.5 prose-p:leading-relaxed
                          prose-pre:bg-muted prose-pre:border prose-pre:border-border/40
                          prose-pre:rounded-lg prose-pre:text-xs prose-pre:shadow-none
                          prose-code:text-[0.85em]
                          prose-headings:font-serif">
            {needsContentFold ? (
              <div className="relative">
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-500 ease-out",
                    isContentExpanded ? "max-h-[10000px]" : "max-h-[180px]"
                  )}
                >
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                {!isContentExpanded && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-16
                               bg-gradient-to-t from-card/90 via-card/60 to-transparent
                               pointer-events-none rounded-b-lg"
                  />
                )}
              </div>
            ) : (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            )}
          </div>

          {/* ── Content fold toggle ── */}
          {needsContentFold && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsContentExpanded(!isContentExpanded)}
                className="h-7 px-2 text-xs text-muted-foreground/40 hover:text-muted-foreground/70 rounded-md"
              >
                {isContentExpanded ? "收起" : "展开全文"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <div className={level > 0 ? "ml-5 mt-3" : "ml-0 mt-3"}>
          <ReplyForm onSubmit={handleReply} onCancel={() => setShowReplyForm(false)} />
        </div>
      )}

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="mt-3 space-y-1">
          {visibleReplies.map((reply) => (
            <MessageCard
              key={reply.id}
              message={reply}
              replies={allReplies[reply.id] || []}
              allReplies={allReplies}
              onReply={onReply}
              onDelete={onDelete}
              isAdmin={isAdmin}
              level={level + 1}
            />
          ))}

          {/* ── Excess replies toggle ── */}
          {hasExcessReplies && (
            <div className={level > 0 ? "ml-5 mt-2" : "mt-2"}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllReplies(!showAllReplies)}
                className="h-7 px-2 text-xs text-muted-foreground/40 hover:text-muted-foreground/70 rounded-md"
              >
                {showAllReplies
                  ? "收起回复"
                  : `查看全部 ${replies.length} 条回复`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
