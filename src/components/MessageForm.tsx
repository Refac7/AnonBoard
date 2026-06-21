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
      className={`relative rounded-lg border transition-all duration-200 ${
        isFocused
          ? "border-primary/30 bg-background shadow-sm"
          : "border-border/40 bg-background/50"
      }`}
    >
      {/* Honeypot field */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute opacity-0 pointer-events-none h-0 w-0"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {showPreview ? (
            <div className="min-h-[120px] p-3 rounded-lg bg-muted/30 border border-border/30">
              {content ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-muted-foreground/40 text-xs italic">
                  暂无内容可预览
                </p>
              )}
            </div>
          ) : (
            <Textarea
              placeholder="写下你的留言... (支持 Markdown)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              rows={4}
              maxLength={5000}
              className="resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-sm leading-relaxed placeholder:text-muted-foreground/30"
            />
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/30">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground/40 tabular-nums">
                {content.length}
                <span className="text-muted-foreground/25">/5000</span>
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="h-6 px-2 text-xs rounded-md"
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
              {content.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setContent("")
                    setHoneypot("")
                  }}
                  className="h-6 px-2 text-xs text-muted-foreground/40 hover:text-foreground rounded-md"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || isSubmitting}
              className="h-8 px-4 rounded-lg text-sm font-medium"
            >
              <ArrowUp className="h-3.5 w-3.5 mr-1" />
              {isSubmitting ? "发送中..." : "发表"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
