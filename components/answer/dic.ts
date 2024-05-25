import { Locale } from "@/i18n-config"

export const en = {
  translated: 'Translated message: ',
}

export const uk = {
  translated: 'Перекладений запит: ',
}

export const dic = { uk, en }

export function getDictionary(locale: Locale) {
  return dic[`${locale}`]
}

export type Dictionary = typeof en | typeof uk 