"use client"

import { useState, useEffect, useCallback } from "react"
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
}

export function MessageList({ isAdmin = false }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [replies, setReplies] = useState<Record<string, Message[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/messages")
      if (!response.ok) throw new Error("Failed to fetch messages")

      const data = await response.json()
      setMessages(data)

      const repliesMap: Record<string, Message[]> = {}
      for (const msg of data) {
        const repliesResponse = await fetch(`/api/messages?parentId=${msg.id}`)
        if (repliesResponse.ok) {
          const repliesData = await repliesResponse.json()
          if (repliesData.length > 0) {
            repliesMap[msg.id] = repliesData
          }
        }
      }
      setReplies(repliesMap)
    } catch {
      setError("加载留言失败，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

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
    setReplies((prev) => ({
      ...prev,
      [parentId]: [...(prev[parentId] || []), newReply],
    }))
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
          onClick={fetchMessages}
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
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={message.id}
          style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
        >
          <MessageCard
            message={message}
            replies={replies[message.id] || []}
            onReply={handleReply}
            onDelete={isAdmin ? handleDelete : undefined}
            isAdmin={isAdmin}
          />
        </div>
      ))}
    </div>
  )
}
