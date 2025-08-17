#!/bin/bash

echo "🔬 AI Terminal - Real Performance Testing"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "index.js" ]; then
    echo "❌ Error: Must run from ai-terminal directory"
    exit 1
fi

# Check if API key is configured
if [ ! -f "$HOME/.ai-terminal-config.json" ]; then
    echo "❌ Error: AI Terminal not configured. Run: aiterm config"
    exit 1
fi

echo "✅ Prerequisites checked"
echo ""

# Set test directory
TEST_DIR=${1:-"/Users/surbhijain/ai-term/cpp-test"}
echo "📁 Testing on codebase: $TEST_DIR"
echo ""

# Run the simulated benchmark first
echo "🧪 Step 1: Running simulated benchmark..."
node index.js real-test -d "$TEST_DIR"
echo ""

# Wait a moment
sleep 2

echo "🚀 Step 2: Running real API comparison test..."
echo "   (This will make actual API calls and may take several minutes)"
echo ""

# Run the real API test
node index.js api-test -d "$TEST_DIR"

echo ""
echo "✅ Testing completed!"
echo ""
echo "📊 Results:"
echo "- Simulated benchmark results shown above"
echo "- Real API comparison results shown above" 
echo "- Detailed reports saved as JSON files"
echo ""
echo "🎯 How to interpret results:"
echo "- Positive % = AI Terminal performs better"
echo "- Negative % = Generic AI performs better"
echo "- >15% improvement = Significant advantage"
echo "- 5-15% improvement = Modest advantage" 
echo "- <5% = Roughly equivalent"
echo ""
echo "🔍 The real API test provides genuine proof of performance differences."