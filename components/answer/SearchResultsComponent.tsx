// 1. Import the 'useState' and 'useEffect' hooks from React
import { Box, Flex, Heading, Skeleton } from '@radix-ui/themes';
import { useState, useEffect } from 'react';

// 2. Define the 'SearchResult' interface with properties for 'favicon', 'link', and 'title'
export interface SearchResult {
  favicon: string;
  link: string;
  title: string;
}

// 3. Define the 'SearchResultsComponentProps' interface with a 'searchResults' property of type 'SearchResult[]'
export interface SearchResultsComponentProps {
  searchResults: SearchResult[];
}

// 4. Define the 'SearchResultsComponent' functional component that takes 'searchResults' as a prop
const SearchResultsComponent = ({ searchResults }: { searchResults: SearchResult[] }) => {
  // 5. Use the 'useState' hook to manage the 'isExpanded' and 'loadedFavicons' state
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadedFavicons, setLoadedFavicons] = useState<boolean[]>([]);

  // 6. Use the 'useEffect' hook to initialize the 'loadedFavicons' state based on the 'searchResults' length
  useEffect(() => {
    setLoadedFavicons(Array(searchResults.length).fill(false));
  }, [searchResults]);

  // 7. Define the 'toggleExpansion' function to toggle the 'isExpanded' state
  const toggleExpansion = () => setIsExpanded(!isExpanded);

  // 8. Define the 'visibleResults' variable to hold the search results to be displayed based on the 'isExpanded' state
  const visibleResults = isExpanded ? searchResults : searchResults.slice(0, 3);

  // 9. Define the 'handleFaviconLoad' function to update the 'loadedFavicons' state when a favicon is loaded
  const handleFaviconLoad = (index: number) => {
    setLoadedFavicons((prevLoadedFavicons) => {
      const updatedLoadedFavicons = [...prevLoadedFavicons];
      updatedLoadedFavicons[index] = true;
      return updatedLoadedFavicons;
    });
  };

  // 10. Define the 'SearchResultsSkeleton' component to render a loading skeleton
  const SearchResultsSkeleton = () => (
    <>
      {Array.from({ length: isExpanded ? searchResults.length : 3 }).map((_, index) => (
        <Box key={`skeleton-${index}`} maxWidth={{ initial: 'max-w-xl', md: '50%' }} p='2'>
          <Flex align='center' gap='2' p='3'>
            <Skeleton width='5' height='5'></Skeleton>
            <Skeleton width='100%' height='4'></Skeleton>
          </Flex>
        </Box>
      ))}
      {/* Add a skeleton for the "View more" button */}
      <Box maxWidth={{ initial: 'max-w-xl', md: '50%' }} p='2'>
        <Flex align='center' gap='2' p='3'>
          <Skeleton width='5' height='5'></Skeleton>
          <Skeleton width='5' height='5'></Skeleton>
          <Skeleton width='5' height='5'></Skeleton>
          <Skeleton width='100%' height='4'></Skeleton>
        </Flex>
      </Box>
    </>
  );

  // 11. Render the 'SearchResultsComponent'
  return (
    <Box p='4' mt='4' maxWidth='100%'>
      <Flex align='center'>
        <Heading>Sources</Heading>
        {/* <img src="./brave.png" alt="brave logo" className="w-6 h-6" /> */}
      </Flex>
      <Flex my='2' wrap='wrap'>
        {searchResults.length === 0 ? (
          // 12. Render the 'SearchResultsSkeleton' if there are no search results
          <SearchResultsSkeleton />
        ) : (
          <>
            {/* 13. Render the search results with favicon, title, and link */}
            {visibleResults.map((result, index) => (
              <Box key={`searchResult-${index}`} className="p-2 w-full md:w-1/4">
                <div className="flex items-center space-x-2 dark:bg-slate-700 bg-gray-100 p-3 rounded-lg h-full">
                  {!loadedFavicons[index] && (
                    <div className="w-5 h-5 dark:bg-slate-600 bg-gray-400 rounded animate-pulse"></div>
                  )}
                  <img
                    src={result.favicon}
                    alt="favicon"
                    className={`w-5 h-5 ${loadedFavicons[index] ? 'block' : 'hidden'}`}
                    onLoad={() => handleFaviconLoad(index)}
                  />
                  <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold truncate dark:text-gray-200 dark:hover:text-white text-gray-700 hover:text-black">
                    {result.title}
                  </a>
                </div>
              </Box>
            ))}
            {/* 14. Render a button to toggle the expansion of search results */}
            <div className="w-full sm:w-full md:w-1/4 p-2">
              <div
                onClick={toggleExpansion}
                className="flex items-center space-x-2 dark:bg-slate-700 bg-gray-100 p-3 rounded-lg cursor-pointer h-12 justify-center"
              >
                {!isExpanded ? (
                  <>
                    {searchResults.slice(0, 3).map((result, index) => (
                      <img key={`favicon-${index}`} src={result.favicon} alt="favicon" className="w-4 h-4" />
                    ))}
                    <span className="text-sm font-semibold dark:text-gray-200 text-gray-700">View more</span>
                  </>
                ) : (
                  <span className="text-sm font-semibold dark:text-gray-200 text-gray-700">Show Less</span>
                )}
              </div>
            </div>
          </>
        )}
      </Flex>
    </Box>
  )
};

export default SearchResultsComponent;