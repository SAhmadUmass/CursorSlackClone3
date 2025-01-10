'use client'

import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/lib/store/theme-store'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground', className)}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <Sun
        className={cn(
          'h-4 w-4 rotate-0 scale-100 transition-all',
          isDark ? 'rotate-90 scale-0' : ''
        )}
      />
      <Moon
        className={cn(
          'absolute h-4 w-4 rotate-90 scale-0 transition-all',
          isDark ? 'rotate-0 scale-100' : ''
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
