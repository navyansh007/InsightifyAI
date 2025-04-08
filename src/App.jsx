import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  VStack, 
  Heading, 
  Text, 
  Circle, 
  Spinner, 
  Center,
  useToast
} from '@chakra-ui/react';
import YouTubeInput from './components/YouTubeInput';
import ChatInterface from './components/ChatInterface';

// Logo component
const Logo = () => (
  <Circle size="14" bg="whiteAlpha.100" mb={4}>
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="url(#logo-gradient)" strokeWidth="1.5" />
      <path d="M15 12L10 15.5V8.5L15 12Z" fill="url(#logo-gradient)" />
      <defs>
        <linearGradient id="logo-gradient" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
    </svg>
  </Circle>
);

function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const toast = useToast();
  
  const handleTranscriptLoaded = (url, title, thumbnail) => {
    console.log("handleTranscriptLoaded called with:", { url, title, thumbnail });
    
    // First update the data
    setVideoData({
      title: title || 'YouTube Video',
      thumbnail: thumbnail
    });
    
    // Then set the URL which triggers the interface change
    setVideoUrl(url);
    
    // Finally turn off loading
    setLoading(false);
  };

  return (
    <Box minH="100vh" py={8} px={4} bg="black">
      <Container maxW="4xl" h="100%">
        <VStack spacing={12} align="center" w="full">
          {/* Header */}
          <VStack spacing={4} textAlign="center">
            <Logo />
            <Heading as="h1" size="2xl" mb={2}>Insightify AI</Heading>
            <Text color="gray.400" maxW="lg">
              Engage in meaningful conversations with any YouTube video content
            </Text>
          </VStack>

          {/* Main content */}
          <Box w="full" mb={12}>
            {loading ? (
              <Center py={12}>
                <VStack spacing={8}>
                  <Box position="relative">
                    <Spinner
                      thickness="4px"
                      speed="0.65s"
                      emptyColor="gray.700"
                      color="blue.500"
                      size="xl"
                    />
                  </Box>
                  <VStack spacing={4}>
                    <Heading size="md">Analyzing Video Content</Heading>
                    <Text color="gray.400" textAlign="center" maxW="md">
                      Extracting and analyzing the transcript from your YouTube video.
                      This may take a moment for longer videos.
                    </Text>
                  </VStack>
                </VStack>
              </Center>
            ) : (
              <>
                {videoUrl ? (
                  <ChatInterface videoUrl={videoUrl} videoData={videoData} />
                ) : (
                  <YouTubeInput 
                    onTranscriptLoaded={handleTranscriptLoaded} 
                    setLoading={setLoading} 
                  />
                )}
              </>
            )}
          </Box>
          
          {/* Footer */}
          <VStack spacing={2} textAlign="center">
            <Text color="gray.500" fontSize="sm">
              © {new Date().getFullYear()} Insightify AI
            </Text>
            <Text color="gray.600" fontSize="xs">
              {'Made with ❤️'}
            </Text>
            <Text color="gray.600" fontSize="xs">
              {'By Team Future Forward'}
            </Text>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
}

export default App;