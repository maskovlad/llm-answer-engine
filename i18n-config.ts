// import { ReactNode } from "react"

export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'uk'],
  matcher: {
    uk: "uk",
    ru: "uk",
  }
} as const

export type Locale = typeof i18n['locales'][number]
