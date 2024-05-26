import { NextRequest, NextResponse, userAgent } from "next/server";
// import { getToken } from "next-auth/jwt";
import { i18n } from './i18n-config'
import Negotiator from 'negotiator'

export const config = {
  matcher: [
    /*
     - Match all paths except for:
     - 1. /api routes
     - 2. /_next (Next.js internals)
     - 3. /_static (inside /public)
     - 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api/|_next/|_static/|assets/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

const VERCEL_DEPLOYMENT = !!process.env.VERCEL_URL;

function getLocale(request: NextRequest): string {

  const { isBot } = userAgent(request)
  if (isBot) {
    console.log("middleware getLocale isBot")
    return i18n.defaultLocale
  }

  // якщо встановлено кукі, то повертаємо його
  const cookie = request.cookies.get('NAIDA_LOCALE')
  if (cookie) {
    console.log("middleware getLocale cookie=", cookie.value)
    return cookie.value
  }

  // Negotiator expects plain object so we need to transform headers
  // Переговорник(Negotiator) очікує простий об’єкт, тому нам потрібно трансформувати заголовки
  const negotiatorHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value))

  // Use negotiator to get all user's locales
  let languages = new Negotiator({ headers: negotiatorHeaders }).languages()

  let matchLocale: string = i18n.defaultLocale

  // підбираємо підходящу мову
  if (languages.length) {
    languages.forEach((lang: string) => {
      if (lang.startsWith("uk")) matchLocale = i18n.matcher.uk
      if (lang.startsWith("ru")) matchLocale = i18n.matcher.ru
    })
    console.log("middleware getLocale Accept-language=", matchLocale)
  }
  return matchLocale
}

export function middleware(request: NextRequest) {
  // Check if there is any supported locale in the pathname
  const { pathname } = request.nextUrl
  const pathnameHasLocale = i18n.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) return

  // Redirect if there is no locale
  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`
  // e.g. incoming request is /products
  // The new URL is now /en-US/products
  return NextResponse.redirect(request.nextUrl)
}

// export const config = {
//   matcher: [
//     // Skip all internal paths (_next)
//     '/((?!_next).*)',
//     // Optional: only run on root (/) URL
//     // '/'
//   ],
// }


// export async function middleware(req: NextRequest) {
//   const path = req.nextUrl.pathname
//   const hostname = req.headers.get("host")!

// console.log({path,hostname})

//   const pathnameIsMissingLocale = i18n.locales.every(
//     (availableLocale) => !path.startsWith(`/${availableLocale}/`) && path !== `/${availableLocale}`
//   )

//   let locale='';
//   if (pathnameIsMissingLocale) {
//     locale = getLocale(req)
//   }

//   // const newUrl = `http://${hostname}/${locale}`
//   // console.log({newUrl})

//   return NextResponse.redirect(new URL(`/${locale}`, req.url))
  
  // щоб знати рядок порівняння в [lang]/auth
  // const localeSegmentOfPath = path.split('/')[1]
  

  //* rewrites for app pages
  // if (hostname == `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) {
    // const session = await getToken({ req, secureCookie: VERCEL_DEPLOYMENT });
    // console.log({ middlewareSession: session ? session?.name : "Not session" })

    // if (!session && !(path.startsWith(`/${localeSegmentOfPath}/auth`))) {
    //   return NextResponse.redirect(new URL(`/${localeSegmentOfPath}/auth/login`, req.url));
    // } else if (session && (path.startsWith(`/${localeSegmentOfPath}/auth`))) {
    //   return NextResponse.redirect(new URL(`/${localeSegmentOfPath}`, req.url));
    // }

  //   return NextResponse.rewrite(new URL(`/app${path}`, req.url));
  // }

  //* rewrite root application to `/home` folder
  // if (hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
  //   return NextResponse.rewrite(new URL(`/home${path}`, req.url));
  // }

  //* rewrite everything else to `/[domain]/[path] dynamic route
  // return NextResponse.rewrite(new URL(`/${hostname}${path}`, req.url));

// }

// const setLocaleCookie = (locale: string) => {
//   const response = NextResponse.next()
//   // встановлюємо кукі, щоб піймати локаль у layout-ах
//   response.cookies.set("NEXT_LOCALE_TEMP", locale)
//   console.log("setLocaleCookie")
//   return response
//   // console.log({ path, localeSegmentOfPath })

// }
