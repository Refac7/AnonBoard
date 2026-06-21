import { NextRequest, NextResponse } from "next/server"
import { getMessages, getAllMessages, createMessage, checkRateLimit } from "@/lib/notion"

// Simple spam filter
function isSpam(content: string): boolean {
  const spamPatterns = [
    /\b(buy|sell|cheap|discount|free money|click here|act now)\b/i,
    /https?:\/\/[^\s]+\.(ru|cn|tk|ml|ga|cf)\b/i,
    /(.)\1{10,}/,
    /[A-Z]{20,}/,
  ]
  return spamPatterns.some((pattern) => pattern.test(content))
}

// Hash IP for rate limiting (don't store actual IP)
function hashIp(ip: string): number {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get("parentId")
    const all = searchParams.get("all")
    const cursor = searchParams.get("cursor") || undefined
    const cache = request.headers.get("x-vercel-cache")

    if (all === "true") {
      const result = await getAllMessages(cursor)
      const response = NextResponse.json({
        messages: result.messages,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      })
      response.headers.set("Cache-Control", "public, s-maxage=600, stale-while-revalidate=300")
      response.headers.set("x-cache", cache || "MISS")
      return response
    }

    const messages = await getMessages(parentId || undefined)
    const response = NextResponse.json(messages)
    response.headers.set("Cache-Control", "public, s-maxage=600, stale-while-revalidate=300")
    response.headers.set("x-cache", cache || "MISS")
    return response
  } catch {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, parentId, honeypot } = body

    // Honeypot check (anti-bot)
    if (honeypot) {
      return NextResponse.json({ error: "Spam detected" }, { status: 400 })
    }

    // Content validation
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: "Content too long (max 5000 chars)" }, { status: 400 })
    }

    // Spam check
    if (isSpam(content)) {
      return NextResponse.json({ error: "Message flagged as spam" }, { status: 400 })
    }

    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const ipHash = hashIp(ip)

    const canPost = await checkRateLimit(ipHash)
    if (!canPost) {
      return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 })
    }

    const message = await createMessage(content, ipHash, parentId)

    const response = NextResponse.json(message, { status: 201 })
    response.headers.set("Cache-Control", "no-store")

    return response
  } catch {
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}
