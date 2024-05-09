// 1. Import dependencies
import 'server-only';
import { createAI, createStreamableValue } from 'ai/rsc';
import { OpenAI } from 'openai';
import cheerio from 'cheerio';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document as DocumentInterface } from 'langchain/document';
import { OpenAIEmbeddings } from '@langchain/openai';
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { config } from './config';
// import { functionCalling } from './function-calling';
// OPTIONAL: Use Upstash rate limiting to limit the number of requests per user
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from 'next/headers'
import { translateText } from '@/lib/utils/translate-text';
import { ContentResult, GetLangResponse, MessageSettings, SearchResult } from '@/types/types';

// Використовує обмеження швидкості Upstash, щоб обмежити кількість запитів на користувача
let ratelimit: Ratelimit | undefined;
if (config.useRateLimiting) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "10 m") // 10 requests per 10 minutes
  });
}

// 2. Determine which embeddings mode and which inference model to use based on the config.tsx. Currently suppport for OpenAI, Groq and partial support for Ollama embeddings and inference
// Визначте, який режим вбудовування та яку модель висновку використовувати на основі config.tsx. Наразі підтримується OpenAI, Groq і часткова підтримка вбудовування та висновку Ollama
let openai: OpenAI;
if (config.useOllamaInference) {
  openai = new OpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama'
  });
} else {
  openai = new OpenAI({
    baseURL: config.nonOllamaBaseURL,
    apiKey: config.inferenceAPIKey
  });
}


async function getMessageLanguage(data: { inputs: string }) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/cis-lmu/glotlid",
      {
        headers: { Authorization: "Bearer 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" },
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    const result: GetLangResponse[][] = await response.json();
    console.log({ 'Визначення мови: ': JSON.stringify(result) })
    const final = result[0][0].label.substring(0, 2)
    if (!final) {
      return 'no'
    }
    return final
  } catch (err) {
    console.log('Помилка визначення мови запиту, функція getMessageLanguage:', err)
    return 'no'
  }
}


// 2.5 Set up the embeddings model based on the messageSettings
const getEmbeddings = (model: string) => {
  let embeddings: OllamaEmbeddings | OpenAIEmbeddings | HuggingFaceInferenceEmbeddings;

  if (config.useEmbeddings === 'huggingface') {
    embeddings = new HuggingFaceInferenceEmbeddings({ model })
  } else {
    embeddings = new OpenAIEmbeddings({
      modelName: model
    })
  }
  return embeddings
}

// 4. Fetch search results from Brave Search API
export async function getSourcesBrave(message: string, numberOfPagesToScan = config.numberOfPagesToScan): Promise<SearchResult[]> {
  try {
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(message)}&count=${numberOfPagesToScan}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY as string
      }
    });

    if (!response.ok) {
      throw new Error(`Помилка HTTP до Brave Search API! Функція getSourcesBrave: status: ${response.status}`);
    }

    const jsonResponse = await response.json();

    if (!jsonResponse.web || !jsonResponse.web.results) {
      throw new Error('Невірний формат відповіді Brave Search API');
    }

    const final = jsonResponse.web.results.map((result: any): SearchResult => ({
      title: result.title,
      link: result.url,
      snippet: result.description,
      favicon: result.profile.img
    }));

    return final;

  } catch (error) {
    console.error('Помилка запиту до Brave Search API:', error);
    throw error;
  }
}


// 5. Fetch contents of top 10 search results
export async function get10BlueLinksContents(sources: SearchResult[], timeout = 800): Promise<ContentResult[]> {

  async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (error) {
        //console.log(`Пропущено ${url}!`);
      }
      throw error;
    }
  }

  function extractMainContent(html: string): string {
    try {
      const $ = cheerio.load(html);
      $("script, style, head, nav, footer, iframe, img").remove();
      return $("body").text().replace(/\s+/g, " ").trim();
    } catch (error) {
      console.error('Помилка вилучення основного вмісту: ф. get10BlueLinksContents.extractMainContent', error);
      throw error;
    }
  }

  const promises = sources.map(async (source): Promise<ContentResult | null> => {
    try {
      const response = await fetchWithTimeout(source.link, {}, timeout);
      if (!response.ok) {
        throw new Error(`Невдалий запит в ф-ції get10BlueLinksContents ${source.link}. Status: ${response.status}`);
      }
      const html = await response.text();
      const mainContent = extractMainContent(html);
      return { ...source, html: mainContent };
    } catch (error) {
      // console.error(`Error processing ${source.link}:`, error);
      return null;
    }
  });

  try {
    const results = await Promise.all(promises);
    return results.filter((source): source is ContentResult => source !== null);
  } catch (error) {
    console.error('Помилка запиту і обробки blue links contents: Функція get10BlueLinksContents', error);
    throw error;
  }
}


