import { Suspense } from "react"
import { AnonymousBoard } from "@/components/AnonymousBoard"

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <AnonymousBoard />
    </Suspense>
  )
}
