'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ThemeProviderProps } from 'next-themes/dist/types';
import { Theme } from '@radix-ui/themes';

import { TooltipProvider } from '@/components/ui/tooltip';

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" {...props}>
      <Theme>
        <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
      </Theme>
    </NextThemesProvider>
  );
}
