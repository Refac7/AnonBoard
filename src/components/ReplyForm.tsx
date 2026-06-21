"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ArrowUp, X } from "lucide-react"

interface ReplyFormProps {
  onSubmit: (content: string) => Promise<void>
  onCancel: () => void
}

export function ReplyForm({ onSubmit, onCancel }: ReplyFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit(content.trim())
      setContent("")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border border-border/40 bg-background/50 p-3 animate-in slide-in-from-top-2 duration-200">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder="写下你的回复... (支持 Markdown)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          maxLength={5000}
          className="resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-xs leading-relaxed placeholder:text-muted-foreground/30"
          autoFocus
        />
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground/30 tabular-nums">
            {content.length}
            <span className="text-muted-foreground/20">/5000</span>
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-6 px-2 text-xs rounded-md"
            >
              <X className="h-3 w-3" />
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || isSubmitting}
              className="h-6 px-3 text-xs rounded-md"
            >
              <ArrowUp className="h-3 w-3 mr-1" />
              {isSubmitting ? "..." : "回复"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
