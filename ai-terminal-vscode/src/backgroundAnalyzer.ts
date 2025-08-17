import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Import types from the main AI Terminal package
interface FileAnalysis {
    filePath: string;
    embedding?: number[];
    metadata?: any;
    ast?: any;
}

export class BackgroundAnalyzer {
    private workspacePath: string;
    private outputChannel: vscode.OutputChannel;
    private aiTerminalCore: any;
    private isInitialized = false;
    private analysisCache = new Map<string, FileAnalysis>();
    private disposables: vscode.Disposable[] = [];
    
    constructor(workspacePath: string, outputChannel: vscode.OutputChannel) {
        this.workspacePath = workspacePath;
        this.outputChannel = outputChannel;
    }
    
    async start(): Promise<void> {
        try {
            this.outputChannel.appendLine('🚀 Starting AI Terminal background analysis...');
            
            // Initialize AI Terminal core (import from parent directory)
            await this.initializeAITerminalCore();
            
            // Build initial embeddings for the workspace
            await this.buildInitialEmbeddings();
            
            this.isInitialized = true;
            this.outputChannel.appendLine('✅ Background analysis initialized');
            
        } catch (error) {
            this.outputChannel.appendLine(`❌ Failed to initialize background analysis: ${error}`);
            vscode.window.showErrorMessage(`AI Terminal initialization failed: ${error}`);
        }
    }
    
    private async initializeAITerminalCore(): Promise<void> {
        try {
            // Import the CodeEmbeddings class from the parent directory
            const parentDir = path.resolve(__dirname, '../../');
            const embeddingsPath = path.join(parentDir, 'embeddings.js');
            
            if (fs.existsSync(embeddingsPath)) {
                // Dynamically import the CodeEmbeddings class
                const { default: CodeEmbeddings } = await import(embeddingsPath);
                this.aiTerminalCore = new CodeEmbeddings();
                await this.aiTerminalCore.initialize();
                this.outputChannel.appendLine('✅ AI Terminal core initialized');
            } else {
                // Fallback: Use embedded lightweight version
                this.aiTerminalCore = new EmbeddedAITerminal();
                await this.aiTerminalCore.initialize();
                this.outputChannel.appendLine('✅ Embedded AI Terminal initialized');
            }
            
        } catch (error) {
            this.outputChannel.appendLine(`⚠️ Core initialization failed, using fallback: ${error}`);
            this.aiTerminalCore = new EmbeddedAITerminal();
            await this.aiTerminalCore.initialize();
        }
    }
    
