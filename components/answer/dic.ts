import { Locale } from "@/i18n-config"

export const en = {
  translated: 'Translated message: ',
  response: 'My Response',
}

export const uk = {
  translated: 'Перекладений запит: ',
  response: 'Моя Відповідь',
}

export const dic = { uk, en }

export function getDictionary(locale: Locale) {
  return dic[`${locale}`]
}

export type Dictionary = typeof en | typeof uk 