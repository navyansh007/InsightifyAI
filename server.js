// server.js - Adapted for Vercel deployment
const express = require('express');
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');
const timeout = require('connect-timeout');

const app = express();

// Enable CORS for production and development
app.use(cors({
  origin: '*' // For Vercel, allow requests from any origin
}));

// Add request timeout middleware
app.use(timeout('20s')); // Set timeout to 20 seconds
app.use((req, res, next) => {
  if (!req.timedout) next();
});

// Endpoint to fetch YouTube transcripts
app.get('/api/transcript', async (req, res) => {
  console.log(`Received request for videoId: ${req.query.videoId}`);
  
  try {
    const { videoId } = req.query;
    
    if (!videoId) {
      console.log('No videoId provided');
      return res.status(400).json({ error: 'Video ID is required' });
    }
    
    console.log(`Fetching transcript for videoId: ${videoId}`);
    
    // Set a promise timeout
    const fetchWithTimeout = new Promise(async (resolve, reject) => {
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        resolve(transcript);
      } catch (error) {
        console.error('Error in YoutubeTranscript.fetchTranscript:', error);
        reject(error);
      }
    });
    
    // Add timeout to the transcript fetch operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Transcript fetch operation timed out'));
      }, 15000); // 15 seconds timeout
    });
    
    // Race between fetch and timeout
    const transcript = await Promise.race([fetchWithTimeout, timeoutPromise]);
    
    // Format the transcript
    console.log(`Transcript received with ${transcript.length} entries`);
    const formattedTranscript = transcript
      .map(item => item.text)
      .join(' ');
    
    console.log(`Formatted transcript length: ${formattedTranscript.length} characters`);
    
    // Send success response
    res.json({ 
      transcript: formattedTranscript,
      info: {
        segmentCount: transcript.length,
        characterCount: formattedTranscript.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching transcript:', error);
    
    // Determine the appropriate error message and status code
    let statusCode = 500;
    let errorMessage = 'Failed to fetch transcript';
    
    if (error.message && error.message.includes('timed out')) {
      statusCode = 408; // Request Timeout
      errorMessage = 'Transcript fetch operation timed out';
    } else if (error.message && error.message.includes('Could not get transcript data')) {
      statusCode = 404; // Not Found
      errorMessage = 'No transcript available for this video';
    }
    
    // Send error response with appropriate details
    res.status(statusCode).json({ 
      error: errorMessage,
      details: error.message || 'Unknown error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Special handling for Vercel's serverless functions
if (process.env.VERCEL) {
  // In Vercel, we export the app (don't listen on a port)
  module.exports = app;
} else {
  // In development, listen on a port
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
  });
}