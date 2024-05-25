'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Locale, i18n } from '@/i18n-config'
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipTrigger, } from '@/components/ui/tooltip';


export default function LocaleSwitcher({ curLocale, style, locales, domain }: { curLocale: string, style?: any, locales?: any, domain?: string }) {
  const pathName = usePathname()

  const localesArray = locales ? locales : i18n.locales

  const redirectedPathName = (locale: string) => {
    if (!pathName) return '/'
    const segments = pathName.split('/')
    segments[1] = locale
    return segments.join('/')
  }

  const changeLocale = async (locale: Locale) => {
    if (process.env.NODE_ENV === "production") {
      document.cookie =
        `NAIDA_LOCALE=${locale};domain=.${process.env.NEXT_PUBLIC_ROOT_DOMAIN};max-age=31536000; path=/`
    } else {
      document.cookie =
        `NAIDA_LOCALE=${locale};max-age=31536000; path=/`
    }
  }

  return (
    // <ul className='flex justify-end' style={style}>
    //   {localesArray.map((locale) => {
    //     return locale != curLocale
    //       ? (
    //         <li  key={locale}>
    //           <button
    //             onClick={() => changeLocale(locale)}
    //             className="uppercase inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
    //           >{locale}</button>
    //         </li>
    //       ) : (
    //         null
    //       )
    //   })}
    // </ul>
    <Tooltip>
      <TooltipTrigger asChild>
        <ul className='flex justify-end' style={style}>
          {localesArray.map((locale: Locale) => {
            return locale != curLocale
              ? (
                <li onClick={() => changeLocale(locale)} key={locale}>
                  <Link
                    href={redirectedPathName(locale)}
                    className="uppercase inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                  >{locale}</Link>
                </li>
              ) : (
                null
              )
          })}
        </ul>
      </TooltipTrigger>
      <TooltipContent>Change language</TooltipContent>
    </Tooltip >


  )
}