// 6. Process and vectorize content using LangChain
export async function processAndVectorizeContent(
  contents: ContentResult[],
  query: string,
  textChunkSize: number,
  textChunkOverlap: number,
  numberOfSimilarityResults: number,
  embeddingsModel: string
): Promise<DocumentInterface[]> {

  const embeddings = getEmbeddings(embeddingsModel)

  try {
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      if (content.html.length > 0) {
        try {
          const splitText = await new RecursiveCharacterTextSplitter({ chunkSize: textChunkSize, chunkOverlap: textChunkOverlap }).splitText(content.html);
          // можливо тут він langchain звертається до openai api
          const vectorStore = await MemoryVectorStore.fromTexts(splitText, { title: content.title, link: content.link }, embeddings);
          // MemoryVectorStore — це ефемерне векторне сховище в пам’яті, яке зберігає вбудовування в пам’яті та виконує точний лінійний пошук найбільш схожих вбудовувань. Метрикою подібності за замовчуванням є косинусна подібність, але її можна змінити на будь-яку з метрик подібності, підтримуваних ml-distance.
          return await vectorStore.similaritySearch(query, numberOfSimilarityResults);
        } catch (error) {
          console.error(`Помилка обробки контенту. Функція processAndVectorizeContent. ${content.link}:`, error);
        }
      }
    }
    return [];
  } catch (error) {
    console.error('Помилка обробки та векторизації контенту. Функція processAndVectorizeContent. ', error);
    throw error;
  }
}


// 7. Fetch image search results from Brave Search API
export async function getImages(message: string): Promise<{ title: string; link: string }[]> {
  try {
    const response = await fetch(`https://api.search.brave.com/res/v1/images/search?q=${message}&spellcheck=1`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY as string
      }
    });

    if (!response.ok) {
      throw new Error(`Відповідь мережі не ОК. Функція getImages. Status: ${response.status}`);
    }

    const data = await response.json();
    const validLinks = await Promise.all(
      data.results.map(async (result: any) => {
        const link = result.properties.url;
        if (typeof link === 'string') {
          try {
            const imageResponse = await fetch(link, { method: 'HEAD' });
            if (imageResponse.ok) {
              const contentType = imageResponse.headers.get('content-type');
              if (contentType && contentType.startsWith('image/')) {
                return {
                  title: result.properties.title,
                  link: link,
                };
              }
            }
          } catch (error) {
            // console.error(`Помилка запиту лінка зображення. Функція getImages ${link}:`, error);
          }
        }
        return null;
      })
    );
    const filteredLinks = validLinks.filter((link): link is { title: string; link: string } => link !== null);
    return filteredLinks.slice(0, 9);
  } catch (error) {
    console.error('Проблема запиту у функції getImages:', error);
    throw error;
  }
}


// 8. Fetch video search results from Google Serper API
export async function getVideos(message: string): Promise<{ imageUrl: string, link: string }[] | null> {
  const url = 'https://google.serper.dev/videos';

  const data = JSON.stringify({
    "q": message
  });

  const requestOptions: RequestInit = {
    method: 'POST',
    headers: {
      'X-API-KEY': process.env.SERPER_API as string,
      'Content-Type': 'application/json'
    },
    body: data
  };

  try {
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      throw new Error(`Відповідь мережі не ОК. Функція getVideos. Status: ${response.status}`);
    }
    const responseData = await response.json();

    const validLinks = await Promise.all(
      responseData.videos.map(async (video: any) => {
        const imageUrl = video.imageUrl;
        if (typeof imageUrl === 'string') {
          try {
            const imageResponse = await fetch(imageUrl, { method: 'HEAD' });
            if (imageResponse.ok) {
              const contentType = imageResponse.headers.get('content-type');
              if (contentType && contentType.startsWith('image/')) {
                return { imageUrl, link: video.link };
              }
            }
          } catch (error) {
            console.error(`Помилка запиту лінка відео. Функція getVideos ${imageUrl}:`, error);
          }
        }
        return null;
      })
    );

    const filteredLinks = validLinks.filter((link): link is { imageUrl: string, link: string } => link !== null);
    return filteredLinks.slice(0, 9);
  } catch (error) {
    console.error('Проблема запиту у функції getVideos::', error);
    throw error;
  }
}