    private async buildInitialEmbeddings(): Promise<void> {
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
                    } catch (error) {
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
            
        } catch (error) {
            this.outputChannel.appendLine(`❌ Embedding build failed: ${error}`);
        }
    }
    
    private async findCodeFiles(directory: string): Promise<string[]> {
        const files: string[] = [];
        const extensions = new Set(['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.go', '.rs']);
        
        // Also scan parent directory if we're in ai-terminal-vscode subdirectory
        const directoriesToScan = [directory];
        this.outputChannel.appendLine(`📁 Primary directory: ${directory}`);
        this.outputChannel.appendLine(`📁 Directory basename: ${path.basename(directory)}`);
        
        if (path.basename(directory) === 'ai-terminal-vscode') {
            const parentDir = path.resolve(directory, '..');
            directoriesToScan.push(parentDir);
            this.outputChannel.appendLine(`📁 Also scanning parent directory: ${parentDir}`);
        }
        
        const scanDirectory = (dir: string) => {
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
                    } else if (stat.isFile()) {
                        const ext = path.extname(fullPath).toLowerCase();
                        if (extensions.has(ext)) {
                            files.push(fullPath);
                        }
                    }
                }
            } catch (error) {
                // Skip directories that can't be read
            }
        };
        
        // Scan all directories
        directoriesToScan.forEach(dir => {
            this.outputChannel.appendLine(`🔍 Scanning directory: ${dir}`);
            scanDirectory(dir);
        });
        
        this.outputChannel.appendLine(`📋 Found ${files.length} total files`);
        files.forEach(file => {
            this.outputChannel.appendLine(`   - ${file}`);
        });
        
        return files.slice(0, 200); // Limit to 200 files for initial version
    }
    
    async analyzeFile(filePath: string, content: string): Promise<FileAnalysis | null> {
        if (!this.isInitialized || !this.aiTerminalCore) {
            return null;
        }
        
        try {
            const analysis = await this.aiTerminalCore.embedFile(filePath, content);
            this.analysisCache.set(filePath, analysis);
            return analysis;
        } catch (error) {
            this.outputChannel.appendLine(`Analysis error for ${filePath}: ${error}`);
            return null;
        }
    }
    
    async getFileAnalysis(filePath: string): Promise<FileAnalysis | null> {
        // Return cached analysis if available
        if (this.analysisCache.has(filePath)) {
            return this.analysisCache.get(filePath) || null;
        }
        
        // If not cached, analyze the current file
        if (fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                return await this.analyzeFile(filePath, content);
            } catch (error) {
                this.outputChannel.appendLine(`Failed to read file ${filePath}: ${error}`);
            }
        }
        
        return null;
    }
    
    async findSimilarCode(code: string, limit: number = 5): Promise<any[]> {
        if (!this.isInitialized || !this.aiTerminalCore) {
            return [];
        }
        
        try {
            const embedding = await this.aiTerminalCore.generateEmbedding(code);
            const similar = await this.aiTerminalCore.findSimilar(embedding, limit);
            return similar;
        } catch (error) {
            this.outputChannel.appendLine(`Similarity search error: ${error}`);
            return [];
        }
    }
    
    async getArchitecturalPatterns(): Promise<any[]> {
        if (!this.isInitialized || !this.aiTerminalCore) {
            // Fallback: analyze our own cache directly
            return this.detectPatternsFromCache();
        }
        
        try {
            const patterns = await this.aiTerminalCore.getArchitecturalPatterns();
            
            // If embedded analyzer returns empty, try our own cache
            if (patterns.length === 0) {
                return this.detectPatternsFromCache();
            }
            
            return patterns;
        } catch (error) {
            this.outputChannel.appendLine(`Pattern retrieval error: ${error}`);
            return this.detectPatternsFromCache();
        }
    }
    
    private detectPatternsFromCache(): any[] {
        const patterns: any[] = [];
        const allAnalyses = Array.from(this.analysisCache.values());
        
        this.outputChannel.appendLine(`🔍 Analyzing ${allAnalyses.length} cached files for patterns...`);
        
        if (allAnalyses.length === 0) {
            return [];
        }
        
        // Count pattern occurrences across all files
        let classCount = 0;
        let factoryCount = 0;
        let singletonCount = 0;
        let moduleCount = 0;
        let observerCount = 0;
        let asyncCount = 0;
        
        allAnalyses.forEach((analysis: any) => {
            this.outputChannel.appendLine(`📄 Analyzing file: ${analysis.filePath || 'unknown'}`);
            this.outputChannel.appendLine(`   Metadata: ${analysis.metadata ? 'exists' : 'missing'}`);
            
            if (analysis.metadata) {
                this.outputChannel.appendLine(`   Classes: ${analysis.metadata.classes?.length || 0}`);
                this.outputChannel.appendLine(`   Functions: ${analysis.metadata.functions?.length || 0}`);
                this.outputChannel.appendLine(`   Imports: ${analysis.metadata.imports?.length || 0}`);
                
                classCount += analysis.metadata.classes?.length || 0;
                
                // Detect Factory pattern
                const factoryClasses = analysis.metadata.classes?.filter((cls: any) => 
                    cls.name.includes('Factory') || cls.name.includes('Creator')
                ) || [];
                factoryCount += factoryClasses.length;
                
                // Detect Singleton pattern
                const singletonMethods = analysis.metadata.functions?.filter((fn: string) =>
                    fn.includes('getInstance') || fn.includes('instance')
                ) || [];
                singletonCount += singletonMethods.length;
                
                // Detect Module pattern
                moduleCount += analysis.metadata.imports?.length || 0;
                
                // Detect Observer pattern
                const observerMethods = analysis.metadata.functions?.filter((fn: string) =>
                    fn.includes('addEventListener') || fn.includes('on') || fn.includes('emit')
                ) || [];
                observerCount += observerMethods.length;
                
                // Detect Async pattern
                const asyncMethods = analysis.metadata.functions?.filter((fn: string) =>
                    fn.includes('async') || fn.includes('await')
                ) || [];
                asyncCount += asyncMethods.length;
            }
        });
        
        this.outputChannel.appendLine(`📊 Pattern analysis: classes=${classCount}, factory=${factoryCount}, singleton=${singletonCount}, modules=${moduleCount}, observer=${observerCount}, async=${asyncCount}`);
        
        // Add patterns based on actual detection
        if (factoryCount > 0) {
            patterns.push({
                pattern: 'Factory Pattern',
                confidence: Math.min(0.9, factoryCount / allAnalyses.length),
                evidence: `${factoryCount} factory classes detected`
            });
        }
        
        if (singletonCount > 0) {
            patterns.push({
                pattern: 'Singleton Pattern',
                confidence: Math.min(0.9, singletonCount / allAnalyses.length),
                evidence: `${singletonCount} getInstance methods detected`
            });
        }
        
        if (moduleCount > allAnalyses.length) {
            patterns.push({
                pattern: 'Module Pattern',
                confidence: 0.8,
                evidence: `${moduleCount} imports across ${allAnalyses.length} files`
            });
        }
        
        if (observerCount > 0) {
            patterns.push({
                pattern: 'Observer Pattern',
                confidence: Math.min(0.9, observerCount / allAnalyses.length),
                evidence: `${observerCount} event listener methods detected`
            });
        }
        
        if (asyncCount > allAnalyses.length * 0.3) {
            patterns.push({
                pattern: 'Async Pattern',
                confidence: 0.7,
                evidence: `Heavy async/await usage (${asyncCount} methods)`
            });
        }
        
        if (classCount > allAnalyses.length * 0.5) {
            patterns.push({
                pattern: 'Object-Oriented Architecture',
                confidence: 0.8,
                evidence: `${classCount} classes across ${allAnalyses.length} files`
            });
        }
        
        this.outputChannel.appendLine(`✅ Found ${patterns.length} architectural patterns`);
        return patterns.slice(0, 6); // Limit to 6 most relevant patterns
    }
    
    async rebuildEmbeddings(): Promise<void> {
        this.analysisCache.clear();
        await this.buildInitialEmbeddings();
    }
    
    updateConfiguration(): void {
        const config = vscode.workspace.getConfiguration('aiTerminal');
        const enabled = config.get<boolean>('enableBackgroundAnalysis', true);
        
        if (!enabled && this.isInitialized) {
            this.outputChannel.appendLine('🔇 Background analysis disabled');
        } else if (enabled && !this.isInitialized) {
            this.start();
        }
    }
    
    // File change handlers
    onFileChanged(filePath: string): void {
        if (this.analysisCache.has(filePath)) {
            // Remove from cache, will be re-analyzed on next request
            this.analysisCache.delete(filePath);
            this.outputChannel.appendLine(`📝 File changed: ${path.basename(filePath)}`);
        }
    }
    
    onFileCreated(filePath: string): void {
        // File will be analyzed when first requested
        this.outputChannel.appendLine(`📄 New file: ${path.basename(filePath)}`);
    }
    
    onFileDeleted(filePath: string): void {
        this.analysisCache.delete(filePath);
        this.outputChannel.appendLine(`🗑️ File deleted: ${path.basename(filePath)}`);
    }
    
    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        if (this.aiTerminalCore && typeof this.aiTerminalCore.close === 'function') {
            this.aiTerminalCore.close();
        }
        this.analysisCache.clear();
    }
}

