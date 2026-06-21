"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ArrowUp, RefreshCw, Eye, Pencil } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface MessageFormProps {
  onSubmit: (content: string, honeypot: string) => Promise<void>
}

export function MessageForm({ onSubmit }: MessageFormProps) {
  const [content, setContent] = useState("")
  const [honeypot, setHoneypot] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit(content.trim(), honeypot)
      setContent("")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className={`relative rounded-xl transition-all duration-300 ease-out ${
        isFocused
          ? "bg-card ring-2 ring-primary/15 shadow-sm"
          : "bg-card/60 ring-1 ring-border/30"
      }`}
    >
      {/* Honeypot — invisible anti-spam field */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute opacity-0 pointer-events-none h-0 w-0"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="p-4 md:p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              className="text-xs font-medium text-muted-foreground/50 uppercase tracking-widest"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              写下你的留言
            </label>

            {showPreview ? (
              <div className="min-h-[120px] p-4 rounded-lg bg-muted/30 border border-border/20">
                {content ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground/30 italic">
                    暂无内容可预览
                  </p>
                )}
              </div>
            ) : (
              <Textarea
                placeholder="支持 Markdown 格式…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                rows={4}
                maxLength={5000}
                className="resize-none border-0 bg-transparent focus-visible:ring-0
                           focus-visible:ring-offset-0 px-0 text-sm leading-relaxed
                           placeholder:text-muted-foreground/25
                           min-h-[100px]"
              />
            )}
          </div>

          {/* Footer bar */}
          <div className="flex items-center justify-between pt-3 border-t border-border/20">
            <div className="flex items-center gap-3">
              <span className="text-xs tabular-nums text-muted-foreground/40 min-w-[4rem]">
                {content.length}
                <span className="text-muted-foreground/20"> / 5000</span>
              </span>

              {content.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setContent("")
                    setHoneypot("")
                  }}
                  className="h-7 px-2 text-xs text-muted-foreground/35 hover:text-muted-foreground/70 rounded-md"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  清空
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="h-7 px-2 text-xs text-muted-foreground/40 hover:text-muted-foreground/70 rounded-md"
              >
                {showPreview ? (
                  <>
                    <Pencil className="h-3 w-3 mr-1" />
                    编辑
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    预览
                  </>
                )}
              </Button>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || isSubmitting}
              className="h-9 px-5 rounded-lg text-sm font-medium
                         bg-primary/90 hover:bg-primary
                         disabled:opacity-30 disabled:cursor-not-allowed
                         transition-all duration-200"
            >
              <ArrowUp className="h-3.5 w-3.5 mr-1.5" />
              {isSubmitting ? "发送中…" : "发表"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
