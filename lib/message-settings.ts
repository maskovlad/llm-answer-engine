import { MessageSettings } from "@/types/types";

export const defaultMessageSettings: MessageSettings = {
  messageLang: 'en',
  searchLang: 'en',
  answerLang: 'en',
  searchSystem: 'google',

  embeddingsModel: 'sentence-transformers/all-MiniLM-L6-v2',
  inferenceModel: 'mixtral-8x7b-32768',

  showSources: true,
  showImages: false,
  showVideo: false,
  showFollowup: false,
  messageOptimization: false,

  textChunkSize: 500,
  textChunkOverlap: 200,
  similarityResults: 4,
  pagesToScan: 5,
  timeoutGetBlueLinks: 1000,
}