// Embedded lightweight version of AI Terminal for fallback
class EmbeddedAITerminal {
    private cache = new Map<string, any>();
    
    async initialize(): Promise<void> {
        // Lightweight initialization
        return Promise.resolve();
    }
    
    async embedFile(filePath: string, content: string): Promise<FileAnalysis> {
        // Basic analysis without full ML
        const metadata = this.extractBasicMetadata(filePath, content);
        const analysis: FileAnalysis = {
            filePath,
            metadata,
            ast: this.extractBasicAST(content)
        };
        
        this.cache.set(filePath, analysis);
        return analysis;
    }
    
    async generateEmbedding(code: string): Promise<number[]> {
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
    
    async findSimilar(embedding: number[], limit: number): Promise<any[]> {
        // Return cached analyses sorted by basic similarity
        const analyses = Array.from(this.cache.values()).slice(0, limit);
        return analyses.map(a => ({
            filePath: a.filePath,
            similarity: 0.5 + Math.random() * 0.3, // Mock similarity
            metadata: a.metadata
        }));
    }
    
    async getArchitecturalPatterns(): Promise<any[]> {
        // For embedded AI Terminal, always use real pattern detection
        return this.detectRealArchitecturalPatterns();
    }
    
    private detectRealArchitecturalPatterns(): any[] {
        const patterns: any[] = [];
        const allAnalyses = Array.from(this.cache.values());
        
        if (allAnalyses.length === 0) {
            return []; // No patterns detected yet
        }
        
        // Count pattern occurrences across all files
        let classCount = 0;
        let factoryCount = 0;
        let singletonCount = 0;
        let moduleCount = 0;
        let observerCount = 0;
        let asyncCount = 0;
        
        allAnalyses.forEach((analysis: any) => {
            if (analysis.metadata) {
                classCount += analysis.metadata.classes?.length || 0;
                
                // Detect Factory pattern
                const factoryClasses = analysis.metadata.classes?.filter((cls: any) => 
                    cls.name.includes('Factory') || cls.name.includes('Creator')
                ) || [];
                factoryCount += factoryClasses.length;
                
                // Detect Singleton pattern
                const singletonMethods = analysis.metadata.functions?.filter((fn: string) =>
                    fn.includes('getInstance') || fn.includes('instance')
                ) || [];
                singletonCount += singletonMethods.length;
                
                // Detect Module pattern
                moduleCount += analysis.metadata.imports?.length || 0;
                
                // Detect Observer pattern
                const observerMethods = analysis.metadata.functions?.filter((fn: string) =>
                    fn.includes('addEventListener') || fn.includes('on') || fn.includes('emit')
                ) || [];
                observerCount += observerMethods.length;
                
                // Detect Async pattern
                const asyncMethods = analysis.metadata.functions?.filter((fn: string) =>
                    fn.includes('async') || fn.includes('await')
                ) || [];
                asyncCount += asyncMethods.length;
            }
        });
        
        // Add patterns based on actual detection
        if (factoryCount > 0) {
            patterns.push({
                pattern: 'Factory Pattern',
                confidence: Math.min(0.9, factoryCount / allAnalyses.length),
                evidence: `${factoryCount} factory classes detected`
            });
        }
        
        if (singletonCount > 0) {
            patterns.push({
                pattern: 'Singleton Pattern', 
                confidence: Math.min(0.9, singletonCount / allAnalyses.length),
                evidence: `${singletonCount} getInstance methods detected`
            });
        }
        
        if (moduleCount > allAnalyses.length) {
            patterns.push({
                pattern: 'Module Pattern',
                confidence: 0.8,
                evidence: `${moduleCount} imports across ${allAnalyses.length} files`
            });
        }
        
        if (observerCount > 0) {
            patterns.push({
                pattern: 'Observer Pattern',
                confidence: Math.min(0.9, observerCount / allAnalyses.length),
                evidence: `${observerCount} event listener methods detected`
            });
        }
        
        if (asyncCount > allAnalyses.length * 0.3) {
            patterns.push({
                pattern: 'Async Pattern',
                confidence: 0.7,
                evidence: `Heavy async/await usage (${asyncCount} methods)`
            });
        }
        
        if (classCount > allAnalyses.length * 0.5) {
            patterns.push({
                pattern: 'Object-Oriented Architecture',
                confidence: 0.8,
                evidence: `${classCount} classes across ${allAnalyses.length} files`
            });
        }
        
        return patterns.slice(0, 6); // Limit to 6 most relevant patterns
    }
    
    private extractBasicMetadata(filePath: string, content: string): any {
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
    
    private extractBasicAST(content: string): any {
        return {
            language: 'javascript', // Default
            functions: this.extractFunctions(content),
            classes: this.extractClasses(content),
            architecturalPatterns: []
        };
    }
    
    private detectLanguage(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        const map: { [key: string]: string } = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.jsx': 'javascript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.java': 'java'
        };
        return map[ext] || 'unknown';
    }
    
    private extractFunctions(content: string): string[] {
        const functions: string[] = [];
        const patterns = [
            // JavaScript/TypeScript patterns
            /function\s+(\w+)/g,
            /const\s+(\w+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|\w+)\s*=>/g,
            /(\w+)\s*\([^)]*\)\s*{/g,
            // C++ patterns
            /(?:void|int|float|double|string|bool|char|auto)\s+(\w+)\s*\([^)]*\)\s*[{;]/g,
            /^\s*(\w+)::(\w+)\s*\(/gm,  // Method definitions
            /template\s*<[^>]*>\s*(?:void|int|float|double|string|bool|char|auto)\s+(\w+)/g
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                functions.push(match[1]);
            }
        });
        
        return Array.from(new Set(functions)).slice(0, 10);
    }
    
    private extractClasses(content: string): Array<{ name: string }> {
        const classes: Array<{ name: string }> = [];
        const patterns = [
            /class\s+(\w+)/g,  // JavaScript/TypeScript/C++
            /struct\s+(\w+)/g,  // C++ structs
            /namespace\s+(\w+)/g  // C++ namespaces
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                classes.push({ name: match[1] });
            }
        });
        
        return classes;
    }
    
    private extractImports(content: string): Array<{ from: string }> {
        const imports: Array<{ from: string }> = [];
        const patterns = [
            /import.*from\s*['"]([^'"]+)['"]/g,
            /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
            /#include\s*[<"]([^>"]+)[>"]/g  // C++ includes
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                imports.push({ from: match[1] });
            }
        });
        
        return imports.slice(0, 10);
    }
    
    private calculateBasicComplexity(content: string): number {
        const keywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch'];
        let complexity = 1;
        
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\\\b${keyword}\\\\b`, 'g');
            complexity += (content.match(regex) || []).length;
        });
        
        return complexity;
    }
    
    close(): void {
        this.cache.clear();
    }
}