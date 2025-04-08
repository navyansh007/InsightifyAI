// src/services/groqService.js
import axios from 'axios';

// Base Groq API URL
const GROQ_API_BASE_URL = 'https://api.groq.com/openai/v1';

/**
 * Fetch available models from Groq API
 * @returns {Promise<Array>} List of available models
 */
export const fetchGroqModels = async () => {
  try {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('Groq API key is not set. Please check your .env file.');
    }
    
    const response = await axios.get(`${GROQ_API_BASE_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 seconds timeout
    });
    
    // Extract the data and format it for our dropdown
    const models = response.data.data.map(model => ({
      id: model.id,
      name: formatModelName(model.id),
      details: {
        created: model.created,
        owned_by: model.owned_by,
        ...model
      }
    }));
    
    // Sort by newest first
    return models.sort((a, b) => b.details.created - a.details.created);
  } catch (error) {
    console.error('Error fetching Groq models:', error);
    
    // Provide fallback models in case the API call fails
    return [
      { id: 'llama3-8b-8192', name: 'Llama 3 8B (Default)' },
      { id: 'llama3-70b-8192', name: 'Llama 3 70B' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
      { id: 'gemma-7b-it', name: 'Gemma 7B IT' }
    ];
  }
};

/**
 * Format model ID into a more readable name
 * @param {string} modelId - The raw model ID
 * @returns {string} Formatted model name
 */
const formatModelName = (modelId) => {
  // Basic formatting for common models
  if (modelId.includes('llama3-8b')) {
    return 'Llama 3 8B';
  } else if (modelId.includes('llama3-70b')) {
    return 'Llama 3 70B';
  } else if (modelId.includes('mixtral-8x7b')) {
    return 'Mixtral 8x7B';
  } else if (modelId.includes('gemma-7b')) {
    return 'Gemma 7B IT';
  }
  
  // Generic formatting - capitalize and replace hyphens with spaces
  return modelId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Call Groq API with the selected model
 * @param {string} modelId - The model ID to use
 * @param {string} prompt - The user prompt
 * @param {string} context - The context from video transcript
 * @returns {Promise<string>} The generated response
 */
export const callGroqApi = async (modelId, prompt, context) => {
  try {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('Groq API key is not set. Please check your .env file.');
    }
    
    const response = await axios.post(
      `${GROQ_API_BASE_URL}/chat/completions`,
      {
        model: modelId,
        messages: [
          { role: "system", content: "You are a helpful assistant that answers questions based on the provided context about a YouTube video." },
          { role: "user", content: `Context from video transcript: ${context}\n\nQuestion: ${prompt}\n\nAnswer based only on the information in the context.` }
        ],
        max_tokens: 1024,
        temperature: 0.1
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling Groq API:", error);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Groq API request timed out. Try again later.');
    } else if (error.response) {
      throw new Error(`Groq API error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`);
    } else if (error.request) {
      throw new Error('No response from Groq API. Check your internet connection.');
    } else {
      throw new Error(`Error with Groq API: ${error.message}`);
    }
  }
};