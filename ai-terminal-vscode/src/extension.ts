import * as vscode from 'vscode';
import { AITerminalCompletionProvider } from './completionProvider';
import { BackgroundAnalyzer } from './backgroundAnalyzer';
import { ConfigurationManager } from './configurationManager';
import { ArchitectureExplorer } from './architectureExplorer';

let backgroundAnalyzer: BackgroundAnalyzer | undefined;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    console.log('AI Terminal extension is now active!');
    
    // Create output channel for logging
    outputChannel = vscode.window.createOutputChannel('AI Terminal');
    context.subscriptions.push(outputChannel);
    
    // Initialize configuration manager
    const configManager = new ConfigurationManager();
    
    // Initialize background analyzer
    if (vscode.workspace.workspaceFolders) {
        backgroundAnalyzer = new BackgroundAnalyzer(
            vscode.workspace.workspaceFolders[0].uri.fsPath,
            outputChannel
        );
        
        // Start background analysis if enabled
        const config = vscode.workspace.getConfiguration('aiTerminal');
        if (config.get<boolean>('enableBackgroundAnalysis', true)) {
            backgroundAnalyzer.start();
        }
    }
    
    // Register completion provider for all languages
    const completionProvider = new AITerminalCompletionProvider(backgroundAnalyzer, outputChannel);
    const completionDisposable = vscode.languages.registerCompletionItemProvider(
        '*', // All languages
        completionProvider,
        '.', // Trigger on dot
        ' ', // Trigger on space
        '(', // Trigger on opening parenthesis
        '{', // Trigger on opening brace
    );
    context.subscriptions.push(completionDisposable);
    
    // Register inline completion provider (for ghost text suggestions)
    const inlineCompletionProvider = vscode.languages.registerInlineCompletionItemProvider(
        '*',
        completionProvider
    );
    context.subscriptions.push(inlineCompletionProvider);
    
    // Register commands
    const analyzeCommand = vscode.commands.registerCommand('aiTerminal.analyzeFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }
        
        await analyzeCurrentFile(editor, backgroundAnalyzer, outputChannel);
    });
    context.subscriptions.push(analyzeCommand);
    
    const rebuildCommand = vscode.commands.registerCommand('aiTerminal.rebuildEmbeddings', async () => {
        if (backgroundAnalyzer) {
            vscode.window.showInformationMessage('Rebuilding project embeddings...');
            await backgroundAnalyzer.rebuildEmbeddings();
            vscode.window.showInformationMessage('Embeddings rebuilt successfully!');
        }
    });
    context.subscriptions.push(rebuildCommand);
    
    const architectureCommand = vscode.commands.registerCommand('aiTerminal.showArchitecture', async () => {
        if (backgroundAnalyzer) {
            const explorer = new ArchitectureExplorer(backgroundAnalyzer);
            await explorer.showArchitectureOverview();
        }
    });
    context.subscriptions.push(architectureCommand);
    
    const configureCommand = vscode.commands.registerCommand('aiTerminal.configure', async () => {
        await configManager.configure();
    });
    context.subscriptions.push(configureCommand);
    
    // Watch for configuration changes
    const configWatcher = vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('aiTerminal')) {
            if (backgroundAnalyzer) {
                backgroundAnalyzer.updateConfiguration();
            }
        }
    });
    context.subscriptions.push(configWatcher);
    
    // Watch for file changes to update embeddings
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{js,ts,tsx,jsx,py,java,cpp,c,go,rs}');
    
    fileWatcher.onDidChange(uri => {
        if (backgroundAnalyzer) {
            backgroundAnalyzer.onFileChanged(uri.fsPath);
        }
    });
    
    fileWatcher.onDidCreate(uri => {
        if (backgroundAnalyzer) {
            backgroundAnalyzer.onFileCreated(uri.fsPath);
        }
    });
    
    fileWatcher.onDidDelete(uri => {
        if (backgroundAnalyzer) {
            backgroundAnalyzer.onFileDeleted(uri.fsPath);
        }
    });
    
    context.subscriptions.push(fileWatcher);
    
    // Show welcome message on first install
    const isFirstInstall = context.globalState.get<boolean>('aiTerminal.firstInstall', true);
    if (isFirstInstall) {
        showWelcomeMessage();
        context.globalState.update('aiTerminal.firstInstall', false);
    }
    
    outputChannel.appendLine('AI Terminal extension activated successfully');
}

async function analyzeCurrentFile(
    editor: vscode.TextEditor,
    backgroundAnalyzer: BackgroundAnalyzer | undefined,
    outputChannel: vscode.OutputChannel
) {
    try {
        outputChannel.show();
        outputChannel.appendLine(`\\n🔬 Analyzing: ${editor.document.fileName}`);
        
        if (!backgroundAnalyzer) {
            outputChannel.appendLine('❌ Background analyzer not initialized');
            return;
        }
        
        const analysis = await backgroundAnalyzer.analyzeFile(
            editor.document.fileName,
            editor.document.getText()
        );
        
        if (analysis) {
            outputChannel.appendLine('\\n📊 Analysis Results:');
            outputChannel.appendLine(`Language: ${analysis.metadata?.language || 'Unknown'}`);
            outputChannel.appendLine(`Functions: ${analysis.metadata?.functions?.length || 0}`);
            outputChannel.appendLine(`Classes: ${analysis.metadata?.classes?.length || 0}`);
            outputChannel.appendLine(`Complexity: ${analysis.metadata?.complexity || 'N/A'}`);
            
            if (analysis.ast?.architecturalPatterns?.length > 0) {
                outputChannel.appendLine('\\n🏗️ Architectural Patterns:');
                analysis.ast.architecturalPatterns.forEach((pattern: any) => {
                    outputChannel.appendLine(`  • ${pattern.pattern || pattern}: ${pattern.confidence ? (pattern.confidence * 100).toFixed(1) + '%' : 'detected'}`);
                });
            }
            
            if (analysis.metadata?.security?.vulnerabilities?.length > 0) {
                outputChannel.appendLine('\\n🛡️ Security Issues:');
                analysis.metadata.security.vulnerabilities.forEach((vuln: string) => {
                    outputChannel.appendLine(`  ⚠️ ${vuln}`);
                });
            }
        }
        
    } catch (error) {
        outputChannel.appendLine(`❌ Analysis failed: ${error}`);
        vscode.window.showErrorMessage(`Analysis failed: ${error}`);
    }
}

function showWelcomeMessage() {
    const message = 'Welcome to AI Terminal! This extension provides architecture-aware code suggestions. Configure your API key to get started.';
    const configureButton = 'Configure Now';
    const learnMoreButton = 'Learn More';
    
    vscode.window.showInformationMessage(message, configureButton, learnMoreButton)
        .then(selection => {
            if (selection === configureButton) {
                vscode.commands.executeCommand('aiTerminal.configure');
            } else if (selection === learnMoreButton) {
                vscode.env.openExternal(vscode.Uri.parse('https://github.com/kapil0x/ai-terminal'));
            }
        });
}

export function deactivate() {
    if (backgroundAnalyzer) {
        backgroundAnalyzer.dispose();
    }
    outputChannel?.appendLine('AI Terminal extension deactivated');
}