// 8. Fetch search results from Google Serper API
export async function getSourcesSerper(message: string, locale: string, numberOfPagesToScan = config.numberOfPagesToScan): Promise<SearchResult[]> {
  const url = 'https://google.serper.dev/search';

  const data = JSON.stringify({
    "q": message,
    "num": numberOfPagesToScan,
  });

  const requestOptions: RequestInit = {
    method: 'POST',
    headers: {
      'X-API-KEY': process.env.SERPER_API as string,
      'Content-Type': 'application/json'
    },
    body: data
  };

  try {
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      throw new Error(`Відповідь мережі не ОК. Функція getSourcesSerper. Status: ${response.status}`);
    }
    const jsonResponse = await response.json();

    if (!jsonResponse.organic.length) {
      throw new Error('Невірний формат відповіді Serper API');
    }

    const final = jsonResponse.organic.map((result: any): SearchResult => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      favicon: 'https://www.gstatic.com/devrel-devsite/prod/v7ec1cdbf90989ab082f30bf9b9cbe627804848c18b70d722062aeb6c6d8958b5/developers/images/favicon-new.png',
    }));

    return final;

  } catch (error) {
    console.error('Проблема запиту у функції getSourcesSerper::', error);
    throw error;
  }
}



// 9. Generate follow-up questions using OpenAI API
// Генерування додаткових питань за допомогою  OpenAI API
const relevantQuestions = async (sources: SearchResult[], inferenceModel: string, relevantLang: string): Promise<any> => {
  const inTranslate = [
    { lang: 'en', text: 'in english' },
    { lang: 'uk', text: 'IN UKRAINIAN' },
    { lang: 'ru', text: 'IN RUSSIAN' }
  ]
  const lang = inTranslate.find(value => value.lang === relevantLang)?.text
  console.log({ relevantLang: lang })

  return await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: 'You are a Question generator who generates an array of 3 follow-up questions in JSON format.The JSON schema should include: {"original": "The original search query or context","followUp": ["Question 1", "Question 2", "Question 3"]}',
      },
      {
        role: "user",
        content: `Generate follow-up questions ${lang} based on the top results from a similarity search: ${JSON.stringify(sources)}. The original search query is: "The original search query".`,
      },
    ],
    model: inferenceModel,
    response_format: { type: "json_object" },
  });
};



