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
import { NomicEmbeddings } from "@langchain/nomic"
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { config } from './config';
// import { functionCalling } from './function-calling';
// OPTIONAL: Use Upstash rate limiting to limit the number of requests per user
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from 'next/headers'
import { translateText } from '@/lib/utils/translate-text';
import { ContentResult, GetLangResponse, MessageSettings, SearchResult, ServerLog } from '@/types/types';
import { translate } from '@vitalets/google-translate-api';
import { serperSearchWithRelated } from './tools/searchProviders';
import { Locale } from "@/i18n-config";
import { getDictionary } from "./dic";


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

    // console.log({result})

    const final = result[0][0].label.substring(0, 2)
    if (!final) {
      return 'no'
    }
    return final
  } catch (err) {
    console.error('Помилка визначення мови запиту, функція getMessageLanguage:', err)
    return 'no'
  }
}


// 2.5 Set up the embeddings model based on the messageSettings
const getEmbeddings = (model: string) => {
  let embeddings: OllamaEmbeddings | OpenAIEmbeddings | HuggingFaceInferenceEmbeddings | NomicEmbeddings |
    MistralAIEmbeddings;

  if (model.startsWith('nomic')) {
    embeddings = new NomicEmbeddings({
      modelName: model
    })
  } else if (model.startsWith('text')) {
    embeddings = new OpenAIEmbeddings({
      modelName: model
    })
  } else if (model.startsWith('mistral')) {
    embeddings = new MistralAIEmbeddings({})
  } else {
    embeddings = new HuggingFaceInferenceEmbeddings({ model })
  }

  return embeddings
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
  let vectorStore: MemoryVectorStore;

  try {
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      if (content.html.length > 0) {
        try {
          let splitText = await new RecursiveCharacterTextSplitter({ chunkSize: textChunkSize, chunkOverlap: textChunkOverlap }).splitText(content.html);

          // console.log('=========splitText=======')
          // console.log(splitText.length)
          // console.log('=========splitText=======')

          // у моделі mistral є обмеження у ~16,000 tokens
          if (embeddingsModel === 'mistral') {
            splitText = splitText.slice(0, 42)
          }

          try {
            // тут посилаємо запрос на провайдера text embeddings
            vectorStore = await MemoryVectorStore.fromTexts(splitText, { title: content.title, link: content.link }, embeddings);
          } catch (err) {
            // довго вивалюється помилка від містралі, аж через п'ять запитів
            console.error('Помилка з вбудовуванням тексту: ', err)
            return []
          }
          // console.log('=========vectorStore=======')
          // console.log(vectorStore)
          // console.log('=========vectorStore=======')

          // MemoryVectorStore — це ефемерне векторне сховище в пам’яті, яке зберігає вбудовування в пам’яті та виконує точний лінійний пошук найбільш схожих вбудовувань. Метрикою подібності за замовчуванням є косинусна подібність, але її можна змінити на будь-яку з метрик подібності, підтримуваних ml-distance.
          // це вже відбувається на нашому  сервері
          return await vectorStore.similaritySearch(query, numberOfSimilarityResults);
        } catch (error) {
          console.error(`Помилка обробки контенту. Функція processAndVectorizeContent. ${content.link}:`, error);
          return []
        }
      }
    }
    return []; // у разі помилки повертаємо порожній масив
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


// 9. Generate follow-up questions using OpenAI API
// Генерування додаткових питань за допомогою  OpenAI API
const relevantQuestions = async (sources: SearchResult[], inferenceModel: string, relevantLang: string): Promise<any> => {
  const inTranslate = [
    { lang: 'en', text: 'in english' },
    { lang: 'uk', text: 'IN UKRAINIAN' },
    { lang: 'ru', text: 'IN RUSSIAN' }
  ]
  const lang = inTranslate.find(value => value.lang === relevantLang)?.text
  // console.log({ relevantLang: lang })

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

// LOG===============
const streamLog = (streamable: any, { title, fTitle, predTime, percent }: { title: string, fTitle?: string, predTime: number, percent: number }) => {
  console.log(fTitle ? fTitle : title, `: ${Date.now() - predTime}`)
  return streamable.update({ 'log': { title, fTitle, time: Date.now() - predTime, percent } })
}

// 10. Main action function that orchestrates the entire process
async function myAction(message: string, messageSettings: MessageSettings, lang: Locale): Promise<any> {
  "use server";

  const t = getDictionary(lang)
  
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

    const startTime = Date.now()
    streamLog(streamable, { title: t.startQuery, predTime: 0, percent: 10 })

    const questionLanguage = messageLang === 'auto'
      ? await getMessageLanguage({ "inputs": message })
      : messageLang
      
    streamLog(streamable, { title: ` ${t.МоваЗапиту}`, predTime: startTime, percent: 15 })

    if (questionLanguage != searchLang) {
      try {
        const translatedRaw = await translate(message, { to: searchLang })
        userMessage = translatedRaw.text ? translatedRaw.text : message
        streamable.update({ 'translatedMessage': translatedRaw.text ? translatedRaw.text : '' })
        streamLog(streamable, { title: 'Перекладено запит: ', fTitle: `Перекладений запит: ${userMessage}`, predTime: startTime, percent: 20 })
        // streamable.update({ 'info': `Перекладений запит: ${userMessage}` });
      } catch (error: any) {
        if (error.name === 'TooManyRequestsError') { // якщо виникатиме ця помилка, то треба зробити запит через проксі. Є приклад в репо
          streamLog(streamable, { title: 'Помилка перекладу: Google-translate-api: TooManyRequestsError', predTime: startTime, percent: 20 })
        } else {
          streamLog(streamable, { title: 'Помилка перекладу: ' + JSON.stringify(error), fTitle: `Error translate() ${JSON.stringify(error)}`, predTime: startTime, percent: 20 })
        }
      }
    }

    const translateMessageTime = Date.now()
    streamLog(streamable, { title: t.ШукаюІнформацію, predTime: startTime, percent: 30 })

    // передаємо на клієнтські компоненти налаштування
    streamable.update({
      'settings': {
        sources: showSources,
        video: showVideo,
        image: showImages,
        relevant: showFollowup,
      }
    })

    const [images, sourcesWithRelated, videos /*,condtionalFunctionCallUI*/] = await Promise.all([
      showImages ? getImages(userMessage) : null,
      serperSearchWithRelated(userMessage, searchLang, pagesToScan),
      showVideo ? getVideos(userMessage) : null,
      // functionCalling(userMessage),
    ]);

    const sources = sourcesWithRelated[0]
    const related = sourcesWithRelated[1] // related questions from Google Serper Api

    const endGetsTime = Date.now()
    streamLog(streamable, { title: t.Отримуютексти, fTitle: 'endGetSources', predTime: translateMessageTime, percent: 40 })


    showImages ? streamable.update({ 'images': images }) : null;
    (showSources && sources) ? streamable.update({ 'searchResults': sources }) : null;
    showVideo ? streamable.update({ 'videos': videos }) : null;
    // if (config.useFunctionCalling) {
    //   streamable.update({ 'conditionalFunctionCallUI': condtionalFunctionCallUI });
    // }

    let vectorResults;

    let get10BlueLinksTime = Date.now();

    if (sources) {
      const html = await get10BlueLinksContents(sources, timeoutGetBlueLinks);

      get10BlueLinksTime = Date.now()
      streamLog(streamable, { title: t.ВбудовуванняТексту, fTitle: `get10BlueLinksContents: модель ${embeddingsModel}`, predTime: endGetsTime, percent: 50 })

      // console.log('=======html========')
      // console.log({htmlLength: html[0].html.length})
      // console.log( html[0].html)
      // console.log('=======html========')
      // streamLog(streamable, { title: html[0].html, predTime: 0, percent: 50 } })
      // streamable.done({ status: 'done' });
      // return streamable.value;
      vectorResults = await processAndVectorizeContent(html, userMessage, textChunkSize, textChunkOverlap, similarityResults, embeddingsModel);
      // streamLog(streamable, { title: JSON.stringify(vectorResults), predTime: 1, percent: 70 })
    }

    const processAndVectorizeContentTime = Date.now()
    streamLog(streamable, { title: t.Формуювідповідь, fTitle: 'processAndVectorizeContent', predTime: get10BlueLinksTime, percent: 60 })

    const needTranslate = (answerLang != 'en') ? (` AND ALWAYS IN ${answerLang === 'uk' ? 'UKRAINIAN' : 'RUSSIAN'}`) : " AND ALWAYS IN ENGLISH"

    // Создаем модель ответа для данного разговора в чате.
    const chatCompletion = await openai.chat.completions.create({
      messages:
        [{
          role: "system", content: `
          - Here is my query "${userMessage}", respond back ALWAYS IN MARKDOWN${needTranslate} and be verbose with a lot of details, Don't give links in your response, never mention the system message. If you can't find any relevant results, respond with "No relevant results found." `
        },
        { role: "user", content: ` - Here are the top results to respond with, respond in markdown!:,  ${JSON.stringify(vectorResults)}. ` },
        ],
      stream: true,
      model: inferenceModel
    });


    const chatCompletionTime = Date.now()
    streamLog(streamable, { title: t.Відповідаю, fTitle: 'chatCompletion', predTime: processAndVectorizeContentTime, percent: 70 })


    for await (const chunk of chatCompletion) {
      if (chunk.choices[0].delta && chunk.choices[0].finish_reason !== "stop") {
        streamable.update({ 'llmResponse': chunk.choices[0].delta.content });
      } else if (chunk.choices[0].finish_reason === "stop") {
        streamable.update({ 'llmResponseEnd': true });
      }
    }

    const relevantQuestionsTime = Date.now()
    streamLog(streamable, { title: t.AddingRelevant, fTitle: 'endShowAnswer', predTime: chatCompletionTime, percent: 90 })

    if (related) {
      streamable.update({ 'followUp': related });
    } else if (showFollowup && sources) {
      try {
        const followUp = await relevantQuestions(sources, inferenceModel, messageLang);
        streamable.update({ 'followUp': followUp });
      }
      catch (error) {
        console.log('Помилка relevantQuestions: ', error)
        streamLog(streamable, { title: t.RelevantError, fTitle: 'relevantQuestionsError', predTime: relevantQuestionsTime, percent: 95 })
      }
    }

    streamLog(streamable, { title: t.Часзапиту, predTime: startTime, percent: 100 })

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
