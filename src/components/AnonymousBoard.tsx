"use client"

import { useState, useEffect } from "react"
import { MessageForm } from "./MessageForm"
import { MessageList } from "./MessageList"
import { ThemeToggle } from "./ThemeToggle"
import { useSearchParams } from "next/navigation"
import { Shield } from "lucide-react"

export function AnonymousBoard() {
  const searchParams = useSearchParams()
  const isAdmin = searchParams.get("admin") === process.env.NEXT_PUBLIC_ADMIN_SECRET
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState({ total: 0, today: 0 })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    fetch("/api/messages")
      .then((r) => r.json())
      .then((data) => {
        const today = new Date().toDateString()
        const todayCount = data.filter(
          (m: any) => new Date(m.createdAt).toDateString() === today
        ).length
        setStats({ total: data.length, today: todayCount })
      })
      .catch(() => {})
  }, [mounted])

  const handleSubmit = async (content: string, honeypot: string) => {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, honeypot }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to post message")
    }

    window.location.reload()
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground/50 animate-fade-in">加载中…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-10 md:py-20">

        {/* ── Masthead ── */}
        <header className="mb-12 md:mb-16">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <h1
                className="text-3xl md:text-4xl font-bold tracking-[0.15em] text-foreground"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                匿名留言板
              </h1>
              <p className="text-sm text-muted-foreground/60 leading-relaxed max-w-sm">
                每一条留言都会被认真对待。
                <br />
                不保存任何身份信息，自由表达。
              </p>
            </div>
            <ThemeToggle />
          </div>

          {/* Admin indicator */}
          {isAdmin && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span className="text-xs text-amber-600/80 dark:text-amber-400/80">
                管理员模式
              </span>
            </div>
          )}
        </header>

        {/* ── Write Area ── */}
        <section className="mb-10 animate-fade-in-up">
          <MessageForm onSubmit={handleSubmit} />
        </section>

        {/* ── Status Line ── */}
        <div className="mb-8 flex items-center gap-3 text-xs text-muted-foreground/50">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
            在线
          </span>
          <span className="text-border">·</span>
          <span>
            {stats.total === 0 ? "暂无留言" : `共 ${stats.total} 条留言`}
          </span>
          {stats.today > 0 && (
            <>
              <span className="text-border">·</span>
              <span>今日 {stats.today} 条</span>
            </>
          )}
        </div>

        {/* ── Messages ── */}
        <section className="min-h-[200px]">
          <MessageList isAdmin={isAdmin} />
        </section>

        {/* ── Footer ── */}
        <footer className="mt-20 pt-8 border-t border-border/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-muted-foreground/35">
            <p>
              不保存任何身份信息 · 数据存储于 Notion · 边缘缓存 10 分钟
            </p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Shield className="h-3 w-3" />
                匿名保护已启用
              </span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  )
}
