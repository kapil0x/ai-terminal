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
aiterm config
```

You'll be prompted to:
- Choose AI service (Groq, OpenAI or Custom API)
- Enter your API key
- Set custom API URL (if needed)

## Usage

### Ask a single question
```bash
aiterm ask "What is the capital of France?"
```

### Start interactive chat
```bash
aiterm chat
```
Type "exit" to quit the chat session.

### Check status
```bash
aiterm status
```

### Command options

- `-m, --model <model>`: Specify AI model (default: llama3-70b-8192)

Example:
```bash
aiterm ask "Explain quantum computing" -m llama3-70b-8192
```

## API Key Setup

### Groq (Recommended - Free & Fast)
1. Get free API key from https://console.groq.com/keys
2. Run `aiterm config`
3. Select "Groq" and enter your key

### OpenAI
1. Get API key from https://platform.openai.com/api-keys
2. Run `aiterm config`
3. Select "OpenAI" and enter your key

### Custom API
1. Run `aiterm config`
2. Select "Custom API"
3. Enter your API key and endpoint URL

## Linux Installation

To run anywhere in your system:

1. Copy to `/usr/local/bin/`:
```bash
sudo cp ai-term-standalone.js /usr/local/bin/aiterm
sudo chmod +x /usr/local/bin/aiterm
```

2. Use anywhere with: `aiterm ask "your question"`

## Requirements

- Node.js 16+
- Internet connection
- Valid AI service API key

## License

MIT