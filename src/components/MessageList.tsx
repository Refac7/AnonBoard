"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { MessageCard } from "./MessageCard"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, PencilLine } from "lucide-react"

interface Message {
  id: string
  content: string
  createdAt: string
  parentId: string | null
  isSpam: boolean
}

interface MessageListProps {
  isAdmin?: boolean
  /** Increment to trigger a fresh fetch bypassing the edge cache */
  refreshKey?: number
  /** Called after a reply is successfully posted, so the parent can refresh */
  onReplyPosted?: () => void
}

export function MessageList({
  isAdmin = false,
  refreshKey = 0,
  onReplyPosted,
}: MessageListProps) {
  const DISPLAY_PAGE_SIZE = 20
  const [messages, setMessages] = useState<Message[]>([])
  const [replies, setReplies] = useState<Record<string, Message[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Pagination ──
  const [displayCount, setDisplayCount] = useState(DISPLAY_PAGE_SIZE)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Track whether this is the initial load (show loading) or a background refresh
  const isInitialLoad = useRef(true)

  const fetchMessages = useCallback(async (bypassCache: boolean, cursor?: string) => {
    // Only show full loading state on initial load (not cursor loads)
    if (isInitialLoad.current && !cursor) {
      setIsLoading(true)
    }
    if (!cursor) {
      setError(null)
    }

    try {
      let url = `/api/messages?all=true`
      if (bypassCache) url += `&_t=${Date.now()}`
      if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`

      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch messages")

      const data = await response.json()
      const pageMessages: Message[] = data.messages

      if (cursor) {
        // ── Append mode: merge with existing messages ──
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const newTopLevel = pageMessages.filter(
            (m) => !m.parentId && !existingIds.has(m.id)
          )
          return [...prev, ...newTopLevel]
        })

        setReplies((prev) => {
          const next = { ...prev }
          for (const msg of pageMessages) {
            if (msg.parentId) {
              if (!next[msg.parentId]) {
                next[msg.parentId] = []
              }
              const exists = next[msg.parentId].some((r) => r.id === msg.id)
              if (!exists) {
                next[msg.parentId].push(msg)
              }
            }
          }
          return next
        })
      } else {
        // ── Initial load: replace ──
        const topLevel = pageMessages.filter((m) => !m.parentId)
        setMessages(topLevel)
        setDisplayCount(DISPLAY_PAGE_SIZE)

        const repliesMap: Record<string, Message[]> = {}
        for (const msg of pageMessages) {
          if (msg.parentId) {
            if (!repliesMap[msg.parentId]) {
              repliesMap[msg.parentId] = []
            }
            repliesMap[msg.parentId].push(msg)
          }
        }
        setReplies(repliesMap)
      }

      setNextCursor(data.nextCursor)
      setHasMore(data.hasMore)
    } catch {
      if (!cursor) {
        setError("加载留言失败，请稍后重试")
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
      isInitialLoad.current = false
    }
  }, [])

  // Initial load & refresh on refreshKey change
  useEffect(() => {
    const bypassCache = refreshKey > 0
    fetchMessages(bypassCache)
  }, [fetchMessages, refreshKey])

  // ── Load more: client-side reveal or server fetch ──
  const handleLoadMore = useCallback(async () => {
    const totalTopLevel = messages.length

    // If we have more top-level messages already loaded, reveal them client-side
    if (displayCount < totalTopLevel) {
      setDisplayCount((prev) =>
        Math.min(prev + DISPLAY_PAGE_SIZE, totalTopLevel)
      )
      return
    }

    // Otherwise, fetch the next page from the server
    if (hasMore && nextCursor && !isLoadingMore) {
      setIsLoadingMore(true)
      try {
        await fetchMessages(false, nextCursor)
        setDisplayCount((prev) => prev + DISPLAY_PAGE_SIZE)
      } catch {
        setIsLoadingMore(false)
      }
    }
  }, [displayCount, messages.length, hasMore, nextCursor, isLoadingMore, fetchMessages])

  const handleReply = async (parentId: string, content: string) => {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentId }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to post reply")
    }

    const newReply = await response.json()

    // Optimistic update for instant feedback
    setReplies((prev) => ({
      ...prev,
      [parentId]: [...(prev[parentId] || []), newReply],
    }))

    // Notify parent so it can refresh stats & trigger cache refresh
    onReplyPosted?.()
  }

  const handleDelete = async (id: string) => {
    const adminSecret = prompt("请输入管理员密钥:")
    if (!adminSecret) return

    const response = await fetch(`/api/messages/${id}`, {
      method: "DELETE",
      headers: {
        "x-admin-secret": adminSecret,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to delete message")
    }

    setMessages((prev) => prev.filter((m) => m.id !== id))
    setReplies((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground/35">正在加载留言…</p>
      </div>
    )
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-5">
        <div className="h-12 w-12 rounded-2xl bg-destructive/5 ring-1 ring-destructive/10 flex items-center justify-center">
          <PencilLine className="h-5 w-5 text-destructive/40" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground/70">{error}</p>
          <p className="text-xs text-muted-foreground/35">请检查网络连接后重试</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchMessages(true)}
          className="rounded-lg text-xs h-8 border-border/40 text-muted-foreground/60 hover:text-foreground"
        >
          <RefreshCw className="h-3 w-3 mr-1.5" />
          重试
        </Button>
      </div>
    )
  }

  // ── Empty State ──
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-5">
        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
          <PencilLine className="h-7 w-7 text-muted-foreground/20" />
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-sm text-muted-foreground/60">还没有留言</p>
          <p className="text-xs text-muted-foreground/35">
            在上方写下第一条留言，开启对话
          </p>
        </div>
      </div>
    )
  }

  // ── Message Feed ──
  const visibleMessages = messages.slice(0, displayCount)
  const canLoadMore =
    hasMore || displayCount < messages.length

  return (
    <div className="space-y-4">
      {visibleMessages.map((message, index) => (
        <div
          key={message.id}
          style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
        >
          <MessageCard
            message={message}
            replies={replies[message.id] || []}
            allReplies={replies}
            onReply={handleReply}
            onDelete={isAdmin ? handleDelete : undefined}
            isAdmin={isAdmin}
          />
        </div>
      ))}

      {/* ── Load More ── */}
      {canLoadMore && (
        <div className="flex justify-center pt-6 pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="h-8 px-4 text-xs text-muted-foreground/40
                       hover:text-muted-foreground/70 rounded-md
                       transition-all duration-200"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                加载中…
              </>
            ) : (
              "加载更多"
            )}
          </Button>
        </div>
      )}

      {/* ── All loaded indicator ── */}
      {!canLoadMore && messages.length > DISPLAY_PAGE_SIZE && (
        <p className="text-center text-[11px] text-muted-foreground/25 pt-4 pb-2">
          已加载全部留言
        </p>
      )}
    </div>
  )
}
