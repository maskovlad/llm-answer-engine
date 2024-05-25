import { Locale } from "@/i18n-config"

export const en = {
  startQuery: 'Request started',
  МоваЗапиту: 'Question Language: ',
  ШукаюІнформацію: 'Searching...',
  Отримуютексти: 'Get pages',
  ВбудовуванняТексту: 'Text Embeddings',
  Формуювідповідь: 'forming an answer',
  Відповідаю: 'Answer the question',
  AddingRelevant: 'Adding relevant questions',
  RelevantError: 'Relevant Get Error',
  Часзапиту: 'Query Time: '
}

export const uk = {
  startQuery: 'Поаток запиту',
  МоваЗапиту: 'Мова запиту: ',
  ШукаюІнформацію: 'Шукаю інформацію...',
  Отримуютексти: 'Отримую тексти сторінок',
  ВбудовуванняТексту: 'Вбудовування тексту',
  Формуювідповідь: 'Формую відповідь',
  Відповідаю: 'Відповідаю',
  AddingRelevant: 'Додаю пов\`язані питання',
  RelevantError: 'Помилка отримання дод. запитань',
  Часзапиту: 'Час запиту: '
}

export const dic = { uk, en }

export function getDictionary(locale: Locale) {
  return dic[`${locale}`]
}

export type Dictionary = typeof en | typeof uk 