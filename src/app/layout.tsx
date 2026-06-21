import type { Metadata } from "next"
import { Noto_Serif_SC } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"

const notoSerifSC = Noto_Serif_SC({
  weight: ["400", "700"],
  variable: "--font-serif",
  display: "swap",
})

export const metadata: Metadata = {
  title: "匿名留言板",
  description: "自由表达，匿名分享。不保存任何身份信息。",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={notoSerifSC.variable}>
        <ThemeProvider defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
