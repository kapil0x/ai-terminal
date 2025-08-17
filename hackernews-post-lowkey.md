# HackerNews Post (Low-Key Version)

## Title:
Show HN: Built an AI coding assistant that actually understands project context

## Body:

I got tired of AI tools giving generic suggestions like "add error handling" without understanding my actual codebase. So I built something that combines local ML analysis with AST parsing to provide context-aware help.

**The core idea**: Instead of sending entire files to LLMs, analyze code structure locally first, then send only relevant context for intelligent responses.

**What it does**:
- Builds local embeddings of your codebase (uses CodeT5 when available)
- Parses AST to understand classes, functions, and relationships  
- Provides suggestions based on your actual architecture patterns
- Works with multiple languages (JS/TS, Python, C++, Java)

**Example difference**:
- Generic AI: "Add input validation"
- This tool: "Use the validateEmail() from UserValidator.js:23 like in registration.js:45"

**Technical bits**:
- Node.js CLI + VS Code extension
- Uses Transformers.js for local ML (falls back gracefully)
- SQLite for persistent project knowledge
- Supports Groq/OpenAI APIs for generation

**Try it**:
```bash
npm install -g ai-terminal
aiterm config  # API key setup
aiterm embed-learn  # Learn your codebase
aiterm ask "how should I structure this feature?"
```

GitHub: https://github.com/kapil0x/ai-terminal

Still rough around the edges, but it's been helpful for my projects. The local analysis approach seems promising - curious if others have tried similar techniques or see value in this direction.

Happy to discuss the technical implementation or get feedback on whether this addresses real pain points you've experienced.