import * as vscode from 'vscode';
import { BackgroundAnalyzer } from './backgroundAnalyzer';

export class ArchitectureExplorer {
    private backgroundAnalyzer: BackgroundAnalyzer;
    
    constructor(backgroundAnalyzer: BackgroundAnalyzer) {
        this.backgroundAnalyzer = backgroundAnalyzer;
    }
    
    async showArchitectureOverview(): Promise<void> {
        try {
            // Get architectural patterns from the background analyzer
            const patterns = await this.backgroundAnalyzer.getArchitecturalPatterns();
            
            // Create a webview panel to display the architecture
            const panel = vscode.window.createWebviewPanel(
                'aiTerminalArchitecture',
                'Project Architecture Overview',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );
            
            // Generate the HTML content
            panel.webview.html = this.generateArchitectureHTML(patterns);
            
            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'analyzePattern':
                            this.analyzeSpecificPattern(message.pattern);
                            return;
                        case 'showFiles':
                            this.showFilesWithPattern(message.pattern);
                            return;
                    }
                }
            );
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate architecture overview: ${error}`);
        }
    }
    
    private generateArchitectureHTML(patterns: any[]): string {
        const patternCards = patterns.map(pattern => {
            const patternName = pattern.pattern || pattern;
            const confidence = pattern.confidence ? (pattern.confidence * 100).toFixed(1) + '%' : 'detected';
            const evidence = pattern.evidence || 'Pattern detected in codebase';
            
            return `
                <div class="pattern-card" onclick="analyzePattern('${patternName}')">
                    <div class="pattern-header">
                        <h3>${patternName}</h3>
                        <span class="confidence">${confidence}</span>
                    </div>
                    <p class="evidence">${evidence}</p>
                    <div class="pattern-actions">
                        <button onclick="showFiles('${patternName}')">Show Files</button>
                        <button onclick="analyzePattern('${patternName}')">Deep Analysis</button>
                    </div>
                </div>
            `;
        }).join('');
        
        const summary = this.generateArchitectureSummary(patterns);
        
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Project Architecture</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        color: var(--vscode-foreground);
                        background: var(--vscode-editor-background);
                        margin: 0;
                        padding: 20px;
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 1px solid var(--vscode-widget-border);
                        padding-bottom: 20px;
                    }
                    
                    .header h1 {
                        color: var(--vscode-textLink-foreground);
                        margin: 0;
                    }
                    
                    .summary {
                        background: var(--vscode-textBlockQuote-background);
                        border-left: 3px solid var(--vscode-textLink-foreground);
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 3px;
                    }
                    
                    .patterns-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 20px;
                        margin-top: 20px;
                    }
                    
                    .pattern-card {
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        border: 1px solid var(--vscode-widget-border);
                        border-radius: 8px;
                        padding: 20px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    
                    .pattern-card:hover {
                        background: var(--vscode-list-hoverBackground);
                        border-color: var(--vscode-textLink-foreground);
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    }
                    
                    .pattern-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                    }
                    
                    .pattern-header h3 {
                        margin: 0;
                        color: var(--vscode-textLink-foreground);
                        font-size: 1.2em;
                    }
                    
                    .confidence {
                        background: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 0.8em;
                        font-weight: bold;
                    }
                    
                    .evidence {
                        color: var(--vscode-descriptionForeground);
                        margin: 10px 0;
                        font-style: italic;
                    }
                    
                    .pattern-actions {
                        display: flex;
                        gap: 10px;
                        margin-top: 15px;
                    }
                    
                    .pattern-actions button {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 0.9em;
                        transition: background 0.2s ease;
                    }
                    
                    .pattern-actions button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    
                    .no-patterns {
                        text-align: center;
                        color: var(--vscode-descriptionForeground);
                        font-style: italic;
                        padding: 40px;
                        background: var(--vscode-textBlockQuote-background);
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                    
                    .refresh-button {
                        background: var(--vscode-textLink-foreground);
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        margin-top: 20px;
                        font-size: 1em;
                    }
                    
                    .refresh-button:hover {
                        opacity: 0.9;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🏗️ Project Architecture Overview</h1>
                    <p>AI Terminal has analyzed your codebase and identified the following architectural patterns</p>
                </div>
                
                <div class="summary">
                    ${summary}
                </div>
                
                ${patterns.length > 0 ? `
                    <div class="patterns-grid">
                        ${patternCards}
                    </div>
                ` : `
                    <div class="no-patterns">
                        <h3>No Architectural Patterns Detected</h3>
                        <p>AI Terminal hasn't detected any specific architectural patterns in your codebase yet.</p>
                        <p>This could be because:</p>
                        <ul style="text-align: left; display: inline-block;">
                            <li>The project is still being analyzed</li>
                            <li>The codebase uses custom or less common patterns</li>
                            <li>The project structure is primarily functional rather than pattern-based</li>
                        </ul>
                        <button class="refresh-button" onclick="refreshAnalysis()">Refresh Analysis</button>
                    </div>
                `}
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function analyzePattern(pattern) {
                        vscode.postMessage({
                            command: 'analyzePattern',
                            pattern: pattern
                        });
                    }
                    
                    function showFiles(pattern) {
                        vscode.postMessage({
                            command: 'showFiles',
                            pattern: pattern
                        });
                    }
                    
                    function refreshAnalysis() {
                        vscode.postMessage({
                            command: 'refresh'
                        });
                    }
                </script>
            </body>
            </html>
        `;
    }
    
    private generateArchitectureSummary(patterns: any[]): string {
        if (patterns.length === 0) {
            return `
                <h3>📊 Architecture Summary</h3>
                <p>No specific architectural patterns have been detected yet. AI Terminal is still analyzing your codebase structure.</p>
            `;
        }
        
        const patternCount = patterns.length;
        const highConfidencePatterns = patterns.filter(p => p.confidence > 0.8).length;
        
        const mostCommonPattern = patterns.reduce((prev, current) => 
            (prev.confidence > current.confidence) ? prev : current
        );
        
        return `
            <h3>📊 Architecture Summary</h3>
            <ul>
                <li><strong>${patternCount}</strong> architectural patterns detected</li>
                <li><strong>${highConfidencePatterns}</strong> high-confidence patterns</li>
                <li><strong>Primary pattern:</strong> ${mostCommonPattern.pattern || mostCommonPattern}</li>
                <li><strong>Architecture style:</strong> ${this.inferArchitecturalStyle(patterns)}</li>
            </ul>
        `;
    }
    
    private inferArchitecturalStyle(patterns: any[]): string {
        const patternNames = patterns.map(p => (p.pattern || p).toLowerCase());
        
        if (patternNames.includes('mvc') || patternNames.includes('mvp') || patternNames.includes('mvvm')) {
            return 'Model-View-Controller based';
        } else if (patternNames.includes('factory') && patternNames.includes('strategy')) {
            return 'Enterprise Object-Oriented';
        } else if (patternNames.includes('observer') || patternNames.includes('event-driven')) {
            return 'Event-Driven Architecture';
        } else if (patternNames.includes('module') || patternNames.includes('namespace')) {
            return 'Modular Architecture';
        } else {
            return 'Mixed Pattern Architecture';
        }
    }
    
    private async analyzeSpecificPattern(pattern: string): Promise<void> {
        try {
            // For now, show a simple information message
            // In the future, this could trigger a deeper analysis
            vscode.window.showInformationMessage(
                `Deep analysis of ${pattern} pattern is coming soon! This will show:
                • Files implementing this pattern
                • Pattern usage statistics
                • Improvement suggestions
                • Related patterns in your codebase`,
                'OK'
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to analyze pattern: ${error}`);
        }
    }
    
    private async showFilesWithPattern(pattern: string): Promise<void> {
        try {
            // This would ideally show files that implement the specific pattern
            // For now, we'll show a placeholder
            vscode.window.showInformationMessage(
                `Files using ${pattern} pattern will be listed here in a future update. This feature will show:
                • Specific files implementing the pattern
                • Usage locations with line numbers
                • Pattern adherence score
                • Refactoring suggestions`,
                'Got it'
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to show files: ${error}`);
        }
    }
}