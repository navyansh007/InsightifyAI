#!/bin/bash

# This script is for local development only
# Vercel will use the configuration in vercel.json for deployment

# Install dependencies if they don't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run the server and frontend concurrently
echo "Starting server and frontend..."

# Check if concurrently is installed
if ! npm list -g concurrently >/dev/null 2>&1; then
  echo "Installing concurrently..."
  npm install -g concurrently
fi

# Start both the server and frontend
concurrently "node server.js" "npm run dev"