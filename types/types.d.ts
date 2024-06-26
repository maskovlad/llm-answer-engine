export interface GetLangResponse {
  label: string;
  score: number;
}

interface Message {
  id: number;
  type: string;
  content: string;
  userMessage: string;
  translatedMessage: string;
  images: Image[];
  videos: Video[];
  followUp: FollowUp | null;
  isStreaming: boolean;
  searchResults?: SearchResult[];
  conditionalFunctionCallUI?: any;
  status?: string;
  places?: Place[];
  shopping?: Shopping[];
  ticker?: string | undefined;
  settings: {
    video: boolean;
    image: boolean;
    sources: boolean;
    relevant: boolean;
  };
  log?: ServerLog[];
}

interface StreamMessage {
  searchResults?: any;
  userMessage?: string;
  translatedMessage: string;
  llmResponse?: string;
  llmResponseEnd?: boolean;
  images?: any;
  videos?: any;
  followUp?: any;
  conditionalFunctionCallUI?: any;
  status?: string;
  places?: Place[];
  shopping?: Shopping[];
  ticker?: string;
  settings: {
    video: boolean;
    image: boolean;
    sources: boolean;
    relevant: boolean;
  }
  log: ServerLog;
}

interface Image {
  link: string;
}
interface Video {
  link: string;
  imageUrl: string;
}
interface Place {
  cid: React.Key | null | undefined;
  latitude: number;
  longitude: number;
  title: string;
  address: string;
  rating: number;
  category: string;
  phoneNumber?: string;
  website?: string;
}
interface FollowUp {
  choices: {
    message: {
      content: string;
    };
  }[];
}
interface Shopping {
  type: string;
  title: string;
  source: string;
  link: string;
  price: string;
  shopping: any;
  position: number;
  delivery: string;
  imageUrl: string;
  rating: number;
  ratingCount: number;
  offers: string;
  productId: string;
}

interface QuestionLang {
  language: 'uk' | 'ru' | 'en';
}

type Percent = number

export interface ServerLog {
  title: string;
  fTitle?: string;
  time: number;
  percent: Percent;
}

export interface MessageSettings {
  messageLang: string;
  searchLang: string;
  answerLang: string;

  searchSystem: string;

  embeddingsModel: string;
  inferenceModel: string;

  showSources: boolean;
  showImages: boolean;
  showVideo: boolean;
  showFollowup: boolean;
  messageOptimization: boolean;

  textChunkSize: number;
  textChunkOverlap: number;
  similarityResults: number;
  pagesToScan: number;
  timeoutGetBlueLinks: number;
}

// 3. Define interfaces for search results and content results
interface SearchResult {
  title: string;
  link: string;
  snippet?: string;
  favicon: string;
}

interface ContentResult extends SearchResult {
  html: string;
}


