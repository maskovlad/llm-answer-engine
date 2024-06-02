import React from 'react';
import { Box, Card, Flex, Text } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';

interface InitialQueriesProps {
  questions: string[];
  handleFollowUpClick: (question: string) => void;
}

const InitialQueries = ({ questions, handleFollowUpClick }: InitialQueriesProps) => {
  const handleQuestionClick = (question: string) => {
    handleFollowUpClick(question);
  };
  
  return (
    <Flex direction='column' gap="2" mb='2' width='100%'>
      {/*<div className="flex items-center">
      </div>*/}
        {questions.map((question, index) => (
          <Card
            key={index}
            className="flex flex-column cursor-pointer items-center gap-3"
            onClick={() => handleQuestionClick(question)}
          >
            <Box role="img" aria-label="link" className="mr-2">
              <PlusIcon />
            </Box>
            <Text>{question}</Text>
          </Card>
        ))}
    </Flex>
  );
};

export default InitialQueries;