import React from 'react';
import {
  Box,
  Text,
  Flex,
  Code,
  Heading,
  Badge,
  Tooltip,
} from '@chakra-ui/react';

const Message = ({ message, isUser, isTyping = false, timestamp, model }) => {
  // Format timestamp if available
  const formattedTime = timestamp ? new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : '';
  
  // Format model name for display
  const formatModelName = (modelId) => {
    if (!modelId) return '';
    
    // Shorten the model ID for display
    if (modelId.includes('llama3-8b')) {
      return 'Llama 3 8B';
    } else if (modelId.includes('llama3-70b')) {
      return 'Llama 3 70B';
    } else if (modelId.includes('mixtral')) {
      return 'Mixtral';
    } else if (modelId.includes('gemma')) {
      return 'Gemma';
    }
    
    // Return last part of model ID if it's too long
    const parts = modelId.split('-');
    return parts.length > 1 ? parts.slice(-2).join('-') : modelId;
  };
  
  // Format code blocks
  const formatMessage = (text) => {
    if (!text) return null;
    
    // Check if the message contains code blocks
    if (!text.includes('```')) {
      return <Text whiteSpace="pre-wrap">{text}</Text>;
    }
    
    // Split by code blocks and format accordingly
    const parts = text.split(/(```(?:.*?)\n[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        // Extract language and code
        const match = part.match(/```(.*?)\n([\s\S]*?)```/);
        if (!match) return <Box as="pre" key={index} my={2}>{part}</Box>;
        
        const [, language, code] = match;
        
        return (
          <Box key={index} my={4} borderRadius="md" overflow="hidden">
            {language && language.trim() !== '' && (
              <Flex 
                bg="gray.800" 
                px={3} 
                py={1} 
                alignItems="center"
                borderBottom="1px solid" 
                borderBottomColor="gray.700"
              >
                <Text fontSize="xs" color="gray.400">{language.trim()}</Text>
              </Flex>
            )}
            <Box bg="gray.900" p={3} overflowX="auto">
              <Code 
                display="block" 
                whiteSpace="pre" 
                children={code} 
                bg="transparent" 
                color="gray.300"
                fontSize="sm"
              />
            </Box>
          </Box>
        );
      }
      
      return <Text key={index} whiteSpace="pre-wrap">{part}</Text>;
    });
  };
  
  return (
    <Box
      maxW="90%"
      alignSelf={isUser ? "flex-end" : "flex-start"}
      bg={isUser ? "blue.900" : "gray.800"}
      bgOpacity={isUser ? 0.2 : 0.5}
      borderWidth="1px"
      borderColor={isUser ? "blue.800" : "gray.700"}
      borderRadius="lg"
      p={3}
    >
      <Flex justifyContent="space-between" alignItems="center" mb={2}>
        <Flex alignItems="center">
          <Text 
            fontWeight="medium" 
            color={isUser ? "blue.300" : "purple.300"}
            mr={2}
          >
            {isUser ? "You" : "AI Assistant"}
          </Text>
          
          {/* Show model badge for AI responses */}
          {!isUser && model && (
            <Tooltip label={`Using model: ${model}`} placement="top">
              <Badge 
                colorScheme="purple" 
                variant="subtle" 
                fontSize="2xs"
                px={1}
              >
                {formatModelName(model)}
              </Badge>
            </Tooltip>
          )}
        </Flex>
        
        {timestamp && (
          <Tooltip label={new Date(timestamp).toLocaleString()} placement="top">
            <Text fontSize="xs" color="gray.500" ml={2}>
              {formattedTime}
            </Text>
          </Tooltip>
        )}
      </Flex>
      
      {isTyping ? (
        <Flex h={6} alignItems="center">
          <Flex gap={2}>
            <Box 
              w={2} 
              h={2} 
              borderRadius="full" 
              bg="gray.500" 
              animation="bounce 1s infinite"
            />
            <Box 
              w={2} 
              h={2} 
              borderRadius="full" 
              bg="gray.500" 
              animation="bounce 1s infinite 0.2s"
            />
            <Box 
              w={2} 
              h={2} 
              borderRadius="full" 
              bg="gray.500" 
              animation="bounce 1s infinite 0.4s"
            />
          </Flex>
        </Flex>
      ) : (
        <Box fontSize="sm" color="gray.200">
          {formatMessage(message)}
        </Box>
      )}
    </Box>
  );
};

export default Message;