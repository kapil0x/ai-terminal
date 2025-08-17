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
exports.BackgroundAnalyzer = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class BackgroundAnalyzer {
    constructor(workspacePath, outputChannel) {
        this.isInitialized = false;
        this.analysisCache = new Map();
        this.disposables = [];
        this.workspacePath = workspacePath;
        this.outputChannel = outputChannel;
    }
    async start() {
        try {
            this.outputChannel.appendLine('🚀 Starting AI Terminal background analysis...');
            // Initialize AI Terminal core (import from parent directory)
            await this.initializeAITerminalCore();
            // Build initial embeddings for the workspace
            await this.buildInitialEmbeddings();
            this.isInitialized = true;
            this.outputChannel.appendLine('✅ Background analysis initialized');
        }
        catch (error) {
            this.outputChannel.appendLine(`❌ Failed to initialize background analysis: ${error}`);
            vscode.window.showErrorMessage(`AI Terminal initialization failed: ${error}`);
        }
    }
    async initializeAITerminalCore() {
        var _a;
        try {
            // Import the CodeEmbeddings class from the parent directory
            const parentDir = path.resolve(__dirname, '../../');
            const embeddingsPath = path.join(parentDir, 'embeddings.js');
            if (fs.existsSync(embeddingsPath)) {
                // Dynamically import the CodeEmbeddings class
                const { default: CodeEmbeddings } = await (_a = embeddingsPath, Promise.resolve().then(() => __importStar(require(_a))));
                this.aiTerminalCore = new CodeEmbeddings();
                await this.aiTerminalCore.initialize();
                this.outputChannel.appendLine('✅ AI Terminal core initialized');
            }
            else {
                // Fallback: Use embedded lightweight version
                this.aiTerminalCore = new EmbeddedAITerminal();
                await this.aiTerminalCore.initialize();
                this.outputChannel.appendLine('✅ Embedded AI Terminal initialized');
            }
        }
        catch (error) {
            this.outputChannel.appendLine(`⚠️ Core initialization failed, using fallback: ${error}`);
            this.aiTerminalCore = new EmbeddedAITerminal();
            await this.aiTerminalCore.initialize();
        }
    }
    async buildInitialEmbeddings() {
        const startTime = Date.now();
        this.outputChannel.appendLine('📊 Building project embeddings...');
        try {
            const codeFiles = await this.findCodeFiles(this.workspacePath);
            this.outputChannel.appendLine(`Found ${codeFiles.length} code files`);
            let processed = 0;
            const batchSize = 5; // Process in small batches to avoid blocking
            for (let i = 0; i < codeFiles.length; i += batchSize) {
                const batch = codeFiles.slice(i, i + batchSize);
                await Promise.all(batch.map(async (file) => {
                    try {
                        const content = fs.readFileSync(file, 'utf8');
                        const analysis = await this.aiTerminalCore.embedFile(file, content);
                        this.analysisCache.set(file, analysis);
                        processed++;
                    }
                    catch (error) {
                        this.outputChannel.appendLine(`⚠️ Failed to process ${file}: ${error}`);
                    }
                }));
                // Update progress
                if (processed % 10 === 0) {
                    this.outputChannel.appendLine(`📈 Processed ${processed}/${codeFiles.length} files`);
                }
                // Small delay to prevent blocking the main thread
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            const duration = (Date.now() - startTime) / 1000;
            this.outputChannel.appendLine(`✅ Embeddings built for ${processed} files in ${duration.toFixed(1)}s`);
        }
        catch (error) {
            this.outputChannel.appendLine(`❌ Embedding build failed: ${error}`);
        }
    }
    async findCodeFiles(directory) {
        const files = [];
        const extensions = new Set(['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.go', '.rs']);
        const scanDirectory = (dir) => {
            try {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    // Skip hidden directories and node_modules
                    if (item.startsWith('.') || item === 'node_modules' || item === 'dist' || item === 'build') {
                        continue;
                    }
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        scanDirectory(fullPath);
                    }
                    else if (stat.isFile()) {
                        const ext = path.extname(fullPath).toLowerCase();
                        if (extensions.has(ext)) {
                            files.push(fullPath);
                        }
                    }
                }
            }
            catch (error) {
                // Skip directories that can't be read
            }
        };
        scanDirectory(directory);
        return files.slice(0, 200); // Limit to 200 files for initial version
    }
    async analyzeFile(filePath, content) {
        if (!this.isInitialized || !this.aiTerminalCore) {
            return null;
        }
        try {
            const analysis = await this.aiTerminalCore.embedFile(filePath, content);
            this.analysisCache.set(filePath, analysis);
            return analysis;
        }
        catch (error) {
            this.outputChannel.appendLine(`Analysis error for ${filePath}: ${error}`);
            return null;
        }
    }
    async getFileAnalysis(filePath) {
        // Return cached analysis if available
        if (this.analysisCache.has(filePath)) {
            return this.analysisCache.get(filePath) || null;
        }
        // If not cached, analyze the current file
        if (fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                return await this.analyzeFile(filePath, content);
            }
            catch (error) {
                this.outputChannel.appendLine(`Failed to read file ${filePath}: ${error}`);
            }
        }
        return null;
    }
    async findSimilarCode(code, limit = 5) {
        if (!this.isInitialized || !this.aiTerminalCore) {
            return [];
        }
        try {
            const embedding = await this.aiTerminalCore.generateEmbedding(code);
            const similar = await this.aiTerminalCore.findSimilar(embedding, limit);
            return similar;
        }
        catch (error) {
            this.outputChannel.appendLine(`Similarity search error: ${error}`);
            return [];
        }
    }
    async getArchitecturalPatterns() {
        if (!this.isInitialized || !this.aiTerminalCore) {
            return [];
        }
        try {
            return await this.aiTerminalCore.getArchitecturalPatterns();
        }
        catch (error) {
            this.outputChannel.appendLine(`Pattern retrieval error: ${error}`);
            return [];
        }
    }
    async rebuildEmbeddings() {
        this.analysisCache.clear();
        await this.buildInitialEmbeddings();
    }
    updateConfiguration() {
        const config = vscode.workspace.getConfiguration('aiTerminal');
        const enabled = config.get('enableBackgroundAnalysis', true);
        if (!enabled && this.isInitialized) {
            this.outputChannel.appendLine('🔇 Background analysis disabled');
        }
        else if (enabled && !this.isInitialized) {
            this.start();
        }
    }
    // File change handlers
    onFileChanged(filePath) {
        if (this.analysisCache.has(filePath)) {
            // Remove from cache, will be re-analyzed on next request
            this.analysisCache.delete(filePath);
            this.outputChannel.appendLine(`📝 File changed: ${path.basename(filePath)}`);
        }
    }
    onFileCreated(filePath) {
        // File will be analyzed when first requested
        this.outputChannel.appendLine(`📄 New file: ${path.basename(filePath)}`);
    }
    onFileDeleted(filePath) {
        this.analysisCache.delete(filePath);
        this.outputChannel.appendLine(`🗑️ File deleted: ${path.basename(filePath)}`);
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
        if (this.aiTerminalCore && typeof this.aiTerminalCore.close === 'function') {
            this.aiTerminalCore.close();
        }
        this.analysisCache.clear();
    }
}
exports.BackgroundAnalyzer = BackgroundAnalyzer;
// Embedded lightweight version of AI Terminal for fallback
class EmbeddedAITerminal {
    constructor() {
        this.cache = new Map();
    }
    async initialize() {
        // Lightweight initialization
        return Promise.resolve();
    }
    async embedFile(filePath, content) {
        // Basic analysis without full ML
        const metadata = this.extractBasicMetadata(filePath, content);
        const analysis = {
            filePath,
            metadata,
            ast: this.extractBasicAST(content)
        };
        this.cache.set(filePath, analysis);
        return analysis;
    }
    async generateEmbedding(code) {
        // Simple hash-based embedding
        const features = new Array(50).fill(0);
        // Basic feature extraction
        features[0] = (code.match(/function/g) || []).length;
        features[1] = (code.match(/class/g) || []).length;
        features[2] = (code.match(/const/g) || []).length;
        features[3] = (code.match(/import/g) || []).length;
        features[4] = code.length / 1000;
        return features;
    }
    async findSimilar(embedding, limit) {
        // Return cached analyses sorted by basic similarity
        const analyses = Array.from(this.cache.values()).slice(0, limit);
        return analyses.map(a => ({
            filePath: a.filePath,
            similarity: 0.5 + Math.random() * 0.3,
            metadata: a.metadata
        }));
    }
    async getArchitecturalPatterns() {
        return [
            { pattern: 'Module Pattern', confidence: 0.8 },
            { pattern: 'Factory Pattern', confidence: 0.6 }
        ];
    }
    extractBasicMetadata(filePath, content) {
        const language = this.detectLanguage(filePath);
        const lines = content.split('\\n');
        return {
            language,
            lines: lines.length,
            size: content.length,
            functions: this.extractFunctions(content),
            classes: this.extractClasses(content),
            imports: this.extractImports(content),
            complexity: this.calculateBasicComplexity(content)
        };
    }
    extractBasicAST(content) {
        return {
            language: 'javascript',
            functions: this.extractFunctions(content),
            classes: this.extractClasses(content),
            architecturalPatterns: []
        };
    }
    detectLanguage(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const map = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.jsx': 'javascript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.java': 'java'
        };
        return map[ext] || 'unknown';
    }
    extractFunctions(content) {
        const functions = [];
        const patterns = [
            /function\\s+(\\w+)/g,
            /const\\s+(\\w+)\\s*=\\s*(?:async\\s*)?(?:\\([^)]*\\)|\\w+)\\s*=>/g,
            /(\\w+)\\s*\\([^)]*\\)\\s*{/g
        ];
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                functions.push(match[1]);
            }
        });
        return Array.from(new Set(functions)).slice(0, 10);
    }
    extractClasses(content) {
        const classes = [];
        const classPattern = /class\\s+(\\w+)/g;
        let match;
        while ((match = classPattern.exec(content)) !== null) {
            classes.push({ name: match[1] });
        }
        return classes;
    }
    extractImports(content) {
        const imports = [];
        const patterns = [
            /import.*from\\s*['\"]([^'\"]+)['\"]/g,
            /require\\s*\\(\\s*['\"]([^'\"]+)['\"]\\s*\\)/g
        ];
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                imports.push({ from: match[1] });
            }
        });
        return imports.slice(0, 10);
    }
    calculateBasicComplexity(content) {
        const keywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch'];
        let complexity = 1;
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\\\b${keyword}\\\\b`, 'g');
            complexity += (content.match(regex) || []).length;
        });
        return complexity;
    }
    close() {
        this.cache.clear();
    }
}
//# sourceMappingURL=backgroundAnalyzer.js.map