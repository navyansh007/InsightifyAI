// src/services/vectorService.js
// This service will handle the vector searching for the YouTube transcript
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { callGroqApi } from "./groqService";

let vectorStore = null;
let contextChunks = [];

// Simple in-memory vector store without external embedding API
// This avoids the HuggingFace API issues
class SimpleVectorStore {
  constructor() {
    this.documents = [];
  }

  // Add documents to the store
  addDocuments(docs) {
    this.documents = [...docs];
    console.log(`Added ${docs.length} documents to vector store`);
    return this;
  }

  // Simple keyword-based search
  // Not as powerful as embeddings but works without external APIs
  search(query, count = 3) {
    console.log(`Searching for: "${query}" in ${this.documents.length} documents`);
    
    try {
      const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 3);
      
      // Score each document based on term frequency
      const scoredDocs = this.documents.map(doc => {
        const content = doc.pageContent.toLowerCase();
        let score = 0;
        
        queryTerms.forEach(term => {
          // Count occurrences of the term in the document
          const regex = new RegExp(term, 'g');
          const matches = content.match(regex);
          if (matches) {
            score += matches.length;
          }
        });
        
        return { ...doc, score };
      });
      
      // Sort by score and take the top results
      const results = scoredDocs
        .sort((a, b) => b.score - a.score)
        .slice(0, count);
        
      console.log(`Found ${results.length} relevant documents`);
      return results;
    } catch (error) {
      console.error("Error in vector search:", error);
      // Return some fallback documents in case of error
      return this.documents.slice(0, count);
    }
  }
}

export async function initializeVectorStore(transcript) {
  console.log("Initializing vector store with transcript...");
  
  try {
    if (!transcript || typeof transcript !== 'string' || transcript.length < 10) {
      throw new Error('Invalid or empty transcript');
    }
    
    // Split the transcript into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    console.log("Splitting transcript into chunks...");
    const docs = await textSplitter.createDocuments([transcript]);
    contextChunks = docs;
    
    console.log(`Created ${docs.length} chunks from transcript`);
    
    // Create a simple vector store that doesn't require external APIs
    vectorStore = new SimpleVectorStore().addDocuments(docs);
    
    console.log("Vector store initialization complete");
    return true;
  } catch (error) {
    console.error('Error initializing vector store:', error);
    throw new Error(`Failed to process transcript: ${error.message}`);
  }
}

export async function queryTranscript(question, modelId = 'llama3-8b-8192') {
  console.log(`Processing query: "${question}" with model: ${modelId}`);
  
  if (!vectorStore) {
    throw new Error('Vector store not initialized. Please provide a YouTube video first.');
  }
  
  try {
    // Get relevant context using our simple search
    console.log("Searching for relevant context...");
    const results = vectorStore.search(question, 3);
    const context = results.map(res => res.pageContent).join("\n\n");
    
    // If no relevant context found, use the first few chunks
    const finalContext = context || contextChunks.slice(0, 3).map(chunk => chunk.pageContent).join("\n\n");
    
    // Use Groq API with the selected model for answering the question
    console.log(`Generating response with Groq API (model: ${modelId})...`);
    const answer = await callGroqApi(modelId, question, finalContext);
    
    console.log("Response generated successfully");
    return answer;
  } catch (error) {
    console.error('Error querying transcript:', error);
    throw error;
  }
}