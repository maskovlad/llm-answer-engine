import { MessageSettings } from "@/types/types";

export const defaultMessageSettings: MessageSettings = {
  messageLang: 'uk',
  searchLang: 'en',
  answerLang: 'uk',
  searchSystem: 'google',

  embeddingsModel: 'nomic-embed-text-v1',
  inferenceModel: 'mixtral-8x7b-32768',

  showSources: true,
  showImages: true,
  showVideo: true,
  showFollowup: true,
  messageOptimization: false,

  textChunkSize: 1000,
  textChunkOverlap: 400,
  similarityResults: 4,
  pagesToScan: 10,
  timeoutGetBlueLinks: 800,
}