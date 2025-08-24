# AI Terminal

A powerful terminal-based AI assistant for developers. Features code review, refactoring, project analysis, and more.

## Features

- 🤖 Interactive AI chat sessions
- 💬 One-time question asking
- 🔍 **Code review and analysis**
- 🔧 **Code refactoring suggestions**
- 📊 **Project structure analysis**
- 🚀 **Git changes review**
- 🧪 **Test generation**
- ✏️ **Code modification with natural language**
- 🔧 **Auto-fix common issues**
- 📝 **Custom review templates**
- ⚙️ Easy configuration management
- 🎨 Colorful terminal interface
- 📈 Status monitoring

## Requirements

- Node.js 18.0.0 or higher (required for local embeddings)

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
- Choose AI service (Groq, OpenAI, Ollama, or Custom API)
- Enter your API key
- Set custom API URL (if needed)

### Ollama (Local AI) Setup

For 100% local, privacy-first AI:

```bash
# 1. Install Ollama
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download

# 2. Start Ollama and pull a model
ollama serve
ollama pull llama3.2:1b  # Fast, small model
ollama pull codellama    # Better for code analysis

# 3. Configure ai-terminal
aiterm config
# Choose option 3: Ollama (local)
# Press Enter for API key

# 4. Test with local models
aiterm ask "Explain this code" -m "codellama"
aiterm review main.js -m "llama3.2:1b"
```

**Benefits:**
- ✅ Complete privacy - no data leaves your machine
- ✅ Works offline
- ✅ No API costs or rate limits
- ✅ Combined with local embeddings for superior code understanding

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

### Update to Latest Version
```bash
aiterm update
```
Automatically pulls latest code from GitHub and updates global installation.

## Developer Features

### Code Review
```bash
aiterm review myfile.js
aiterm review myfile.js -t security
aiterm review myfile.js -t team-standards
```
Analyzes code for quality, bugs, performance, and security issues. Use custom templates for team-specific reviews.

### Code Refactoring
```bash
aiterm refactor myfile.js
```
Suggests specific improvements and refactoring opportunities.

### Project Analysis
```bash
aiterm analyze
aiterm analyze ./src
```
Analyzes project structure, tech stack, and architecture.

### Git Changes Review
```bash
aiterm gitreview
aiterm gitreview --staged
```
Reviews git changes before committing.

### Test Generation
```bash
aiterm test myfile.js
aiterm test myfile.py -f pytest
```
Generates comprehensive tests for your code.

### Code Modification
```bash
aiterm modify myfile.js "add error handling to all functions"
aiterm modify app.py "convert this to use async/await"
aiterm modify style.css "make this responsive" --preview
```
Modify code using natural language prompts with AI assistance.

### Auto-Fix Issues
```bash
aiterm fix myfile.js --backup
```
Automatically fixes common code issues and bugs.

## 🧠 Local ML + Codebase Learning 

Unlike other AI tools, ai-terminal combines local machine learning with cloud LLMs for superior context understanding:

### Learn Your Codebase
```bash
aiterm learn                    # Analyze current project
aiterm learn --directory ./src  # Learn from specific directory
```
AI studies your code patterns, architecture, and conventions.

### Add Custom Context
```bash
aiterm remember "We use Redux for state management"
aiterm remember "Always validate inputs in API endpoints"
aiterm remember "Follow functional programming patterns"
```

### View Learned Knowledge
```bash
aiterm context
```
Shows what the AI has learned about your project.

### Context-Aware Commands
Once learned, ALL commands use your project context:
- Reviews follow YOUR conventions
- Modifications match YOUR patterns  
- Suggestions align with YOUR architecture
- Code generation uses YOUR style

### 🤖 Advanced: Local ML Embeddings
```bash
aiterm embed-learn                     # Generate CodeT5 embeddings
aiterm search "authentication logic"   # Semantic code search
aiterm benchmark                       # Compare vs other AI tools
```
Uses local CodeT5 model for semantic understanding and smart context selection.

**Example Workflow:**
```bash
aiterm embed-learn                     # Build local embeddings
aiterm learn                           # Learn project patterns  
aiterm remember "We use async/await"   # Add team preference
aiterm review file.js                  # Now uses ML + context!
```

**🎯 Why This Beats Copilot/Cursor/Claude Code:**
- **Local ML**: CodeT5 embeddings for semantic understanding
- **Smart Context**: Only sends relevant code patterns to LLM
- **Persistent Memory**: Learns once, applies forever
- **Hybrid Architecture**: Local intelligence + cloud generation

## Review Templates

Customize code reviews for your team's conventions:

### Create a Template
```bash
aiterm template create my-team-style
```
Enter your template content with `{CODE}` placeholder. Type "END" when finished.

### Use Templates
```bash
aiterm review file.js -t my-team-style
aiterm review file.js -t security
aiterm review file.js -t performance
```

### Manage Templates
```bash
aiterm template list          # List all templates
aiterm template show security # Show template content
aiterm template delete old    # Delete a template
```

### Built-in Templates
- `security` - Security-focused review
- `performance` - Performance optimization focus
- `team-standards` - General coding standards
- `junior-dev` - Educational reviews for learning

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

## Editor Integration

### Vim/Neovim
Add AI commands directly to your editor:

**Quick Setup:**
```bash
# Add to ~/.vimrc
cat vim-integration.vim >> ~/.vimrc

# Or for Neovim, add to ~/.config/nvim/init.lua
cat neovim-lua.lua >> ~/.config/nvim/init.lua
```

**Key Mappings (with leader key):**
- `<leader>ar` - Review current file
- `<leader>af` - Auto-fix current file  
- `<leader>at` - Generate tests
- `<leader>am` - Modify with prompt
- `<leader>aa` - Ask AI question
- `<leader>ae` - Explain selected code (visual mode)

**Manual Commands:**
```vim
:! aiterm review %
:! aiterm fix % --backup
:! aiterm modify % "add error handling"
```

### Emacs
```elisp
;; Add to ~/.emacs
(load-file "path/to/emacs-integration.el")

;; Key bindings: C-c a <key>
;; C-c a r - Review file
;; C-c a f - Fix file
;; C-c a m - Modify file
```

### VS Code
Add snippets from `vscode-integration.json` to your VS Code snippets for quick AI command insertion.

### Command Shortcuts
Create short aliases for faster usage:
```bash
# Add to ~/.bashrc or ~/.zshrc
source aliases.sh

# Now use short commands:
arev myfile.js              # aiterm review
amod myfile.js "prompt"     # aiterm modify  
afix myfile.js              # aiterm fix
aask "question"             # aiterm ask
achat                       # aiterm chat
```

### Any Editor
Run AI commands from integrated terminal:
```bash
aiterm review current-file.js
aiterm modify app.py "convert to async"
```

## License

MIT
