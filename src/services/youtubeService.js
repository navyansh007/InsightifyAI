// src/services/youtubeService.js
import axios from 'axios';

// Get base URL depending on environment
const getBaseUrl = () => {
  // Check if we're in development or production
  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }
  // In production (Vercel), use relative URL
  return '';
};

export async function getYouTubeTranscript(videoUrl) {
  try {
    // Extract video ID from URL
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    const baseUrl = getBaseUrl();
    
    // Add timeout to prevent hanging indefinitely
    const response = await axios.get(`${baseUrl}/api/transcript?videoId=${videoId}`, {
      timeout: 15000 // 15 seconds timeout
    });
    
    console.log("Transcript API response received:", !!response.data);
    
    // Check if the response contains the transcript
    if (!response.data || !response.data.transcript) {
      throw new Error('No transcript data received from server');
    }
    
    return response.data.transcript;
  } catch (error) {
    console.error('Error fetching YouTube transcript:', error);
    
    // More descriptive error message based on error type
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. The server took too long to respond.');
    } else if (error.response) {
      // The server responded with a status code outside the 2xx range
      throw new Error(`Server error: ${error.response.status} - ${error.response.data.error || 'Unknown error'}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response from server. Please check if the server is running.');
    } else {
      // Something else happened in setting up the request
      throw new Error(`Failed to fetch transcript: ${error.message}`);
    }
  }
}

function extractVideoId(url) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}