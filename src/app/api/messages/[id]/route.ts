import { NextRequest, NextResponse } from "next/server"
import { deleteMessage } from "@/lib/notion"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const adminSecret = request.headers.get("x-admin-secret")

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const success = await deleteMessage(id)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
    }
  } catch {
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
  }
}
