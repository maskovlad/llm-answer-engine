'use client';
// 1. Import Dependencies
import { FormEvent, useEffect, useRef, useState, useCallback, use } from 'react';
import { useActions, readStreamableValue } from 'ai/rsc';
import { type AI } from './action';
import { ChatScrollAnchor } from '@/lib/hooks/chat-scroll-anchor';
import Textarea from 'react-textarea-autosize';
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit';
import { Tooltip, TooltipContent, TooltipTrigger, } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
// Main components 
import SearchResultsComponent from '@/components/answer/SearchResultsComponent';
import UserMessageComponent from '@/components/answer/UserMessageComponent';
import FollowUpComponent from '@/components/answer/FollowUpComponent';
import InitialQueries from '@/components/answer/InitialQueries';
// Sidebar components
import LLMResponseComponent from '@/components/answer/LLMResponseComponent';
import ImagesComponent from '@/components/answer/ImagesComponent';
import VideosComponent from '@/components/answer/VideosComponent';
// Function calling components
const MapComponent = dynamic(() => import('@/components/answer/Map'), { ssr: false, });
import MapDetails from '@/components/answer/MapDetails';
import ShoppingComponent from '@/components/answer/ShoppingComponent';
import FinancialChart from '@/components/answer/FinancialChart';
import { ArrowUp } from '@phosphor-icons/react';
// OPTIONAL: Use Upstash rate limiting to limit the number of requests per user
import RateLimit from '@/components/answer/RateLimit';
import { Message, MessageSettings, Place, SearchResult, ServerLog, Shopping, StreamMessage } from '@/types/types';
import { defaultMessageSettings } from '@/lib/message-settings';
import Log from '@/components/Log';
import * as Toast from '@radix-ui/react-toast';
import * as Progress from '@radix-ui/react-progress';


