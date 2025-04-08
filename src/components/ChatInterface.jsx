import React, { useState, useRef, useEffect } from 'react';
import {
  VStack,
  HStack,
  Box,
  Flex,
  Text,
  Input,
  Image,
  IconButton,
  Link,
  Heading,
  Center,
  Spinner,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';
import Message from './Message';
import ModelSelector from './ModelSelector';
import { queryTranscript } from '../services/vectorService';

// Icon components
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 5l7 7m0 0l-7 7m7-7H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const MoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

// Generate a unique chat ID for storage
const generateChatId = (videoId) => {
  return `chat-${videoId}-${Date.now()}`;
};

const ChatInterface = ({ videoUrl, videoData }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState('');
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama3-8b-8192'); // Default model
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const cancelRef = useRef(null);
  const videoId = extractVideoId(videoUrl);
  const chatContainerRef = useRef(null);
  const toast = useToast();

  // Initialize chat ID and load messages from local storage if available
  useEffect(() => {
    if (videoId) {
      const newChatId = generateChatId(videoId);
      setChatId(newChatId);
      
      // Check if there are saved messages for this video
      const savedChats = JSON.parse(localStorage.getItem('videoMindChats') || '{}');
      const videoChats = Object.values(savedChats).filter(
        chat => chat.videoId === videoId
      );
      
      // If there are saved chats for this video, offer to load them
      if (videoChats.length > 0) {
        toast({
          title: "Previous chats found",
          description: "You can access previous chats for this video from the menu",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  }, [videoId, toast]);

  // Auto scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    // Save messages to local storage whenever they change
    if (chatId && messages.length > 0) {
      saveChat();
    }
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (videoUrl) {
      // Add welcome message when video is loaded
      setMessages([
        { 
          text: `I've analyzed the content of this video. Feel free to ask me any questions about what was discussed or shown in the video!`,
          isUser: false,
          timestamp: new Date().toISOString(),
          model: selectedModel
        }
      ]);
      
      // Focus the input field
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    }
  }, [videoUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;
    
    const userMessage = input;
    setInput('');
    
    // Add user message to chat
    const newUserMessage = { 
      text: userMessage, 
      isUser: true,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    
    try {
      setLoading(true);
      
      // Add typing indicator
      setMessages(prev => [...prev, { text: "...", isUser: false, isTyping: true }]);
      
      // Get the AI response using the selected model
      const response = await queryTranscript(userMessage, selectedModel);
      
      // Simulate a slight delay for a more natural conversation
      setTimeout(() => {
        // Remove typing indicator and add AI response
        setMessages(prev => {
          const withoutTyping = prev.filter(msg => !msg.isTyping);
          return [...withoutTyping, { 
            text: response, 
            isUser: false,
            timestamp: new Date().toISOString(),
            model: selectedModel
          }];
        });
        setLoading(false);
      }, 800);
      
    } catch (error) {
      // Remove typing indicator and add error message
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        return [...withoutTyping, { 
          text: `Sorry, I couldn't process that: ${error.message || 'An error occurred'}`, 
          isUser: false,
          timestamp: new Date().toISOString(),
          model: selectedModel
        }];
      });
      setLoading(false);
    }
  };
  
  function extractVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  }

  // Handle keyboard shortcut
  const handleKeyDown = (e) => {
    // Submit on Ctrl+Enter or Command+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };
  
  // Save current chat to local storage
  const saveChat = () => {
    if (!chatId) return;
    
    // Get existing chats
    const savedChats = JSON.parse(localStorage.getItem('videoMindChats') || '{}');
    
    // Update with current chat
    savedChats[chatId] = {
      id: chatId,
      videoId,
      videoUrl,
      title: videoData?.title || 'YouTube Video',
      messages: messages.filter(msg => !msg.isTyping),
      lastUpdated: new Date().toISOString(),
      model: selectedModel
    };
    
    // Save back to local storage
    localStorage.setItem('videoMindChats', JSON.stringify(savedChats));
    
    return savedChats[chatId];
  };
  
  // Clear the current chat
  const clearChat = () => {
    setMessages([
      { 
        text: `Chat cleared. Feel free to ask new questions about the video!`,
        isUser: false,
        timestamp: new Date().toISOString(),
        model: selectedModel
      }
    ]);
    setIsClearDialogOpen(false);
    toast({
      title: "Chat cleared",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Export chat as JSON file
  const exportChat = () => {
    if (messages.length <= 1) {
      toast({
        title: "Nothing to export",
        description: "Have a conversation first before exporting",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    const chatData = saveChat();
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `videomind-chat-${videoId}-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Chat exported",
      description: "Your chat history has been saved to a JSON file",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Load a previous chat for this video
  const loadPreviousChats = () => {
    const savedChats = JSON.parse(localStorage.getItem('videoMindChats') || '{}');
    const videoChats = Object.values(savedChats).filter(
      chat => chat.videoId === videoId
    );
    
    if (videoChats.length === 0) {
      toast({
        title: "No saved chats",
        description: "There are no previous conversations for this video",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // For now, just load the most recent chat
    // In a more advanced version, you could show a list of chats to choose from
    const latestChat = videoChats.sort((a, b) => 
      new Date(b.lastUpdated) - new Date(a.lastUpdated)
    )[0];
    
    setMessages(latestChat.messages);
    setChatId(latestChat.id);
    
    // If the chat has a model saved, use it
    if (latestChat.model) {
      setSelectedModel(latestChat.model);
    }
    
    toast({
      title: "Previous chat loaded",
      description: `Loaded chat from ${new Date(latestChat.lastUpdated).toLocaleString()}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Handle model change
  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
    
    // Save the current chat with the new model
    if (chatId && messages.length > 0) {
      const updatedChat = saveChat();
      console.log("Updated chat with new model:", updatedChat);
    }
  };

  return (
    <VStack spacing={6} align="stretch" w="full">
      {/* Video info card with model selector */}
      <Box bg="gray.900" borderWidth="1px" borderColor="gray.800" borderRadius="lg" overflow="hidden">
        <Flex p={4} alignItems="center" gap={4}>
          <Box 
            position="relative" 
            w="32" 
            h="20" 
            borderRadius="md" 
            overflow="hidden" 
            flexShrink={0}
            boxShadow="md"
          >
            {videoId && (
              <Image 
                src={videoData?.thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                alt="Video thumbnail" 
                objectFit="cover"
                w="full"
                h="full"
                fallbackSrc={`https://img.youtube.com/vi/${videoId}/0.jpg`}
              />
            )}
            {/* Play button overlay */}
            <Flex 
              position="absolute" 
              inset="0"
              bg="blackAlpha.600"
              alignItems="center"
              justifyContent="center"
            >
              <Center 
                w="10" 
                h="10" 
                borderRadius="full" 
                bg="blackAlpha.700"
              >
                <PlayIcon />
              </Center>
            </Flex>
          </Box>
          
          <Flex direction="column" flex="1" minW="0">
            <Heading as="h3" size="md" isTruncated>
              {videoData?.title || 'YouTube Video'}
            </Heading>
            <Link 
              href={videoUrl} 
              isExternal
              color="blue.400" 
              fontSize="sm"
              isTruncated
              _hover={{ color: "blue.300" }}
            >
              {videoUrl}
            </Link>
            
            {/* Model selector */}
            <Box mt={2}>
              <ModelSelector 
                selectedModel={selectedModel} 
                onSelectModel={handleModelChange} 
              />
            </Box>
          </Flex>
          
          <Flex>
            <Menu>
              <Tooltip label="Chat options" placement="top">
                <MenuButton
                  as={IconButton}
                  icon={<MoreIcon />}
                  variant="ghost"
                  colorScheme="gray"
                  aria-label="Chat options"
                  mr={2}
                />
              </Tooltip>
              <MenuList bg="gray.800" borderColor="gray.700">
                <MenuItem 
                  icon={<TrashIcon />} 
                  onClick={() => setIsClearDialogOpen(true)}
                  bg="gray.800"
                  _hover={{ bg: "gray.700" }}
                >
                  Clear chat
                </MenuItem>
                <MenuItem 
                  icon={<SaveIcon />} 
                  onClick={loadPreviousChats}
                  bg="gray.800"
                  _hover={{ bg: "gray.700" }}
                >
                  Load saved chat
                </MenuItem>
                <MenuItem 
                  icon={<DownloadIcon />} 
                  onClick={exportChat}
                  bg="gray.800"
                  _hover={{ bg: "gray.700" }}
                >
                  Export chat
                </MenuItem>
              </MenuList>
            </Menu>
            
            <IconButton
              as={Link}
              href={videoUrl}
              isExternal
              icon={<ExternalLinkIcon />}
              aria-label="Open video in YouTube"
              variant="ghost"
              colorScheme="gray"
              color="gray.400"
              _hover={{
                bg: "whiteAlpha.100"
              }}
            />
          </Flex>
        </Flex>
      </Box>
      
      {/* Chat messages area */}
      <Box 
        ref={chatContainerRef}
        h="400px" 
        overflowY="auto" 
        bg="gray.900" 
        bgOpacity={0.5}
        borderWidth="1px" 
        borderColor="gray.800" 
        borderRadius="lg" 
        p={4}
        sx={{
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(82, 82, 91, 0.3)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(82, 82, 91, 0.5)',
          },
        }}
      >
        <VStack spacing={4} align="stretch">
          {messages.map((msg, index) => (
            <Message 
              key={index} 
              message={msg.text} 
              isUser={msg.isUser}
              isTyping={msg.isTyping}
              timestamp={msg.timestamp}
              model={msg.model}
            />
          ))}
          <Box ref={messagesEndRef} />
        </VStack>
      </Box>
      
      {/* Input area */}
      <Box as="form" onSubmit={handleSubmit}>
        <VStack spacing={2}>
          <Flex w="full" position="relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the video..."
              bg="gray.900"
              borderColor="gray.700"
              size="lg"
              pr="14"
              _focus={{ 
                borderColor: "blue.500",
                boxShadow: "0 0 0 1px #3182ce"
              }}
            />
            <IconButton
              type="submit"
              position="absolute"
              right="3"
              top="50%"
              transform="translateY(-50%)"
              isDisabled={!input.trim() || loading}
              icon={loading ? <Spinner size="sm" /> : <SendIcon />}
              aria-label="Send message"
              colorScheme={input.trim() && !loading ? "blue" : "gray"}
              variant="solid"
              isRound
              size="sm"
            />
          </Flex>
          
          <Text textAlign="center" fontSize="xs" color="gray.500">
            Press Ctrl+Enter to send
          </Text>
        </VStack>
      </Box>
      
      {/* Clear chat confirmation dialog */}
      <AlertDialog
        isOpen={isClearDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsClearDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800" borderColor="gray.700">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Clear Chat History
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to clear the current chat history? This cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsClearDialogOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={clearChat} ml={3}>
                Clear
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
};

export default ChatInterface;