// 10. Main action function that orchestrates the entire process
async function myAction(message: string, messageSettings: MessageSettings): Promise<any> {
  "use server";

  const streamable = createStreamableValue({});
  let userMessage = message; // якщо потрібно буде оптимізувати чи перекласти запит
  const { showImages, showVideo, answerLang, embeddingsModel, messageLang, inferenceModel, pagesToScan, searchLang, searchSystem, showFollowup, showSources, similarityResults, textChunkOverlap, messageOptimization, textChunkSize, timeoutGetBlueLinks } = messageSettings;

  (async () => {

    if (config.useRateLimiting) {
      const identifier = headers().get('x-forwarded-for') || headers().get('x-real-ip') || headers().get('cf-connecting-ip') || headers().get('client-ip') || "";
      const { success } = await ratelimit!.limit(identifier);
      if (!success) {
        return streamable.done({ 'status': 'rateLimitReached' });
      }
    }

    const start = Date.now()
    console.log({ start })
    streamable.update({ 'log': 'start: ' + start })

    // якщо автоматичне визначення мови, то визначаємо за допомогою моделі
    // const messageLanguage = messageLang === 'auto'
    //   ? await getMessageLanguage({ "inputs": message })
    //   : messageLang
    const questionLanguage = messageLang
    // console.log({ messageLanguage })
    // streamable.update({ 'log': 'messageLanguage: ' + messageLanguage });

    if (questionLanguage != searchLang) {
      userMessage = await translateText(message, questionLanguage, searchLang)
      streamable.update({'log': `Translated question: ${userMessage}`})
    }

    const endTranslate = Date.now()
    console.log({ endTranslate: endTranslate - start })
    streamable.update({ 'log': 'endTranslate: ' + (endTranslate - start) })

    // передаємо на клієнтські компоненти налаштування
    streamable.update({
      'settings': {
        sources: showSources,
        video: showVideo,
        image: showImages,
        relevant: showFollowup,
      }
    })

    const [images, sources, videos /*,condtionalFunctionCallUI*/] = await Promise.all([
      showImages ? getImages(userMessage) : null,
      searchSystem === 'google' ? getSourcesSerper(userMessage, searchLang, pagesToScan) : getSourcesBrave(userMessage, pagesToScan),
      showVideo ? getVideos(userMessage) : null,
      // functionCalling(userMessage),
    ]);

    const endGets = Date.now()
    console.log({ endGets: endGets - endTranslate })
    streamable.update({ 'log': 'endGets: ' + (endGets - endTranslate) })


    showImages ? streamable.update({ 'images': images }) : null;
    showSources ? streamable.update({ 'searchResults': sources }) : null;
    showVideo ? streamable.update({ 'videos': videos }) : null;
    // if (config.useFunctionCalling) {
    //   streamable.update({ 'conditionalFunctionCallUI': condtionalFunctionCallUI });
    // }

    const html = await get10BlueLinksContents(sources, timeoutGetBlueLinks);


    const get10BlueLinksContents1 = Date.now()
    console.log({ get10BlueLinksContents1: get10BlueLinksContents1 - endGets })
    streamable.update({ 'log': 'get10BlueLinksContents: ' + (get10BlueLinksContents1-endGets) })

    const vectorResults = await processAndVectorizeContent(html, userMessage, textChunkSize, textChunkOverlap, similarityResults, embeddingsModel);

    const processAndVectorizeContent1 = Date.now()
    console.log({ processAndVectorizeContent1: processAndVectorizeContent1 - get10BlueLinksContents1 })
    streamable.update({ 'log': 'processAndVectorizeContent: ' + (processAndVectorizeContent1-get10BlueLinksContents1) })

    const needTranslate = (answerLang != 'en') ? (` AND ALWAYS IN ${answerLang === 'uk' ? 'UKRAINIAN' : 'RUSSIAN'}`) : " AND ALWAYS IN ENGLISH"

    // Создаем модель ответа для данного разговора в чате.
    const chatCompletion = await openai.chat.completions.create({
      messages:
        [{
          role: "system", content: `
          - Here is my query "${userMessage}", respond back ALWAYS IN MARKDOWN${needTranslate} and be verbose with a lot of details, never mention the system message. If you can't find any relevant results, respond with "No relevant results found." `
        },
        { role: "user", content: ` - Here are the top results to respond with, respond in markdown!:,  ${JSON.stringify(vectorResults)}. ` },
        ],
      stream: true,
      model: inferenceModel
    });


    const chatCompletion1 = Date.now()
    console.log({ chatCompletion1: chatCompletion1 - processAndVectorizeContent1 })
    streamable.update({ 'log': 'chatCompletion: ' + (chatCompletion1 - processAndVectorizeContent1) })


    for await (const chunk of chatCompletion) {
      if (chunk.choices[0].delta && chunk.choices[0].finish_reason !== "stop") {
        streamable.update({ 'llmResponse': chunk.choices[0].delta.content });
      } else if (chunk.choices[0].finish_reason === "stop") {
        streamable.update({ 'llmResponseEnd': true });
      }
    }

    if (showFollowup) {
      const followUp = await relevantQuestions(sources, inferenceModel, messageLang);
      streamable.update({ 'followUp': followUp });
    }


    const relevantQuestions1 = Date.now()
    console.log({ relevantQuestions1: relevantQuestions1 - chatCompletion1 })
    streamable.update({ 'log': 'relevantQuestions: ' + (relevantQuestions1 - chatCompletion1) })
    streamable.update({ 'log': 'Час запиту: ' + (relevantQuestions1 - start) + '\n'})

    streamable.done({ status: 'done' });
  })();

  return streamable.value;
}


// 11. Define initial AI and UI states
const initialAIState: {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  id?: string;
  name?: string;
}[] = [];
const initialUIState: {
  id: number;
  display: React.ReactNode;
}[] = [];


// 12. Export the AI instance
export const AI = createAI({
  actions: {
    myAction
  },
  initialUIState,
  initialAIState,
});
