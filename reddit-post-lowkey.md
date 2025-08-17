# Reddit Posts (Low-Key Version)

## r/programming
**Title**: Built a CLI tool that combines local ML with AST parsing for better AI code assistance

**Body**:
Been working on this side project because I was frustrated with AI tools not understanding project context. The idea is to analyze code structure locally first, then use that for smarter AI interactions.

Key features:
- Local semantic analysis of your codebase
- AST parsing for understanding code relationships  
- Context-aware AI responses instead of generic suggestions
- CLI + VS Code extension

Example: Instead of "add error handling", it might suggest "use the ErrorHandler from utils/errors.js:15 like in auth/login.js:42"

GitHub: https://github.com/kapil0x/ai-terminal

Still experimenting with the approach, but curious if others see value in local analysis + AI rather than just sending everything to cloud models.

---

## r/MachineLearning  
**Title**: Combining CodeT5 embeddings with AST analysis for code understanding

**Body**:
Working on a project that uses local ML (CodeT5 when available) combined with traditional AST parsing to understand codebases before sending context to LLMs.

**Approach**:
1. Generate embeddings for code files using CodeT5 or fallback models
2. Parse AST to extract classes, functions, dependencies
3. Build semantic search index of project
4. Use this context to make AI responses more specific

**Results so far**:
- Much more relevant suggestions compared to sending raw files
- Able to reference specific existing patterns in codebase
- Works offline for analysis, only needs API for generation

**Technical details**:
- Uses Transformers.js for client-side ML
- SQLite for persistent project knowledge
- Supports multiple languages through language-specific AST parsers

GitHub: https://github.com/kapil0x/ai-terminal

Curious about feedback on the approach - has anyone tried similar combinations of local ML + traditional static analysis?

---

## r/webdev
**Title**: Made a tool that learns your project patterns for better AI coding help

**Body**:
Sharing a side project I've been working on. Got tired of AI tools that don't understand my actual codebase structure, so built something that learns project patterns first.

**What it does**:
- Scans your codebase to understand architecture
- Learns your coding patterns and conventions
- Gives AI suggestions based on your actual code, not generic examples

**Example**: 
- Before: "You should add validation"  
- After: "Use UserValidator.validateEmail() from utils/validation.js:23 like in components/SignupForm.js:45"

Works with React, Vue, vanilla JS, TypeScript, etc. Also has VS Code extension for inline suggestions.

GitHub: https://github.com/kapil0x/ai-terminal

Still polishing it, but has been helpful for my projects. Would love feedback from other developers on whether this addresses pain points you've experienced.