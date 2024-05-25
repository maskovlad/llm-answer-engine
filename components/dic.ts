import { Locale } from "@/i18n-config"

export const en = {
  Settings: 'Query Settings',
  queryLang: 'Question Language',
  searchLang: 'Search Language',
  answerLang: 'Answer Language',
  searchSystem: 'Search System',
  embeddingsModel: 'Embeddings Model',
  InferenceModel: 'Inference Model',
  showSources: 'Show sources',
  links: 'Links',
  images: 'Images',
  videos: 'Videos',
  relevants: 'Relevant Question',
  AdvancedOptions: 'Advanced options',
  optimization: 'Query optimization',
  chunkSize: 'Text Chunk Size',
  TextChunkOverlap: 'Text Chunk Overlap',
  NumberSimilarityResults: 'Number of Similarity Results',
  NumberPagesScan: 'Number of Pages to Scan',
  timeoutScan: 'Link Scan Timeout'
}

export const uk = {
  Settings: 'Лаштування запиту',
  queryLang: 'Мова запиту',
  searchLang: 'Мова пошуку',
  answerLang: 'Мова відповіді',
  searchSystem: 'Пошукова система',
  embeddingsModel: 'Модель вбудовування',
  InferenceModel: 'Модель висновку',
  showSources: 'Показувати джерела',
  links: 'Посилання',
  images: 'Зображення',
  videos: 'Відео',
  relevants: 'Дод.питання',
  AdvancedOptions: 'Розширені опції',
  optimization: 'Оптимізація запиту',
  chunkSize: 'Text Chunk Size',
  TextChunkOverlap: 'Text Chunk Overlap',
  NumberSimilarityResults: 'Number of Similarity Results',
  NumberPagesScan: 'Число сторінок сканування',
  timeoutScan: 'Таймаут сканування посилань(ms)'
}

export const dic = { uk, en }

export function getDictionary(locale: Locale) {
  return dic[`${locale}`]
}

export type Dictionary = typeof en | typeof uk 