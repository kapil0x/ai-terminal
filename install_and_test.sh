#!/bin/bash

# AI Terminal Semantic Search Installation and Test Script
echo "🚀 AI Terminal Semantic Search Setup and Test"
echo "=============================================="

# Check Node.js installation
echo ""
echo "📋 Checking Prerequisites..."
if command -v node &> /dev/null; then
    echo "✅ Node.js version: $(node --version)"
else
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

if command -v npm &> /dev/null; then
    echo "✅ npm version: $(npm --version)"
else
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

# Navigate to ai-terminal directory
cd /Users/surbhijain/ai-term/ai-terminal

echo ""
echo "📦 Installing Dependencies..."
echo "This may take a few minutes for first-time setup..."

# Install dependencies
npm install

echo ""
echo "🧠 Setting up CodeT5 Embeddings..."
echo "Note: First run will download the CodeT5 model (~500MB)"

# Generate embeddings for the cpp-test codebase
echo "Generating embeddings for nlohmann/json codebase..."
node index.js embed-learn -d /Users/surbhijain/ai-term/cpp-test

echo ""
echo "🔍 Testing Semantic Search..."
echo "Searching for 'json parsing function'..."

# Run the semantic search
node index.js search 'json parsing function'

echo ""
echo "✨ Running Demo..."
node semantic_search_demo.js

echo ""
echo "🎯 Additional Test Queries to Try:"
echo "1. node index.js search 'error handling'"
echo "2. node index.js search 'string manipulation'"  
echo "3. node index.js search 'serialization'"
echo "4. node index.js search 'memory management'"

echo ""
echo "📊 Compare with traditional search:"
echo "grep -r 'json.*pars' /Users/surbhijain/ai-term/cpp-test | head -5"

echo ""
echo "✅ Setup complete! Semantic search is ready to use."