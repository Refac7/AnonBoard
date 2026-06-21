"use client"

import { useState, useEffect } from "react"
import { MessageForm } from "./MessageForm"
import { MessageList } from "./MessageList"
import { ThemeToggle } from "./ThemeToggle"
import { useSearchParams } from "next/navigation"
import { Shield, Zap, Clock, MessageSquare, TrendingUp, Activity } from "lucide-react"

export function AnonymousBoard() {
  const searchParams = useSearchParams()
  const isAdmin = searchParams.get("admin") === process.env.NEXT_PUBLIC_ADMIN_SECRET
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState({ total: 0, today: 0, replies: 0 })

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
        setStats({ total: data.length, today: todayCount, replies: 0 })
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
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 h-14 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-full flex items-center justify-between">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-background" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight">AnonBoard</span>
              <span className="text-xs text-muted-foreground/50 hidden sm:inline">/</span>
              <span className="text-xs text-muted-foreground/50 hidden sm:inline">匿名留言板</span>
            </div>
          </div>

          {/* Right: Status + Theme */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground/60">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>在线</span>
              </div>
            </div>
            <div className="h-4 w-px bg-border/50 hidden md:block" />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">总留言</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary/50" />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">今日新增</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">{stats.today}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/5 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-500/50" />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">系统状态</p>
                <p className="text-2xl font-bold mt-1 text-emerald-500">正常</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/5 flex items-center justify-center">
                <Activity className="h-5 w-5 text-emerald-500/50" />
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Left: Message Feed */}
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium">留言动态</h2>
                  <span className="text-xs text-muted-foreground/50 bg-muted px-2 py-0.5 rounded-full tabular-nums">
                    {stats.total}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-5 max-h-[calc(100vh-280px)] overflow-y-auto">
              <MessageList isAdmin={isAdmin} />
            </div>
          </div>

          {/* Right: Form + Info */}
          <div className="space-y-4">
            {/* Form Card */}
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50">
                <h2 className="text-sm font-medium">发表留言</h2>
              </div>
              <div className="p-5">
                <MessageForm onSubmit={handleSubmit} />
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-card rounded-xl border border-border/50 p-5">
              <h3 className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-4">系统信息</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground/70">
                    <Shield className="h-4 w-4" />
                    <span>匿名保护</span>
                  </div>
                  <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">已启用</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground/70">
                    <Zap className="h-4 w-4" />
                    <span>反垃圾过滤</span>
                  </div>
                  <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">已启用</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground/70">
                    <Clock className="h-4 w-4" />
                    <span>边缘缓存</span>
                  </div>
                  <span className="text-xs text-muted-foreground/60">10分钟</span>
                </div>
              </div>
            </div>

            {/* Admin Status */}
            {isAdmin && (
              <div className="bg-amber-500/5 rounded-xl border border-amber-500/20 p-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    管理员模式已启用
                  </p>
                </div>
                <p className="text-xs text-amber-600/60 dark:text-amber-400/60 mt-1 ml-4">
                  可以删除留言
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 py-4 text-center">
          <p className="text-xs text-muted-foreground/40">
            不保存任何身份信息 · 数据存储于 Notion · 边缘缓存 10 分钟
          </p>
        </footer>
      </div>
    </div>
  )
}
