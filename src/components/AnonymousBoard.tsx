"use client"

import { useState, useEffect, useCallback } from "react"
import { MessageForm } from "./MessageForm"
import { MessageList } from "./MessageList"
import { ThemeToggle } from "./ThemeToggle"
import { useSearchParams } from "next/navigation"
import { Shield, RefreshCw } from "lucide-react"

const REFRESH_COOLDOWN_SEC = 30

export function AnonymousBoard() {
  const searchParams = useSearchParams()
  const isAdmin = searchParams.get("admin") === process.env.NEXT_PUBLIC_ADMIN_SECRET
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState({ total: 0, today: 0 })

  // Refresh trigger — increments to bypass edge cache
  const [refreshKey, setRefreshKey] = useState(0)

  // Rate-limit the manual refresh button
  const [lastRefreshTime, setLastRefreshTime] = useState(0)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  // Cooldown countdown ticker
  useEffect(() => {
    if (cooldownRemaining <= 0) return
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        const next = prev - 1
        if (next <= 0) return 0
        return next
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownRemaining])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch stats — re-run when refreshKey changes
  const fetchStats = useCallback(async (bypassCache: boolean) => {
    try {
      const url = bypassCache
        ? `/api/messages?_t=${Date.now()}`
        : "/api/messages"

      const r = await fetch(url)
      const data = await r.json()
      const today = new Date().toDateString()
      const todayCount = data.filter(
        (m: any) => new Date(m.createdAt).toDateString() === today
      ).length
      setStats({ total: data.length, today: todayCount })
    } catch {
      // stats fetch is best-effort; don't disturb the UI
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    fetchStats(refreshKey > 0)
  }, [mounted, refreshKey, fetchStats])

  // ── Manual refresh with rate limiting ──
  const handleManualRefresh = () => {
    const now = Date.now()
    const elapsed = (now - lastRefreshTime) / 1000

    if (elapsed < REFRESH_COOLDOWN_SEC) {
      const remaining = Math.ceil(REFRESH_COOLDOWN_SEC - elapsed)
      setCooldownRemaining(remaining)
      return
    }

    setLastRefreshTime(now)
    setCooldownRemaining(REFRESH_COOLDOWN_SEC)
    setRefreshKey((k) => k + 1)
  }

  // ── Auto-refresh (no rate limit) — used after posting ──
  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  // ── Submit a new top-level message ──
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

    // Immediately bypass cache to show the new message
    triggerRefresh()
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

        {/* ── Status Line + Refresh ── */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground/50">
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

          {/* Refresh cache button */}
          <button
            onClick={handleManualRefresh}
            disabled={cooldownRemaining > 0}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/35
                       hover:text-muted-foreground/70 disabled:hover:text-muted-foreground/35
                       disabled:opacity-50 transition-colors duration-200
                       rounded-md px-2 py-1 -mr-2"
            title={
              cooldownRemaining > 0
                ? `请 ${cooldownRemaining} 秒后再试`
                : "立即刷新边缘缓存"
            }
          >
            <RefreshCw
              className={`h-3 w-3 ${cooldownRemaining > 0 ? "opacity-30" : ""}`}
            />
            {cooldownRemaining > 0
              ? `${cooldownRemaining}s`
              : "刷新缓存"}
          </button>
        </div>

        {/* ── Messages ── */}
        <section className="min-h-[200px]">
          <MessageList
            isAdmin={isAdmin}
            refreshKey={refreshKey}
            onReplyPosted={triggerRefresh}
          />
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
