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
    <div className="rounded-lg bg-card/80 ring-1 ring-border/30 p-3 animate-fade-in-up">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder="写下回复… (支持 Markdown)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          maxLength={5000}
          className="resize-none border-0 bg-transparent focus-visible:ring-0
                     focus-visible:ring-offset-0 px-0 text-xs leading-relaxed
                     placeholder:text-muted-foreground/25 min-h-[48px]"
          autoFocus
        />
        <div className="flex items-center justify-between pt-2 border-t border-border/20">
          <span className="text-[10px] tabular-nums text-muted-foreground/30">
            {content.length}
            <span className="text-muted-foreground/15"> / 5000</span>
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-7 w-7 p-0 rounded-md text-muted-foreground/35 hover:text-muted-foreground/70"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || isSubmitting}
              className="h-7 px-3.5 text-xs rounded-md font-medium
                         bg-primary/90 hover:bg-primary
                         disabled:opacity-30 disabled:cursor-not-allowed
                         transition-all duration-200"
            >
              <ArrowUp className="h-3 w-3 mr-1" />
              {isSubmitting ? "…" : "回复"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
