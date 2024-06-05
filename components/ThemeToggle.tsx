'use client'

import { useTheme } from 'next-themes'
import { SunIcon, MoonIcon } from '@radix-ui/react-icons'
import { Tooltip, TooltipContent, TooltipTrigger, } from '@/components/ui/tooltip';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={`resolvedTheme === 'light' ? 'text-gray-800' : 'text-white'`}
          onClick={() => {
            setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
          }}
        >
          {resolvedTheme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
      </TooltipTrigger>
      <TooltipContent>Toggle theme</TooltipContent>
    </Tooltip>

  )
}
