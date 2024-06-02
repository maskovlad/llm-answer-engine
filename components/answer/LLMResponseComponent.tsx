import { digitalDog } from '@/public';
import { Box, Flex, Heading, Skeleton, Text } from '@radix-ui/themes';
import { getDictionary } from './dic';
// import Markdown from 'react-markdown';
import Markdown from 'markdown-to-jsx';
import { Locale } from '@/i18n-config';

// 1. Define the 'LLMResponseComponentProps' interface with properties for 'llmResponse', 'currentLlmResponse', and 'index'
interface LLMResponseComponentProps {
  llmResponse: string;
  currentLlmResponse: string;
  index: number;
  lang: Locale;
}


// 3. Define the 'StreamingComponent' functional component that renders the 'currentLlmResponse'
const StreamingComponent = ({ currentLlmResponse }: { currentLlmResponse: string }) => {
  return (
    <>
      {currentLlmResponse && (
        <div className="dark:bg-slate-800 bg-white shadow-lg rounded-lg p-4 mt-4">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold flex-grow dark:text-white text-black">Answer</h2>
            <img src="./groq.png" alt="groq logo" className='w-6 h-6' />
          </div>
          <div className="dark:text-gray-300 text-gray-800">{currentLlmResponse}</div>
        </div>
      )}
    </>
  );
};

// function LinkRenderer(props: any) {
//   return (
//     <a href={props.href} target="_blank" rel="noreferrer">
//       {props.children}
//     </a>
//   );
// }

const MyLink = ({ children, ...props }: { children: any }) => <a target="_blank" rel="noreferrer" {...props}>{children}</a>
const MyP = ({ children, ...props }: { children: any }) => <Text {...props}>{children}</Text>

// 4. Define the 'LLMResponseComponent' functional component that takes 'llmResponse', 'currentLlmResponse', and 'index' as props
const LLMResponseComponent = ({ llmResponse, currentLlmResponse, index, lang }: LLMResponseComponentProps) => {
  // 5. Check if 'llmResponse' is not empty
  const hasLlmResponse = llmResponse && llmResponse.trim().length > 0;
  const t = getDictionary(lang)


  return (
    <>
      {hasLlmResponse ? (
        // 6. If 'llmResponse' is not empty, render a div with the 'Markdown' component
        <Box p='4' mt='4'>
          <Flex align='center'>
            <Heading>{t.response}</Heading>
          </Flex>
          <Box className="markdown-container">
            <Markdown options={{
              overrides: {
                a: {
                  component: MyLink,
                },
                p: {
                  component: MyP,
                },
              },
            }}>{llmResponse}</Markdown>
            <Flex align='center' justify="end">
              <img src={digitalDog.src} alt="powered by NAIDA" className='mt-2 h-6' />
            </Flex>
          </Box>
        </Box>
      ) : (
        // 7. If 'llmResponse' is empty, render the 'StreamingComponent' with 'currentLlmResponse'
        <Flex height='50px' width='100%' align='center' justify='center'>
          {/*<StreamingComponent currentLlmResponse={currentLlmResponse} />*/}
          <Text>
            <Skeleton>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque
              felis tellus, efficitur id convallis a, viverra eget libero. Nam magna
              erat, fringilla sed commodo sed, aliquet nec magna.
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque
              felis tellus, efficitur id convallis a, viverra eget libero. Nam magna
              erat, fringilla sed commodo sed, aliquet nec magna.
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque
              felis tellus, efficitur id convallis a, viverra eget libero. Nam magna
              erat, fringilla sed commodo sed, aliquet nec magna.
            </Skeleton>
          </Text>        
        </Flex>
      )}
      <Flex height='50px' />
    </>
  );
};

export default LLMResponseComponent;