"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const completionProvider_1 = require("./completionProvider");
const backgroundAnalyzer_1 = require("./backgroundAnalyzer");
const configurationManager_1 = require("./configurationManager");
const architectureExplorer_1 = require("./architectureExplorer");
let backgroundAnalyzer;
let outputChannel;
function activate(context) {
    console.log('AI Terminal extension is now active!');
    // Create output channel for logging
    outputChannel = vscode.window.createOutputChannel('AI Terminal');
    context.subscriptions.push(outputChannel);
    // Initialize configuration manager
    const configManager = new configurationManager_1.ConfigurationManager();
    // Initialize background analyzer
    if (vscode.workspace.workspaceFolders) {
        backgroundAnalyzer = new backgroundAnalyzer_1.BackgroundAnalyzer(vscode.workspace.workspaceFolders[0].uri.fsPath, outputChannel);
        // Start background analysis if enabled
        const config = vscode.workspace.getConfiguration('aiTerminal');
        if (config.get('enableBackgroundAnalysis', true)) {
            backgroundAnalyzer.start();
        }
    }
    // Register completion provider for all languages
    const completionProvider = new completionProvider_1.AITerminalCompletionProvider(backgroundAnalyzer, outputChannel);
    const completionDisposable = vscode.languages.registerCompletionItemProvider('*', // All languages
    completionProvider, '.', // Trigger on dot
    ' ', // Trigger on space
    '(', // Trigger on opening parenthesis
    '{');
    context.subscriptions.push(completionDisposable);
    // Register inline completion provider (for ghost text suggestions)
    const inlineCompletionProvider = vscode.languages.registerInlineCompletionItemProvider('*', completionProvider);
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
            const explorer = new architectureExplorer_1.ArchitectureExplorer(backgroundAnalyzer);
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
    const isFirstInstall = context.globalState.get('aiTerminal.firstInstall', true);
    if (isFirstInstall) {
        showWelcomeMessage();
        context.globalState.update('aiTerminal.firstInstall', false);
    }
    outputChannel.appendLine('AI Terminal extension activated successfully');
}
exports.activate = activate;
async function analyzeCurrentFile(editor, backgroundAnalyzer, outputChannel) {
    try {
        outputChannel.show();
        outputChannel.appendLine(`\\n🔬 Analyzing: ${editor.document.fileName}`);
        if (!backgroundAnalyzer) {
            outputChannel.appendLine('❌ Background analyzer not initialized');
            return;
        }
        const analysis = await backgroundAnalyzer.analyzeFile(editor.document.fileName, editor.document.getText());
        if (analysis) {
            outputChannel.appendLine('\\n📊 Analysis Results:');
            outputChannel.appendLine(`Language: ${analysis.metadata?.language || 'Unknown'}`);
            outputChannel.appendLine(`Functions: ${analysis.metadata?.functions?.length || 0}`);
            outputChannel.appendLine(`Classes: ${analysis.metadata?.classes?.length || 0}`);
            outputChannel.appendLine(`Complexity: ${analysis.metadata?.complexity || 'N/A'}`);
            if (analysis.ast?.architecturalPatterns?.length > 0) {
                outputChannel.appendLine('\\n🏗️ Architectural Patterns:');
                analysis.ast.architecturalPatterns.forEach((pattern) => {
                    outputChannel.appendLine(`  • ${pattern.pattern || pattern}: ${pattern.confidence ? (pattern.confidence * 100).toFixed(1) + '%' : 'detected'}`);
                });
            }
            if (analysis.metadata?.security?.vulnerabilities?.length > 0) {
                outputChannel.appendLine('\\n🛡️ Security Issues:');
                analysis.metadata.security.vulnerabilities.forEach((vuln) => {
                    outputChannel.appendLine(`  ⚠️ ${vuln}`);
                });
            }
        }
    }
    catch (error) {
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
        }
        else if (selection === learnMoreButton) {
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/kapil0x/ai-terminal'));
        }
    });
}
function deactivate() {
    if (backgroundAnalyzer) {
        backgroundAnalyzer.dispose();
    }
    outputChannel?.appendLine('AI Terminal extension deactivated');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map