export default function Page() {
  // 3. Set up action that will be used to stream all the messages
  const { myAction } = useActions<typeof AI>();
  // 4. Set up form submission handling
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');
  // 5. Set up state for the messages
  const [messages, setMessages] = useState<Message[]>([]);
  // 6. Set up state for the CURRENT LLM response (for displaying in the UI while streaming)
  const [currentLlmResponse, setCurrentLlmResponse] = useState('');
  const [log, setLog] = useState<ServerLog[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [openToast, setOpenToast] = useState(false);
  const [progress, setProgress] = useState<number>(0)

  // const updateString = (index: number, newString: string) => {
  //   console.log(`newString: ${newString}`)
  //   setLog([...log, newString] )
  // };


  // 7. Set up handler for when the user clicks on the follow up button
  const handleFollowUpClick = useCallback(async (question: string) => {
    setCurrentLlmResponse('');
    await handleUserMessageSubmission(question);
  }, []);
  // 8. For the form submission, we need to set up a handler that will be called when the user submits the form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/') {
        if (
          e.target &&
          ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).nodeName)
        ) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (inputRef?.current) {
          inputRef.current.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputRef]);
  // 9. Set up handler for when a submission is made, which will call the myAction function
  const handleSubmit = async (message: string) => {
    if (!message) return;
    await handleUserMessageSubmission(message);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const messageToSend = inputValue.trim();
    if (!messageToSend) return;
    setInputValue('');
    await handleSubmit(messageToSend);
  };

  const handleUserMessageSubmission = async (userMessage: string): Promise<void> => {
    console.log('handleUserMessageSubmission', userMessage);
    setProgress(10)
    const newMessageId = Date.now();
    const newMessage = {
      id: newMessageId,
      type: 'userMessage',
      userMessage: userMessage,
      content: '',
      images: [],
      videos: [],
      followUp: null,
      isStreaming: true,
      searchResults: [] as SearchResult[],
      places: [] as Place[],
      shopping: [] as Shopping[],
      status: '',
      ticker: undefined,
      settings: {video: true, image:true, sources:true, relevant:true},
      // log: [],
    };

    // читаємо налаштування запиту з local storage браузера
    let messageSettings: MessageSettings
    const storedSettings = localStorage.getItem('settings')
    if (storedSettings) {
      messageSettings = JSON.parse(storedSettings)
    } else {
      messageSettings = defaultMessageSettings
    }

    setMessages(prevMessages => [...prevMessages, newMessage]);
    let lastAppendedResponse = "";

    // читаємо стрім з бекенда
    try {
      const streamableValue = await myAction(userMessage, messageSettings);

      let llmResponseString = "";

      // ОТРИМАННЯ ДАНИХ
      for await (const message of readStreamableValue(streamableValue)) {
        const typedMessage = message as StreamMessage;

        setMessages((prevMessages) => {

          const messagesCopy = [...prevMessages];
          const messageIndex = messagesCopy.findIndex(msg => msg.id === newMessageId);

          if (messageIndex !== -1) {
            const currentMessage = messagesCopy[messageIndex];

            if (typedMessage.status === 'rateLimitReached') {
              currentMessage.status = 'rateLimitReached';
            }
            if (typedMessage.llmResponse && typedMessage.llmResponse !== lastAppendedResponse) {
              currentMessage.content += typedMessage.llmResponse;
              lastAppendedResponse = typedMessage.llmResponse;
            }
            if (typedMessage.llmResponseEnd) {
              currentMessage.isStreaming = false;
            }
            if (typedMessage.settings) {
              currentMessage.settings = typedMessage.settings
            }
            if (typedMessage.searchResults) {
              currentMessage.searchResults = typedMessage.searchResults;
            }
            if (typedMessage.images) {
              currentMessage.images = [...typedMessage.images];
            }
            if (typedMessage.videos) {
              currentMessage.videos = [...typedMessage.videos];
            }
            if (typedMessage.followUp) {
              currentMessage.followUp = typedMessage.followUp;
            }
            // Optional Function Calling + Conditional UI
            // if (typedMessage.conditionalFunctionCallUI) {
            //   const functionCall = typedMessage.conditionalFunctionCallUI;
            //   if (functionCall.type === 'places') {
            //     currentMessage.places = functionCall.places;
            //   }
            //   if (functionCall.type === 'shopping') {
            //     currentMessage.shopping = functionCall.shopping;
            //   }
            //   if (functionCall.type === 'ticker') {
            //     console.log('ticker', functionCall);
            //     currentMessage.ticker = functionCall.data;
            //   }
            // }
          }
          return messagesCopy;  // чому ми повертаємо це?
        });

        if (typedMessage.llmResponse) {
          llmResponseString += typedMessage.llmResponse;
          setCurrentLlmResponse(llmResponseString);
          // console.log(progress)
          // setProgress(progress+1)
        }

        if (typedMessage.log) {
          setLog(log => [...log, typedMessage.log])
          setProgress(typedMessage.log.percent)
          // if (typedMessage.log.percent === 100) {
            
          // }
        }
      }
    } catch (error) {
      console.error("Error streaming data for user message:", error);
    } finally {
      setTimeout(() => setProgress(0), 2000)
    }
  };

  // LOG
  const toggleLogSidebar = () => {
    setShowLog(!showLog);
  };
  const clearLog = () => {
    setLog([])
  }

  // console.log(progress)
  return (
    <div>

      {/* LOG */}
      <div className={`shadow-lg transition-transform duration-300 ease-in-out transform ${!showLog ? '-translate-x-[262px]' : 'translate-x-0'} knopka fixed bottom-[0vh] left-[262px] `}>
        <button
          onClick={toggleLogSidebar}
          className="text-gray-500 hover:text-gray-600 focus:outline-none"
        >
          Log
        </button>
      </div>
      <Log text={log} isOpen={showLog} clear={clearLog} />

      {/* <Toast.Provider swipeDirection="right"> */}
        {/* <button
          className="inline-flex items-center justify-center rounded font-medium text-[15px] px-[15px] leading-[35px] h-[35px] bg-white text-violet11 shadow-[0_2px_10px] shadow-blackA4 outline-none hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black"
          onClick={() => {
            setOpenToast(false);
          }}
        >
          Close
        </button> */}
        {/* <Toast.Root className="bg-green rounded-md shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] p-[15px] grid [grid-template-areas:_'title_action'_'description_action'] grid-cols-[auto_max-content] gap-x-[15px] items-center data-[state=open]:animate-slideIn data-[state=closed]:animate-hide data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[transform_200ms_ease-out] data-[swipe=end]:animate-swipeOut"
          open={openToast}
          onOpenChange={setOpenToast}>
          <Toast.Title className="[grid-area:_title] mb-[5px] font-medium text-slate12 text-[15px]">Title</Toast.Title>
        </Toast.Root>
        <Toast.Viewport className="[--viewport-padding:_25px] fixed bottom-0 right-0 flex flex-col p-[var(--viewport-padding)] gap-[10px] w-[390px] max-w-[100vw] m-0 list-none z-[2147483647] outline-none" />
      </Toast.Provider> */}


      {messages.length > 0 && (
        <div className="flex flex-col">

          {messages.map((message, index) => (
            <div key={`message-${index}`} className="flex flex-col md:flex-row">
              <div className="w-full md:w-3/4 md:pr-2">

                {message.status && message.status === 'rateLimitReached' && <RateLimit />}

                {message.type === 'userMessage' && <UserMessageComponent message={message.userMessage} />}

                {message.ticker && message.ticker.length > 0 && (
                  <FinancialChart key={`financialChart-${index}`} ticker={message.ticker} />
                )}

                {message.settings.sources && message.searchResults && (<SearchResultsComponent key={`searchResults-${index}`} searchResults={message.searchResults} />)}

                {message.places && message.places.length > 0 && (
                  <MapComponent key={`map-${index}`} places={message.places} />
                )}

                <LLMResponseComponent llmResponse={message.content} currentLlmResponse={currentLlmResponse} index={index} key={`llm-response-${index}`} />

                {message.settings.relevant && message.followUp && (
                  <div className="flex flex-col">
                    <FollowUpComponent key={`followUp-${index}`} followUp={message.followUp} handleFollowUpClick={handleFollowUpClick} />
                  </div>
                )}
              </div>

              {/* Secondary content area */}
              <div className="w-full md:w-1/4 md:pl-2">
                {message.shopping && message.shopping.length > 0 && <ShoppingComponent key={`shopping-${index}`} shopping={message.shopping} />}
                {message.settings.video && message.videos && <VideosComponent key={`videos-${index}`} videos={message.videos} />}
                {message.settings.image && message.images && <ImagesComponent key={`images-${index}`} images={message.images} />}
                {message.places && message.places.length > 0 && (
                  <MapDetails key={`map-${index}`} places={message.places} />
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Form */}
      <div className={`px-2 fixed inset-x-0 z-20 bottom-0 w-full bg-gradient-to-b duration-300 ease-in-out animate-in dark:from-gray-900/10 dark:from-10% peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]] mb-4`}>
        <div className="mx-auto max-w-xl sm:px-4 ">
          {messages.length === 0 && (
            <InitialQueries questions={['How is apple\'s stock doing these days?', 'What were the key accomplishments of Bohdan Khmelnytsky?', 'What are the main works of Taras Shevchenko?']} handleFollowUpClick={handleFollowUpClick} />
          )}

          <form
            ref={formRef}
            onSubmit={async (e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              handleFormSubmit(e);
              setCurrentLlmResponse('');
              if (window.innerWidth < 600) {
                (e.target as HTMLFormElement)['message']?.blur();
              }
              const value = inputValue.trim();
              setInputValue('');
              if (!value) return;
            }}
          >
            <div className="relative flex flex-col w-full overflow-hidden max-h-60 grow dark:bg-slate-800 bg-gray-100 rounded-md border sm:px-2">

              {progress ? (
                <Progress.Root
                  className="relative flex justify-center items-center overflow-hidden bg-[#41347d] rounded-full w-full h-[2.6rem]"
                  style={{
                    // Fix overflow clipping in Safari
                    // https://gist.github.com/domske/b66047671c780a238b51c51ffde8d3a0
                    transform: 'translateZ(0)',
                  }}
                  value={progress}
                >
                  <Progress.Indicator
                    className="absolute z-10 bg-[#2563eb] w-full h-full transition-transform duration-1000 ease-[cubic-bezier(0.65, 0, 0.35, 1)]"
                    style={{ transform: `translateX(-${100 - progress}%)` }}
                  />
                  <span className='z-30 text-gray-200'>
                    {progress === 10 
                      ? 'Шукаю...' 
                      : progress != 100 
                        ? log[log.length - 1].title 
                        : `${log[log.length - 1].title} ${Math.trunc(log[log.length - 1].time/1000)} сек` }
                    </span>
                </Progress.Root>
              ) : (
                <>
                  <Textarea
                    ref={inputRef}
                    tabIndex={0}
                    onKeyDown={onKeyDown}
                    placeholder="Send a message."
                    className="w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm dark:text-white text-black pr-[45px]"
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    name="message"
                    rows={1}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />

                  <ChatScrollAnchor trackVisibility={true} />

                  <div className="absolute right-5 top-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="submit" size="icon" disabled={inputValue === ''}>
                          <ArrowUp />
                          <span className="sr-only">Найда, шукай!</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Найда, шукай!</TooltipContent>
                    </Tooltip>
                  </div>
                </>
              )}

            </div>
          </form>

        </div>
      </div>
      <div className="pb-[80px] pt-4 md:pt-10"></div>
    </div>
  );
};