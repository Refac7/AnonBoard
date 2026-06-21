"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "./ThemeProvider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  return (
    <button
      onClick={cycleTheme}
      className="group relative h-9 w-9 rounded-full flex items-center justify-center
                 text-muted-foreground/40 hover:text-foreground/70
                 hover:bg-muted/50 transition-all duration-200"
      aria-label="切换主题"
    >
      <Sun
        className={`h-4 w-4 transition-all duration-300 ${
          theme === "light"
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-0 opacity-0"
        } absolute`}
      />
      <Moon
        className={`h-4 w-4 transition-all duration-300 ${
          theme === "dark"
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-0 opacity-0"
        } absolute`}
      />
      <Monitor
        className={`h-4 w-4 transition-all duration-300 ${
          theme === "system"
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-0 opacity-0"
        } absolute`}
      />
    </button>
  )
}
