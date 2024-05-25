import { digitalDog } from '@/public';

// 1. Define the 'LLMResponseComponentProps' interface with properties for 'llmResponse', 'currentLlmResponse', and 'index'
interface LLMResponseComponentProps {
    llmResponse: string;
    currentLlmResponse: string;
    index: number;
}

// 2. Import the 'Markdown' component from 'react-markdown'
// import Markdown from 'react-markdown';
import Markdown from 'markdown-to-jsx';

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

const MyLink = ({ children, ...props }: {children: any}) => <a target="_blank" rel="noreferrer" {...props}>{children}</a>

// 4. Define the 'LLMResponseComponent' functional component that takes 'llmResponse', 'currentLlmResponse', and 'index' as props
const LLMResponseComponent = ({ llmResponse, currentLlmResponse, index }: LLMResponseComponentProps) => {
    // 5. Check if 'llmResponse' is not empty
    const hasLlmResponse = llmResponse && llmResponse.trim().length > 0;

    return (
        <>
            {hasLlmResponse ? (
                // 6. If 'llmResponse' is not empty, render a div with the 'Markdown' component
                <div className="dark:bg-slate-800 bg-white shadow-lg rounded-lg p-4 mt-4">
                    <div className="flex items-center">
                        <h2 className="text-lg font-semibold flex-grow dark:text-white text-black">Response</h2>
                    </div>
                    <div className="dark:text-gray-300 text-gray-800 markdown-container">
                        <Markdown options={{
                            overrides: {
                                a: {
                                    component: MyLink,
                                },
                            },
                        }}>{llmResponse}</Markdown>
                        <div className="flex items-center justify-end">
                            <img src={digitalDog.src} alt="powered by NAIDA" className='mt-2 h-6' />
                        </div>
                    </div>
                </div>
            ) : (
                // 7. If 'llmResponse' is empty, render the 'StreamingComponent' with 'currentLlmResponse'
                <div>
                    <StreamingComponent currentLlmResponse={currentLlmResponse} />
                    Loading...
                </div>
            )}
        </>
    );
};

export default LLMResponseComponent;