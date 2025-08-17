import * as vscode from 'vscode';
import { BackgroundAnalyzer } from './backgroundAnalyzer';
import axios from 'axios';

export class AITerminalCompletionProvider implements 
    vscode.CompletionItemProvider, 
    vscode.InlineCompletionItemProvider {
    
    private backgroundAnalyzer: BackgroundAnalyzer | undefined;
    private outputChannel: vscode.OutputChannel;
    private lastRequestTime = 0;
    private requestDelay = 500; // Debounce delay
    
    constructor(backgroundAnalyzer: BackgroundAnalyzer | undefined, outputChannel: vscode.OutputChannel) {
        this.backgroundAnalyzer = backgroundAnalyzer;
        this.outputChannel = outputChannel;
    }
    
    // Standard completion items (dropdown suggestions)
    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {
        
        // Debounce requests
        const now = Date.now();
        if (now - this.lastRequestTime < this.requestDelay) {
            return [];
        }
        this.lastRequestTime = now;
        
        try {
            const suggestions = await this.generateSuggestions(document, position, 'completion');
            return suggestions.map(suggestion => this.createCompletionItem(suggestion));
        } catch (error) {
            this.outputChannel.appendLine(`Completion error: ${error}`);
            return [];
        }
    }
    
    // Inline completion items (ghost text)
    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[]> {
        
        const config = vscode.workspace.getConfiguration('aiTerminal');
        if (!config.get<boolean>('enableInlineSuggestions', true)) {
            return [];
        }
        
        try {
            const suggestions = await this.generateSuggestions(document, position, 'inline');
            if (suggestions.length > 0) {
                // Return the first suggestion as inline completion
                return [new vscode.InlineCompletionItem(suggestions[0].text, new vscode.Range(position, position))];
            }
        } catch (error) {
            this.outputChannel.appendLine(`Inline completion error: ${error}`);
        }
        
        return [];
    }
    
    private async generateSuggestions(
        document: vscode.TextDocument,
        position: vscode.Position,
        type: 'completion' | 'inline'
    ): Promise<Array<{ text: string; description?: string; confidence?: number }>> {
        
        if (!this.backgroundAnalyzer) {
            return [];
        }
        
        // Get current context
        const currentLine = document.lineAt(position.line).text;
        const textBeforeCursor = currentLine.substring(0, position.character);
        const textAfterCursor = currentLine.substring(position.character);
        
        // Don't suggest in comments or strings (basic detection)
        if (this.isInCommentOrString(document, position)) {
            return [];
        }
        
        // Get smart context from background analyzer
        const smartContext = await this.getSmartContext(document, position);
        
        if (!smartContext) {
            return [];
        }
        
        // Generate AI suggestion
        const prompt = this.buildSuggestionPrompt(
            document.getText(),
            position,
            textBeforeCursor,
            textAfterCursor,
            smartContext,
            type
        );
        
        const aiSuggestion = await this.callAIService(prompt);
        
        if (aiSuggestion) {
            return this.parseSuggestions(aiSuggestion, type);
        }
        
        return [];
    }
    
    private async getSmartContext(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<any> {
        
        if (!this.backgroundAnalyzer) {
            return null;
        }
        
        try {
            // Get file analysis
            const fileAnalysis = await this.backgroundAnalyzer.getFileAnalysis(document.fileName);
            
            // Get similar code examples
            const currentCode = this.getCurrentCodeContext(document, position);
            const similarFiles = await this.backgroundAnalyzer.findSimilarCode(currentCode, 3);
            
            // Get architectural patterns
            const patterns = await this.backgroundAnalyzer.getArchitecturalPatterns();
            
            return {
                fileAnalysis,
                similarFiles,
                patterns,
                currentCode,
                language: this.getLanguage(document.fileName)
            };
            
        } catch (error) {
            this.outputChannel.appendLine(`Context generation error: ${error}`);
            return null;
        }
    }
    
    private getCurrentCodeContext(document: vscode.TextDocument, position: vscode.Position): string {
        // Get surrounding code context (10 lines before and after)
        const startLine = Math.max(0, position.line - 10);
        const endLine = Math.min(document.lineCount - 1, position.line + 10);
        
        let context = '';
        for (let i = startLine; i <= endLine; i++) {
            const linePrefix = i === position.line ? '→ ' : '  ';
            context += `${linePrefix}${i + 1}: ${document.lineAt(i).text}\\n`;
        }
        
        return context;
    }
    
    private buildSuggestionPrompt(
        fullCode: string,
        position: vscode.Position,
        textBefore: string,
        textAfter: string,
        context: any,
        type: 'completion' | 'inline'
    ): string {
        
        const language = context.language;
        const currentLine = position.line + 1;
        
        let prompt = `You are an expert ${language} developer providing intelligent code suggestions.
        
Current context:
- File: ${vscode.window.activeTextEditor?.document.fileName}
- Language: ${language}
- Line: ${currentLine}
- Code before cursor: "${textBefore}"
- Code after cursor: "${textAfter}"

`;
        
        // Add architectural context
        if (context.patterns && context.patterns.length > 0) {
            prompt += `\\nDetected architectural patterns in this project:
${context.patterns.slice(0, 3).map((p: any) => `- ${p.pattern || p}: ${p.evidence || 'detected'}`).join('\\n')}

`;
        }
        
        // Add similar code examples
        if (context.similarFiles && context.similarFiles.length > 0) {
            prompt += `\\nSimilar code patterns found in project:
${context.similarFiles.slice(0, 2).map((f: any) => 
    `- ${f.filePath}: ${f.metadata?.functions?.slice(0, 2).join(', ') || 'similar patterns'}`
).join('\\n')}

`;
        }
        
        // Add file-specific context
        if (context.fileAnalysis) {
            const analysis = context.fileAnalysis;
            prompt += `\\nCurrent file context:
- Functions: ${analysis.metadata?.functions?.slice(0, 3).join(', ') || 'none'}
- Classes: ${analysis.metadata?.classes?.map((c: any) => c.name).slice(0, 2).join(', ') || 'none'}
- Imports: ${analysis.metadata?.imports?.slice(0, 3).map((i: any) => i.from).join(', ') || 'none'}

`;
        }
        
        // Add current code context
        prompt += `\\nCurrent code context:
\`\`\`${language}
${context.currentCode}
\`\`\`

`;
        
        if (type === 'inline') {
            prompt += `Provide a single, concise code completion for the current cursor position. 
Response format: Just the code to complete the current line or statement, no explanations.
Examples:
- If completing a function call: "getUserById(id)"
- If completing a variable: "const user = "
- If completing an import: "import { useState } from 'react';"

Complete this code:`;
        } else {
            prompt += `Provide 1-3 intelligent code suggestions for the current cursor position.
Consider the project's architectural patterns and existing code style.
Response format:
1. [Primary suggestion] - [Brief explanation]
2. [Alternative] - [Brief explanation]
3. [Another option] - [Brief explanation]

Suggestions:`;
        }
        
        return prompt;
    }
    
    private async callAIService(prompt: string): Promise<string | null> {
        try {
            const config = vscode.workspace.getConfiguration('aiTerminal');
            const apiKey = config.get<string>('apiKey');
            const apiUrl = config.get<string>('apiUrl', 'https://api.groq.com/openai/v1');
            const model = config.get<string>('model', 'llama3-70b-8192');
            
            if (!apiKey) {
                // Show configuration prompt only once per session
                if (!(this as any).configPromptShown) {
                    (this as any).configPromptShown = true;
                    vscode.window.showWarningMessage(
                        'AI Terminal: API key not configured', 
                        'Configure Now'
                    ).then(selection => {
                        if (selection === 'Configure Now') {
                            vscode.commands.executeCommand('aiTerminal.configure');
                        }
                    });
                }
                return null;
            }
            
            const response = await axios.post(`${apiUrl}/chat/completions`, {
                model: model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 150,
                temperature: 0.1,
                stop: ['\\n\\n', '```']
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            return response.data.choices[0]?.message?.content?.trim() || null;
            
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    vscode.window.showErrorMessage('AI Terminal: Invalid API key');
                } else if (error.response?.status === 429) {
                    this.outputChannel.appendLine('Rate limit exceeded, throttling requests');
                } else {
                    this.outputChannel.appendLine(`API error: ${error.message}`);
                }
            } else {
                this.outputChannel.appendLine(`Request error: ${error}`);
            }
            return null;
        }
    }
    
    private parseSuggestions(
        aiResponse: string, 
        type: 'completion' | 'inline'
    ): Array<{ text: string; description?: string; confidence?: number }> {
        
        if (type === 'inline') {
            // For inline suggestions, return the raw response as a single suggestion
            return [{ text: aiResponse.trim() }];
        }
        
        // For completion suggestions, parse numbered list
        const suggestions: Array<{ text: string; description?: string }> = [];
        const lines = aiResponse.split('\\n').filter(line => line.trim());
        
        for (const line of lines) {
            const match = line.match(/^\\d+\\.\\s*(.+?)\\s*-\\s*(.+)$/);
            if (match) {
                suggestions.push({
                    text: match[1].trim(),
                    description: match[2].trim()
                });
            } else if (line.trim() && !line.includes('suggestion') && !line.includes('response')) {
                // Fallback: treat any non-empty line as a suggestion
                suggestions.push({
                    text: line.trim()
                });
            }
        }
        
        return suggestions.slice(0, 3); // Limit to 3 suggestions
    }
    
    private createCompletionItem(suggestion: { text: string; description?: string }): vscode.CompletionItem {
        const item = new vscode.CompletionItem(suggestion.text, vscode.CompletionItemKind.Snippet);
        item.detail = 'AI Terminal';
        item.documentation = suggestion.description || 'AI-generated suggestion based on project architecture';
        item.insertText = suggestion.text;
        item.sortText = '0'; // Prioritize our suggestions
        
        return item;
    }
    
    private isInCommentOrString(document: vscode.TextDocument, position: vscode.Position): boolean {
        const line = document.lineAt(position.line).text;
        const textBefore = line.substring(0, position.character);
        
        // Simple detection for comments and strings
        const inLineComment = textBefore.includes('//');
        const inBlockComment = textBefore.includes('/*') && !textBefore.includes('*/');
        const singleQuotes = (textBefore.match(/'/g) || []).length % 2 === 1;
        const doubleQuotes = (textBefore.match(/"/g) || []).length % 2 === 1;
        const backticks = (textBefore.match(/`/g) || []).length % 2 === 1;
        
        return inLineComment || inBlockComment || singleQuotes || doubleQuotes || backticks;
    }
    
    private getLanguage(fileName: string): string {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const languageMap: { [key: string]: string } = {
            'js': 'JavaScript',
            'jsx': 'JavaScript',
            'ts': 'TypeScript', 
            'tsx': 'TypeScript',
            'py': 'Python',
            'java': 'Java',
            'cpp': 'C++',
            'c': 'C',
            'go': 'Go',
            'rs': 'Rust',
            'php': 'PHP'
        };
        
        return languageMap[extension || ''] || 'Unknown';
    }
}