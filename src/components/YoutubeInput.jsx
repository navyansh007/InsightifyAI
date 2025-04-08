import React, { useState, useCallback } from 'react';
import {
  VStack,
  Heading,
  Text,
  Input,
  Button,
  InputGroup,
  InputLeftElement,
  Alert,
  AlertIcon,
  AlertDescription,
  Box,
  Wrap,
  WrapItem,
  useToast,
} from '@chakra-ui/react';
import { getYouTubeTranscript } from '../services/youtubeService';
import { initializeVectorStore } from '../services/vectorService';

const YouTubeInput = ({ onTranscriptLoaded, setLoading }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [inProgress, setInProgress] = useState(false);
  const toast = useToast();

  // Extract video metadata if available
  const extractVideoMetadata = async (videoId) => {
    try {
      console.log("Extracting video metadata for ID:", videoId);
      const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      return { thumbnail };
    } catch (error) {
      console.error('Error fetching video metadata:', error);
      return { thumbnail: null, title: null };
    }
  };

  const extractVideoId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  // Use callback to avoid recreation on each render
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    
    if (inProgress) {
      console.log("Submission already in progress, ignoring");
      return;
    }
    
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }
    
    const videoId = extractVideoId(url);
    if (!videoId) {
      setError('Invalid YouTube URL. Please enter a valid video URL.');
      return;
    }
    
    try {
      console.log("Starting transcript loading process");
      setInProgress(true);
      setLoading(true);
      
      // Set a timeout to prevent hanging indefinitely
      const timeoutId = setTimeout(() => {
        console.log("Operation timed out after 30 seconds");
        setError('Operation timed out. Please try again or check if the server is running.');
        setLoading(false);
        setInProgress(false);
      }, 30000);
      
      // Get the transcript
      console.log("Fetching transcript...");
      const transcript = await getYouTubeTranscript(url);
      console.log("Transcript fetched successfully, length:", transcript?.length);
      
      // Get metadata (faster and less critical)
      console.log("Fetching metadata...");
      const metadata = await extractVideoMetadata(videoId);
      console.log("Metadata fetched successfully");
      
      // Initialize the vector store with transcript data
      console.log("Initializing vector store...");
      await initializeVectorStore(transcript);
      console.log("Vector store initialized successfully");
      
      // Clear timeout since operation succeeded
      clearTimeout(timeoutId);
      
      // Call the callback to indicate successful loading - this should trigger UI change in parent
      console.log("All operations successful, calling onTranscriptLoaded");
      onTranscriptLoaded(url, metadata.title, metadata.thumbnail);
      
      toast({
        title: "Video loaded successfully",
        description: "You can now chat about the video content",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setError(error.message || 'Failed to load transcript');
      setLoading(false);
      setInProgress(false);
      
      toast({
        title: "Error loading video",
        description: error.message || "Failed to load transcript",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      console.log("handleSubmit finally block executed");
      setInProgress(false);
    }
  }, [url, inProgress, setLoading, onTranscriptLoaded, toast]);

  const handleSampleVideo = (id) => {
    setUrl(`https://www.youtube.com/watch?v=${id}`);
  };

  return (
    <VStack spacing={8} align="center" w="full">
      <VStack spacing={4} textAlign="center" maxW="2xl">
        <Heading as="h2" size="lg">Enter YouTube Video URL</Heading>
        <Text color="gray.400">
          Paste any YouTube video URL below to start analyzing its content and chat with Insightify AI about the video.
        </Text>
      </VStack>
      
      <VStack as="form" onSubmit={handleSubmit} spacing={4} w="full" maxW="2xl">
        <InputGroup size="lg">
          <InputLeftElement pointerEvents="none">
            <Box color="gray.400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" fill="currentColor"/>
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </Box>
          </InputLeftElement>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            bg="gray.900"
            borderColor="gray.700"
            _focus={{ 
              borderColor: "blue.500",
              boxShadow: "0 0 0 1px #3182ce"
            }}
            pl={12}
          />
        </InputGroup>
        
        <Button 
          type="submit" 
          colorScheme="blue"
          size="lg"
          w="full"
          isLoading={inProgress}
          loadingText="Processing..."
        >
          Analyze Video
        </Button>
        
        {error && (
          <Alert status="error" variant="subtle" bg="red.900" borderColor="red.800" borderWidth="1px" borderRadius="md">
            <AlertIcon color="red.400" />
            <AlertDescription color="red.400">{error}</AlertDescription>
          </Alert>
        )}
      </VStack>
      
      <VStack spacing={4} pt={4}>
        <Text color="gray.500" fontSize="sm">Examples you can try:</Text>
        <Wrap spacing={3} justify="center">
          {['dQw4w9WgXcQ', '9bZkp7q19f0', 'jNQXAC9IVRw'].map((id) => (
            <WrapItem key={id}>
              <Button 
                onClick={() => handleSampleVideo(id)}
                size="sm"
                variant="outline"
                borderColor="gray.700"
                _hover={{ bg: "gray.700" }}
              >
                youtube.com/watch?v={id}
              </Button>
            </WrapItem>
          ))}
        </Wrap>
      </VStack>
    </VStack>
  );
};

export default YouTubeInput;