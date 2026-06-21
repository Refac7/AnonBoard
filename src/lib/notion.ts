const NOTION_API_KEY = process.env.NOTION_API_KEY!
const DATABASE_ID = process.env.NOTION_DATABASE_ID!
const NOTION_BASE = "https://api.notion.com/v1"

export interface Message {
  id: string
  content: string
  createdAt: string
  parentId: string | null
  isSpam: boolean
}

async function notionQuery(body: Record<string, any>) {
  const res = await fetch(`${NOTION_BASE}/databases/${DATABASE_ID}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Notion API error ${res.status}: ${err}`)
  }
  return res.json()
}

async function notionPatch(pageId: string, body: Record<string, any>) {
  const res = await fetch(`${NOTION_BASE}/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Notion API error ${res.status}: ${err}`)
  }
  return res.json()
}

async function notionPost(body: Record<string, any>) {
  const res = await fetch(`${NOTION_BASE}/pages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Notion API error ${res.status}: ${err}`)
  }
  return res.json()
}

function mapPage(page: any): Message {
  return {
    id: page.id,
    content: page.properties.content?.title?.[0]?.plain_text || "",
    createdAt: page.properties.createdAt?.created_time || new Date().toISOString(),
    parentId: page.properties.parentId?.rich_text?.[0]?.plain_text || null,
    isSpam: page.properties.isSpam?.select?.name === "spam",
  }
}

export async function getMessages(parentId?: string | null): Promise<Message[]> {
  const filter: any = {
    and: [{ property: "isSpam", select: { equals: "clean" } }],
  }

  if (parentId === null || parentId === undefined) {
    filter.and.push({ property: "parentId", rich_text: { is_empty: true } })
  } else {
    filter.and.push({ property: "parentId", rich_text: { equals: parentId } })
  }

  const response: any = await notionQuery({
    filter,
    page_size: 50,
  })

  return response.results.map(mapPage)
}

export async function getAllMessages(): Promise<Message[]> {
  const filter: any = {
    and: [{ property: "isSpam", select: { equals: "clean" } }],
  }

  const response: any = await notionQuery({
    filter,
    page_size: 100,
  })

  return response.results.map(mapPage)
}

export async function createMessage(content: string, ipHash: number, parentId?: string): Promise<Message> {
  const properties: any = {
    content: {
      title: [{ text: { content } }],
    },
    ipHash: {
      rich_text: [{ text: { content: String(ipHash) } }],
    },
    isSpam: {
      select: { name: "clean" },
    },
  }

  if (parentId) {
    properties.parentId = {
      rich_text: [{ text: { content: parentId } }],
    }
  }

  const response: any = await notionPost({
    parent: { database_id: DATABASE_ID },
    properties,
  })

  return {
    id: response.id,
    content,
    createdAt: response.properties.createdAt?.created_time || new Date().toISOString(),
    parentId: parentId || null,
    isSpam: false,
  }
}

export async function deleteMessage(messageId: string): Promise<boolean> {
  try {
    await notionPatch(messageId, { archived: true })
    return true
  } catch {
    return false
  }
}

export async function checkRateLimit(ipHash: number): Promise<boolean> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

  const response: any = await notionQuery({
    filter: {
      and: [
        { property: "ipHash", rich_text: { equals: String(ipHash) } },
      ],
    },
    page_size: 100,
  })

  const recentMessages = response.results.filter(
    (page: any) => page.properties.createdAt?.created_time > tenMinutesAgo
  )

  return recentMessages.length < 5
}
