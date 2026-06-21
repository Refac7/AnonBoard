"use client"

import { useState, useEffect, useCallback } from "react"
import { MessageCard } from "./MessageCard"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, MessageCircle } from "lucide-react"

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground/50">加载中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="h-12 w-12 mx-auto rounded-xl bg-destructive/10 flex items-center justify-center">
          <MessageCircle className="h-6 w-6 text-destructive/50" />
        </div>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchMessages} className="rounded-lg">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          重试
        </Button>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-muted flex items-center justify-center">
          <MessageCircle className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">暂无留言</p>
          <p className="text-xs text-muted-foreground/40">在右侧发表第一条留言</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <MessageCard
          key={message.id}
          message={message}
          replies={replies[message.id] || []}
          onReply={handleReply}
          onDelete={isAdmin ? handleDelete : undefined}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  )
}
