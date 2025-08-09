# AI Terminal

A terminal-based AI assistant that runs in Linux terminals.

## Features

- 🤖 Interactive AI chat sessions
- 💬 One-time question asking
- 🔧 Easy configuration management
- 🎨 Colorful terminal interface
- 📊 Status monitoring

## Installation

1. Clone or download this project
2. Install dependencies:
```bash
npm install
```

3. Make executable (Linux):
```bash
chmod +x index.js
```

4. Optional - Create global link:
```bash
npm link
```

## Configuration

Before using, configure your AI service:

```bash
node index.js config
```

You'll be prompted to:
- Choose AI service (OpenAI or Custom API)
- Enter your API key
- Set custom API URL (if needed)

## Usage

### Ask a single question
```bash
node index.js ask "What is the capital of France?"
```

### Start interactive chat
```bash
node index.js chat
```
Type "exit" to quit the chat session.

### Check status
```bash
node index.js status
```

### Command options

- `-m, --model <model>`: Specify AI model (default: llama-3.1-70b-versatile)

Example:
```bash
node index.js ask "Explain quantum computing" -m llama-3.1-70b-versatile
```

## API Key Setup

### Groq (Recommended - Free & Fast)
1. Get free API key from https://console.groq.com/keys
2. Run `node index.js config`
3. Select "Groq" and enter your key

### OpenAI
1. Get API key from https://platform.openai.com/api-keys
2. Run `node index.js config`
3. Select "OpenAI" and enter your key

### Custom API
1. Run `node index.js config`
2. Select "Custom API"
3. Enter your API key and endpoint URL

## Linux Installation

To run anywhere in your system:

1. Copy to `/usr/local/bin/`:
```bash
sudo cp index.js /usr/local/bin/ai-term
sudo chmod +x /usr/local/bin/ai-term
```

2. Install dependencies globally or copy node_modules

3. Use with: `ai-term ask "your question"`

## Requirements

- Node.js 16+
- Internet connection
- Valid AI service API key

## License

MIT