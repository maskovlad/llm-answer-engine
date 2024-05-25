import { FollowUp, SearchResult } from '@/types/types';
import { config } from '../config';

export async function serperSearchWithRelated(message: string, locale: string, numberOfPagesToScan = config.numberOfPagesToScan): Promise<[SearchResult[], FollowUp | {}]> {
  const url = 'https://google.serper.dev/search';

  const data = JSON.stringify({
    "q": message + ' -filetype:pdf AND -filetype:doc AND -filetype:docx',
    "num": numberOfPagesToScan,
    "autocorrect": true,
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
      console.error(`Відповідь SERPER API не ОК. Функція getSourcesSerperWithRelated. Status: ${response.status}`);
      return [[], {}]
    }
    const jsonResponse = await response.json();

    if (!jsonResponse.organic.length) {
      console.error(`Невірна відповідь SERPER API. Функція getSourcesSerperWithRelated.`);
      return [[], {}]
    }

    const sources = jsonResponse.organic.map((result: any): SearchResult => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      favicon: 'https://www.gstatic.com/devrel-devsite/prod/v7ec1cdbf90989ab082f30bf9b9cbe627804848c18b70d722062aeb6c6d8958b5/developers/images/favicon-new.png',
    }));

    // follow-up question
    let related: FollowUp | {} = {}
    if (jsonResponse.peopleAlsoAsk!) {
      related = {
        'choices': [{
          message: {
            content: JSON.stringify({ 'followUp': jsonResponse.peopleAlsoAsk.map((result: any): any => result.question) })
          }
        }]
      }
    } else if (jsonResponse.relatedSearches!) {
      related = {
        'choices': [{
          message: {
            content: JSON.stringify({ 'followUp': jsonResponse.relatedSearches.map((result: any): any => result.query) })
          }
        }]
      }
    }

    return [sources, related];

  } catch (error) {
    console.error('Проблема запиту у функції getSourcesSerperWithRelated::', error);
    return [[], []]
  }
}


// export async function braveSearch(message: string, numberOfPagesToScan = config.numberOfPagesToScan): Promise<SearchResult[]> {
//   try {
//     const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(message)}&count=${numberOfPagesToScan}`, {
//       headers: {
//         'Accept': 'application/json',
//         'Accept-Encoding': 'gzip',
//         "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY as string
//       }
//     });
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${JSON.stringify(response)}`);
//     }
//     const jsonResponse = await response.json();
//     if (!jsonResponse.web || !jsonResponse.web.results) {
//       throw new Error('Invalid API response format');
//     }
//     const final = jsonResponse.web.results.map((result: any): SearchResult => ({
//       title: result.title,
//       link: result.url,
//       favicon: result.profile.img
//     }));
//     return final;
//   } catch (error) {
//     console.error('Error fetching search results:', error);
//     throw error;
//   }
// }

// export async function googleSearch(message: string, numberOfPagesToScan = config.numberOfPagesToScan): Promise<SearchResult[]> {
//   try {
//     const url = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_CX}&q=${encodeURIComponent(message)}&num=${numberOfPagesToScan}`;
//     const response = await fetch(url);
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const jsonResponse = await response.json();
//     if (!jsonResponse.items) {
//       throw new Error('Invalid API response format');
//     }
//     const final = jsonResponse.items.map((result: any): SearchResult => ({
//       title: result.title,
//       link: result.link,
//       favicon: result.pagemap?.cse_thumbnail?.[0]?.src || ''
//     }));
//     return final;
//   } catch (error) {
//     console.error('Error fetching search results:', error);
//     throw error;
//   }
// }

// export async function serperSearch(message: string, numberOfPagesToScan = config.numberOfPagesToScan): Promise<SearchResult[]> {
//   const url = 'https://google.serper.dev/search';
//   const data = JSON.stringify({
//     "q": message
//   });
//   const requestOptions: RequestInit = {
//     method: 'POST',
//     headers: {
//       'X-API-KEY': process.env.SERPER_API as string,
//       'Content-Type': 'application/json'
//     },
//     body: data
//   };
//   try {
//     const response = await fetch(url, requestOptions);
//     if (!response.ok) {
//       throw new Error(`Network response was not ok. Status: ${response.status}`);
//     }
//     const responseData = await response.json();
//     if (!responseData.organic) {
//       throw new Error('Invalid API response format');
//     }
//     const final = responseData.organic.map((result: any): SearchResult => ({
//       title: result.title,
//       link: result.link,
//       favicon: result.favicons?.[0] || ''
//     }));
//     return final
//   } catch (error) {
//     console.error('Error fetching search results:', error);
//     throw error;
//   }
// }

// 8. Fetch search results from Google Serper API
// export async function getSourcesSerper(message: string, locale: string, numberOfPagesToScan = config.numberOfPagesToScan): Promise<SearchResult[] | null> {
//   const url = 'https://google.serper.dev/search';

//   const data = JSON.stringify({
//     "q": message + ' -filetype:pdf AND -filetype:doc AND -filetype:docx',
//     "num": numberOfPagesToScan,
//   });

//   const requestOptions: RequestInit = {
//     method: 'POST',
//     headers: {
//       'X-API-KEY': process.env.SERPER_API as string,
//       'Content-Type': 'application/json'
//     },
//     body: data
//   };

//   try {
//     const response = await fetch(url, requestOptions);
//     if (!response.ok) {
//       console.error(`Відповідь мережі не ОК. Функція getSourcesSerper. Status: ${response.status}`);
//       return null
//     }
//     const jsonResponse = await response.json();

//     if (!jsonResponse.organic.length) {
//       return null
//     }

//     const final = jsonResponse.organic.map((result: any): SearchResult => ({
//       title: result.title,
//       link: result.link,
//       snippet: result.snippet,
//       favicon: 'https://www.gstatic.com/devrel-devsite/prod/v7ec1cdbf90989ab082f30bf9b9cbe627804848c18b70d722062aeb6c6d8958b5/developers/images/favicon-new.png',
//     }));

//     return final;

//   } catch (error) {
//     console.error('Проблема запиту у функції getSourcesSerper::', error);
//     return null
//   }
// }


// 4. Fetch search results from Brave Search API
// export async function braveSearch(message: string, numberOfPagesToScan = config.numberOfPagesToScan): Promise<SearchResult[]> {
//   try {
//     const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(message)}&count=${numberOfPagesToScan}`, {
//       headers: {
//         'Accept': 'application/json',
//         'Accept-Encoding': 'gzip',
//         "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY as string
//       }
//     });

//     if (!response.ok) {
//       throw new Error(`Помилка HTTP до Brave Search API! Функція getSourcesBrave: status: ${response.status}`);
//     }

//     const jsonResponse = await response.json();

//     if (!jsonResponse.web || !jsonResponse.web.results) {
//       throw new Error('Невірний формат відповіді Brave Search API');
//     }

//     const final = jsonResponse.web.results.map((result: any): SearchResult => ({
//       title: result.title,
//       link: result.url,
//       snippet: result.description,
//       favicon: result.profile.img
//     }));

//     return final;

//   } catch (error) {
//     console.error('Помилка запиту до Brave Search API:', error);
//     throw error;
//   }
// }

