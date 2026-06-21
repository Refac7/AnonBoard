"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "./ThemeProvider"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="relative h-9 w-9 rounded-full"
    >
      <Sun
        className={`h-4 w-4 transition-all ${
          theme === "light" ? "rotate-0 scale-100" : "rotate-90 scale-0"
        } absolute`}
      />
      <Moon
        className={`h-4 w-4 transition-all ${
          theme === "dark" ? "rotate-0 scale-100" : "rotate-90 scale-0"
        } absolute`}
      />
      <Monitor
        className={`h-4 w-4 transition-all ${
          theme === "system" ? "rotate-0 scale-100" : "rotate-90 scale-0"
        } absolute`}
      />
      <span className="sr-only">切换主题</span>
    </Button>
  )
}
