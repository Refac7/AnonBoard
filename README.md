# 匿名留言板

基于 React + Next.js + shadcn/ui 的匿名留言板，数据存储在 Notion 数据库。

## 功能特性

- ✅ 匿名留言，不保存任何身份信息
- ✅ Markdown 支持（代码高亮、列表、链接等）
- ✅ 回复功能（支持一级嵌套）
- ✅ 边缘缓存 10 分钟
- ✅ 反垃圾信息过滤
- ✅ 发送频率限制（每 IP 每 10 分钟 5 条）
- ✅ 管理员删除功能

## 快速开始

### 1. 创建 Notion 集成

1. 访问 [Notion My Integrations](https://www.notion.so/my-integrations)
2. 点击 "New integration"
3. 填写名称，选择 workspace
4. 复制 "Internal Integration Secret"

### 2. 配置环境变量

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`：

```bash
NOTION_API_KEY=你的集成密钥
NOTION_PARENT_PAGE_ID=父页面ID  # 数据库将创建在此页面下
ADMIN_SECRET=你的管理员密钥
```

**获取父页面 ID**：
1. 在 Notion 中打开要放置数据库的页面
2. 复制 URL 中的页面 ID（32位字符串）
   - URL 格式: `https://notion.so/your-workspace/PAGE_ID?v=...`

### 3. 一键创建数据库

```bash
npm run setup:notion
```

这会自动创建数据库并更新 `.env.local`。

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 管理员模式

访问 `http://localhost:3000?admin=你的管理员密钥` 启用管理员模式，可以删除留言。

## 部署

推荐部署到 Vercel：

1. Push 到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署

## 技术栈

- **前端**: React 19 + Next.js 16
- **UI**: shadcn/ui + Tailwind CSS
- **数据库**: Notion API
- **缓存**: Edge Runtime (10 分钟)
- **语言**: TypeScript
