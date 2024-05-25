import type { Metadata } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from '@/components/ui/toaster';

import { AI } from './action';
import { Header } from '@/components/header';
import { Providers } from '@/components/providers';
import { Locale } from '@/i18n-config';

const meta = {
  title: 'А якщо знайду?',
  description:
    'Пошукова ШІ-система від Vovacode',
};
export const metadata: Metadata = {
  ...meta,
  title: {
    default: 'NAIDA - Пошукова ШІстема',
    template: `%s - NAIDA - Пошукова ШІстема`,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  twitter: {
    ...meta,
    card: 'summary_large_image',
    site: '@vercel',
  },
  openGraph: {
    ...meta,
    locale: 'en-US',
    type: 'website',
  },
};

export default function Layout({
  children,
  params: { lang }
}: Readonly<{
  children: React.ReactNode;
  params: { lang: Locale };
}>) {
  return (
      <body
        className={`font-sans antialiased ${GeistSans.variable} ${GeistMono.variable}`}
      >
        <Toaster />
        <AI>
          <Providers
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex flex-col min-h-screen">
              <Header lang={lang} />
              <main className="flex flex-col flex-1 bg-muted/50 dark:bg-background px-4">
                {children}
              </main>
            </div>
          </Providers>
        </AI>
        <Analytics />
      </body>
  );
}

export const runtime = 'edge';
