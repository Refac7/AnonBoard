import { Client } from "@notionhq/client"
import { readFileSync, writeFileSync, existsSync } from "fs"

const envPath = ".env.local"
if (!existsSync(envPath)) {
  console.error("请先创建 .env.local 文件并填入 NOTION_API_KEY")
  process.exit(1)
}

const envContent = readFileSync(envPath, "utf-8")
const apiKey = envContent.match(/NOTION_API_KEY=(.+)/)?.[1]?.trim()

if (!apiKey || apiKey === "your_notion_api_key_here") {
  console.error("请在 .env.local 中设置有效的 NOTION_API_KEY")
  process.exit(1)
}

const notion = new Client({ auth: apiKey })

async function setup() {
  console.log("正在创建 Notion 数据库...")

  // 需要一个父页面 ID 来创建数据库
  // 用户需要在 .env.local 中添加 NOTION_PARENT_PAGE_ID
  const parentPageId = envContent.match(/NOTION_PARENT_PAGE_ID=(.+)/)?.[1]?.trim()

  if (!parentPageId || parentPageId === "your_parent_page_id_here") {
    console.log("\n请先在 Notion 中找到一个页面，复制其 ID")
    console.log("页面 URL 格式: https://notion.so/your-workspace/PAGE_ID?v=...")
    console.log("然后在 .env.local 中添加: NOTION_PARENT_PAGE_ID=你的页面ID\n")
    process.exit(1)
  }

  const db = await notion.databases.create({
    parent: { page_id: parentPageId },
    title: [{ text: { content: "匿名留言板" } }],
    properties: {
      content: { rich_text: {} },
      createdAt: { date: {} },
      parentId: { relation: { database_id: "placeholder", single_property: {} } },
      ipHash: { number: { format: "number" } },
      isSpam: { checkbox: {} },
    },
  })

  console.log(`数据库创建成功! ID: ${db.id}`)

  // 更新 .env.local
  const newEnv = envContent.replace(
    /NOTION_DATABASE_ID=.*/,
    `NOTION_DATABASE_ID=${db.id}`
  )
  writeFileSync(envPath, newEnv)
  console.log("已更新 .env.local 中的 NOTION_DATABASE_ID")

  // 更新 parentId relation 指向自身
  await notion.databases.update({
    database_id: db.id,
    properties: {
      parentId: {
        relation: {
          database_id: db.id,
          single_property: {},
        },
      },
    },
  })

  console.log("已配置自引用关系 (parentId)")
  console.log("\n setup 完成! 运行 npm run dev 启动应用")
}

setup().catch((err) => {
  console.error("设置失败:", err.message)
  process.exit(1)
})
