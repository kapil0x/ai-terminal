const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const os = require('os');
const ASTAnalyzer = require('./ast-analyzer');

class CodeEmbeddings {
  constructor() {
    this.model = null;
    this.dbPath = path.join(os.homedir(), '.ai-terminal-embeddings.db');
    this.db = null;
    this.astAnalyzer = new ASTAnalyzer();
  }

  async initialize() {
    console.log('Initializing advanced embedding system...');
    
    try {
      // Try multiple embedding approaches for reliability
      await this.initializeEmbeddingModel();
      await this.initializeDatabase();
      
      console.log('✅ Advanced embedding system initialized successfully');
    } catch (error) {
      console.log('⚠️  Advanced embeddings unavailable, using fallback system');
      await this.initializeFallbackSystem();
    }
  }

  async initializeEmbeddingModel() {
    try {
      // Dynamically import transformers to handle ES module
      const { pipeline } = await import('@xenova/transformers');
      
      // Try CodeT5 first
      this.model = await pipeline('feature-extraction', 'Salesforce/codet5-base', {
        device: 'cpu',
        dtype: 'fp32',
        cache_dir: path.join(os.homedir(), '.ai-terminal-models'),
        local_files_only: false
      });
      this.modelType = 'codet5';
    } catch (codeT5Error) {
      console.log('CodeT5 unavailable, trying alternative models...');
      
      try {
        // Dynamically import transformers for fallback
        const { pipeline } = await import('@xenova/transformers');
        
        // Fallback to a smaller, more reliable model
        this.model = await pipeline('feature-extraction', 'sentence-transformers/all-MiniLM-L6-v2', {
          device: 'cpu',
          dtype: 'fp32',
          cache_dir: path.join(os.homedir(), '.ai-terminal-models')
        });
        this.modelType = 'minilm';
      } catch (miniLMError) {
        // If all models fail, use built-in embedding system
        throw new Error('No embedding models available');
      }
    }
  }

  async initializeDatabase() {
    // Initialize SQLite database
    this.db = new sqlite3.Database(this.dbPath);
    
    // Create enhanced embeddings table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS embeddings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT UNIQUE,
        content_hash TEXT,
        embedding BLOB,
        metadata TEXT,
        model_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        file_size INTEGER,
        language TEXT
      )
    `);

    // Create semantic search index table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS code_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_type TEXT,
        pattern_content TEXT,
        file_paths TEXT,
        frequency INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create AST data table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS ast_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT UNIQUE,
        content_hash TEXT,
        ast_json TEXT,
        architectural_patterns TEXT,
        code_metrics TEXT,
        relationships TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create code relationships table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS code_relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_file TEXT,
        target_file TEXT,
        relationship_type TEXT,
        strength REAL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async initializeFallbackSystem() {
    // Custom embedding system using TF-IDF and code structure analysis
    this.model = null;
    this.modelType = 'custom';
    await this.initializeDatabase();
    console.log('✅ Custom embedding system ready');
  }

  async generateEmbedding(code) {
    if (this.modelType === 'custom') {
      return this.generateCustomEmbedding(code);
    }

    if (!this.model) {
      throw new Error('Model not initialized. Call initialize() first.');
    }
    
    // Generate embedding using available model
    const output = await this.model(code, { 
      pooling: 'mean',
      normalize: true 
    });
    
    return Array.from(output.data);
  }

  generateCustomEmbedding(code) {
    // Advanced custom embedding using multiple techniques
    const features = this.extractCodeFeatures(code);
    const textFeatures = this.extractTextFeatures(code);
    const structureFeatures = this.extractStructureFeatures(code);
    
    // Combine all feature vectors
    return [...features, ...textFeatures, ...structureFeatures];
  }

  extractCodeFeatures(code) {
    // Extract code-specific features
    const features = new Array(50).fill(0);
    
    // Language constructs
    features[0] = (code.match(/function\s+\w+/g) || []).length;
    features[1] = (code.match(/class\s+\w+/g) || []).length;
    features[2] = (code.match(/const\s+\w+/g) || []).length;
    features[3] = (code.match(/let\s+\w+/g) || []).length;
    features[4] = (code.match(/var\s+\w+/g) || []).length;
    features[5] = (code.match(/if\s*\(/g) || []).length;
    features[6] = (code.match(/for\s*\(/g) || []).length;
    features[7] = (code.match(/while\s*\(/g) || []).length;
    features[8] = (code.match(/try\s*{/g) || []).length;
    features[9] = (code.match(/catch\s*\(/g) || []).length;
    
    // API patterns
    features[10] = (code.match(/require\s*\(/g) || []).length;
    features[11] = (code.match(/import\s+/g) || []).length;
    features[12] = (code.match(/export\s+/g) || []).length;
    features[13] = (code.match(/async\s+/g) || []).length;
    features[14] = (code.match(/await\s+/g) || []).length;
    
    // Error handling
    features[15] = (code.match(/throw\s+/g) || []).length;
    features[16] = (code.match(/console\.log/g) || []).length;
    features[17] = (code.match(/console\.error/g) || []).length;
    
    // Common libraries (normalized by frequency)
    const totalLines = code.split('\n').length;
    features[18] = features[0] / totalLines; // function density
    features[19] = features[1] / totalLines; // class density
    
    return features;
  }

  extractTextFeatures(code) {
    // TF-IDF style features for code text
    const words = code.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
    
    const features = new Array(100).fill(0);
    const commonCodeWords = [
      'function', 'return', 'const', 'let', 'var', 'if', 'else', 'for', 'while',
      'try', 'catch', 'throw', 'async', 'await', 'class', 'extends', 'constructor',
      'require', 'import', 'export', 'module', 'error', 'data', 'result', 'response'
    ];
    
    commonCodeWords.forEach((word, index) => {
      if (index < 100) {
        features[index] = words.filter(w => w === word).length / words.length;
      }
    });
    
    return features;
  }

  extractStructureFeatures(code) {
    // Code structure analysis
    const features = new Array(30).fill(0);
    const lines = code.split('\n');
    
    features[0] = lines.length;
    features[1] = code.length;
    features[2] = lines.filter(line => line.trim().length === 0).length / lines.length; // empty line ratio
    features[3] = lines.filter(line => line.trim().startsWith('//')).length / lines.length; // comment ratio
    
    // Indentation analysis
    let totalIndent = 0;
    let indentedLines = 0;
    lines.forEach(line => {
      const indent = line.match(/^\s*/)[0].length;
      if (indent > 0) {
        totalIndent += indent;
        indentedLines++;
      }
    });
    features[4] = indentedLines > 0 ? totalIndent / indentedLines : 0; // average indentation
    
    // Complexity indicators
    features[5] = (code.match(/\{/g) || []).length; // brace count
    features[6] = (code.match(/\(/g) || []).length; // paren count
    features[7] = (code.match(/\[/g) || []).length; // bracket count
    
    return features;
  }

  async embedFile(filePath, content) {
    const contentHash = this.generateHash(content);
    
    // Check if already embedded with same hash
    const existing = await this.getEmbedding(filePath);
    if (existing && existing.content_hash === contentHash) {
      return existing;
    }
    
    // Truncate content for embedding (handle large files)
    const truncatedContent = content.slice(0, 4000);
    
    const embedding = await this.generateEmbedding(truncatedContent);
    const metadata = this.extractEnhancedMetadata(filePath, content);
    
    // NEW: Generate AST analysis
    let astData = null;
    try {
      astData = await this.astAnalyzer.analyzeFile(filePath, content);
      
      // Store AST data in separate table
      await this.storeASTData(filePath, contentHash, astData);
      
      // Extract relationships from AST
      await this.extractAndStoreRelationships(filePath, astData);
      
      // Enhance metadata with AST insights
      metadata.ast = {
        hasAST: true,
        architecturalPatterns: astData.architecturalPatterns || [],
        codeMetrics: astData.codeMetrics || {},
        classCount: astData.classes ? astData.classes.length : 0,
        functionCount: astData.functions ? astData.functions.length : 0,
        interfaceCount: astData.interfaces ? astData.interfaces.length : 0
      };
      
    } catch (astError) {
      console.log(`AST analysis failed for ${filePath}: ${astError.message}`);
      metadata.ast = { hasAST: false, error: astError.message };
    }
    
    // Store in database with enhanced information
    await this.storeEmbedding(filePath, contentHash, embedding, metadata);
    
    // Extract and store code patterns
    await this.extractAndStorePatterns(filePath, content);
    
    return { filePath, embedding, metadata, ast: astData };
  }

  extractEnhancedMetadata(filePath, content) {
    const lines = content.split('\n');
    return {
      size: content.length,
      lines: lines.length,
      language: this.detectLanguage(filePath),
      functions: this.extractFunctions(content),
      classes: this.extractClasses(content),
      imports: this.extractImports(content),
      exports: this.extractExports(content),
      errorHandling: this.analyzeErrorHandling(content),
      complexity: this.calculateComplexity(content),
      apiCalls: this.extractAPICalls(content),
      patterns: this.identifyCodePatterns(content),
      security: this.analyzeSecurityPatterns(content)
    };
  }

  extractClasses(content) {
    const classPattern = /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{/g;
    const classes = [];
    let match;
    while ((match = classPattern.exec(content)) !== null) {
      classes.push({
        name: match[1],
        extends: match[2] || null,
        line: content.substring(0, match.index).split('\n').length
      });
    }
    return classes;
  }

  extractImports(content) {
    const imports = [];
    // ES6 imports
    const es6Pattern = /import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = es6Pattern.exec(content)) !== null) {
      imports.push({
        type: 'es6',
        items: match[1] ? match[1].split(',').map(s => s.trim()) : [match[2] || match[3]],
        from: match[4]
      });
    }
    
    // CommonJS requires
    const requirePattern = /(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requirePattern.exec(content)) !== null) {
      imports.push({
        type: 'commonjs',
        items: match[1] ? match[1].split(',').map(s => s.trim()) : [match[2]],
        from: match[3]
      });
    }
    
    return imports;
  }

  extractExports(content) {
    const exports = [];
    // ES6 exports
    const exportPattern = /export\s+(?:default\s+)?(?:function\s+(\w+)|class\s+(\w+)|const\s+(\w+)|let\s+(\w+)|var\s+(\w+)|\{([^}]+)\})/g;
    let match;
    while ((match = exportPattern.exec(content)) !== null) {
      const name = match[1] || match[2] || match[3] || match[4] || match[5];
      if (name) {
        exports.push(name);
      } else if (match[6]) {
        exports.push(...match[6].split(',').map(s => s.trim()));
      }
    }
    
    // CommonJS exports
    const moduleExportPattern = /module\.exports\s*=\s*(\w+)/g;
    while ((match = moduleExportPattern.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    return exports;
  }

  analyzeErrorHandling(content) {
    return {
      tryBlocks: (content.match(/try\s*{/g) || []).length,
      catchBlocks: (content.match(/catch\s*\(/g) || []).length,
      throwStatements: (content.match(/throw\s+/g) || []).length,
      consoleErrors: (content.match(/console\.error/g) || []).length,
      consoleWarns: (content.match(/console\.warn/g) || []).length,
      hasErrorHandling: content.includes('try') && content.includes('catch')
    };
  }

  calculateComplexity(content) {
    // Simplified cyclomatic complexity calculation
    const cyclomaticKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch'];
    let complexity = 1; // base complexity
    
    cyclomaticKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      complexity += (content.match(regex) || []).length;
    });
    
    // Add logical operators separately (they don't need word boundaries)
    complexity += (content.match(/&&/g) || []).length;
    complexity += (content.match(/\|\|/g) || []).length;
    complexity += (content.match(/\?/g) || []).length;
    
    return complexity;
  }

  extractAPICalls(content) {
    const apiCalls = [];
    
    // HTTP methods
    const httpMethods = ['get', 'post', 'put', 'delete', 'patch'];
    httpMethods.forEach(method => {
      const pattern = new RegExp(`\\.${method}\\s*\\(`, 'g');
      const matches = content.match(pattern) || [];
      apiCalls.push(...matches.map(m => ({ type: 'http', method })));
    });
    
    // Axios calls
    const axiosPattern = /axios\.(get|post|put|delete|patch)\s*\(/g;
    let match;
    while ((match = axiosPattern.exec(content)) !== null) {
      apiCalls.push({ type: 'axios', method: match[1] });
    }
    
    // Fetch calls
    const fetchPattern = /fetch\s*\(/g;
    const fetchMatches = content.match(fetchPattern) || [];
    apiCalls.push(...fetchMatches.map(m => ({ type: 'fetch' })));
    
    return apiCalls;
  }

  identifyCodePatterns(content) {
    const patterns = [];
    
    // Design patterns
    if (content.includes('constructor') && content.includes('extends')) {
      patterns.push('inheritance');
    }
    if (content.includes('Promise') || content.includes('async') || content.includes('await')) {
      patterns.push('async');
    }
    if (content.includes('addEventListener') || content.includes('on(')) {
      patterns.push('event-driven');
    }
    if (content.includes('factory') || content.includes('Factory')) {
      patterns.push('factory');
    }
    if (content.includes('Singleton') || content.includes('getInstance')) {
      patterns.push('singleton');
    }
    
    return patterns;
  }

  analyzeSecurityPatterns(content) {
    const security = {
      hasValidation: false,
      hasSanitization: false,
      hasAuthentication: false,
      hasAuthorization: false,
      hasEncryption: false,
      vulnerabilities: []
    };
    
    // Check for validation
    if (content.includes('validate') || content.includes('isValid') || content.includes('check')) {
      security.hasValidation = true;
    }
    
    // Check for sanitization
    if (content.includes('sanitize') || content.includes('escape') || content.includes('clean')) {
      security.hasSanitization = true;
    }
    
    // Check for authentication
    if (content.includes('auth') || content.includes('login') || content.includes('token')) {
      security.hasAuthentication = true;
    }
    
    // Check for authorization
    if (content.includes('permission') || content.includes('role') || content.includes('access')) {
      security.hasAuthorization = true;
    }
    
    // Check for encryption
    if (content.includes('encrypt') || content.includes('hash') || content.includes('crypto')) {
      security.hasEncryption = true;
    }
    
    // Check for potential vulnerabilities
    if (content.includes('eval(')) {
      security.vulnerabilities.push('eval-usage');
    }
    if (content.includes('innerHTML') && !content.includes('sanitize')) {
      security.vulnerabilities.push('xss-risk');
    }
    if (content.includes('SQL') && content.includes('+')) {
      security.vulnerabilities.push('sql-injection-risk');
    }
    
    return security;
  }

  async extractAndStorePatterns(filePath, content) {
    const patterns = this.identifyCodePatterns(content);
    const functions = this.extractFunctions(content);
    const classes = this.extractClasses(content);
    
    // Store common patterns for similarity matching
    for (const pattern of patterns) {
      await this.storePattern(pattern, 'design-pattern', [filePath]);
    }
    
    for (const func of functions) {
      await this.storePattern(func, 'function', [filePath]);
    }
    
    for (const cls of classes) {
      await this.storePattern(cls.name, 'class', [filePath]);
    }
  }

  async storePattern(pattern, type, filePaths) {
    return new Promise((resolve, reject) => {
      // Check if pattern exists and update frequency
      this.db.get(
        'SELECT * FROM code_patterns WHERE pattern_content = ? AND pattern_type = ?',
        [pattern, type],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (row) {
            // Update existing pattern
            const existingPaths = JSON.parse(row.file_paths);
            const updatedPaths = [...new Set([...existingPaths, ...filePaths])];
            
            this.db.run(
              'UPDATE code_patterns SET file_paths = ?, frequency = ? WHERE id = ?',
              [JSON.stringify(updatedPaths), row.frequency + 1, row.id],
              (updateErr) => {
                if (updateErr) reject(updateErr);
                else resolve();
              }
            );
          } else {
            // Insert new pattern
            this.db.run(
              'INSERT INTO code_patterns (pattern_type, pattern_content, file_paths, frequency) VALUES (?, ?, ?, ?)',
              [type, pattern, JSON.stringify(filePaths), 1],
              (insertErr) => {
                if (insertErr) reject(insertErr);
                else resolve();
              }
            );
          }
        }
      );
    });
  }

  async storeASTData(filePath, contentHash, astData) {
    return new Promise((resolve, reject) => {
      const astJson = JSON.stringify(astData);
      const architecturalPatterns = JSON.stringify(astData.architecturalPatterns || []);
      const codeMetrics = JSON.stringify(astData.codeMetrics || {});
      const relationships = JSON.stringify(astData.relationships || {});
      
      this.db.run(
        `INSERT OR REPLACE INTO ast_data 
         (file_path, content_hash, ast_json, architectural_patterns, code_metrics, relationships) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [filePath, contentHash, astJson, architecturalPatterns, codeMetrics, relationships],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async extractAndStoreRelationships(filePath, astData) {
    if (!astData.relationships) return;
    
    const relationships = [];
    
    // Inheritance relationships
    if (astData.classes) {
      astData.classes.forEach(cls => {
        if (cls.extends) {
          relationships.push({
            source: filePath,
            target: cls.extends,
            type: 'inheritance',
            strength: 0.9,
            metadata: { class: cls.name }
          });
        }
        
        if (cls.implements) {
          cls.implements.forEach(impl => {
            relationships.push({
              source: filePath,
              target: impl,
              type: 'implementation',
              strength: 0.8,
              metadata: { class: cls.name }
            });
          });
        }
      });
    }
    
    // Import relationships
    if (astData.imports) {
      astData.imports.forEach(imp => {
        relationships.push({
          source: filePath,
          target: imp.from || imp.module,
          type: 'import',
          strength: 0.6,
          metadata: { items: imp.items }
        });
      });
    }
    
    // Store all relationships
    for (const rel of relationships) {
      await this.storeRelationship(rel);
    }
  }

  async storeRelationship(relationship) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO code_relationships 
         (source_file, target_file, relationship_type, strength, metadata) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          relationship.source,
          relationship.target,
          relationship.type,
          relationship.strength,
          JSON.stringify(relationship.metadata)
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async getASTData(filePath) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM ast_data WHERE file_path = ?',
        [filePath],
        (err, row) => {
          if (err) reject(err);
          else if (row) {
            resolve({
              ...row,
              ast_json: JSON.parse(row.ast_json),
              architectural_patterns: JSON.parse(row.architectural_patterns),
              code_metrics: JSON.parse(row.code_metrics),
              relationships: JSON.parse(row.relationships)
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  async findRelatedFiles(filePath, relationshipTypes = ['inheritance', 'import', 'implementation']) {
    return new Promise((resolve, reject) => {
      const typeParams = relationshipTypes.map(() => '?').join(',');
      this.db.all(
        `SELECT * FROM code_relationships 
         WHERE (source_file = ? OR target_file = ?) 
         AND relationship_type IN (${typeParams})
         ORDER BY strength DESC`,
        [filePath, filePath, ...relationshipTypes],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          const related = rows.map(row => ({
            file: row.source_file === filePath ? row.target_file : row.source_file,
            relationship: row.relationship_type,
            strength: row.strength,
            metadata: JSON.parse(row.metadata),
            direction: row.source_file === filePath ? 'outgoing' : 'incoming'
          }));
          
          resolve(related);
        }
      );
    });
  }

  async storeEmbedding(filePath, contentHash, embedding, metadata) {
    return new Promise((resolve, reject) => {
      const embeddingBlob = Buffer.from(JSON.stringify(embedding));
      const metadataJson = JSON.stringify(metadata);
      
      this.db.run(
        `INSERT OR REPLACE INTO embeddings 
         (file_path, content_hash, embedding, metadata, model_type, file_size, language) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [filePath, contentHash, embeddingBlob, metadataJson, this.modelType, metadata.size, metadata.language],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async getEmbedding(filePath) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM embeddings WHERE file_path = ?',
        [filePath],
        (err, row) => {
          if (err) reject(err);
          else if (row) {
            resolve({
              ...row,
              embedding: JSON.parse(row.embedding.toString()),
              metadata: JSON.parse(row.metadata)
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  async findSimilar(queryEmbedding, limit = 5, options = {}) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT file_path, embedding, metadata, language, file_size FROM embeddings',
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          const similarities = rows.map(row => {
            const embedding = JSON.parse(row.embedding.toString());
            const metadata = JSON.parse(row.metadata);
            let similarity = this.cosineSimilarity(queryEmbedding, embedding);
            
            // Boost similarity based on metadata relevance
            if (options.language && row.language === options.language) {
              similarity += 0.1; // Boost same language files
            }
            
            if (options.patterns) {
              const commonPatterns = options.patterns.filter(p => 
                metadata.patterns && metadata.patterns.includes(p)
              );
              similarity += commonPatterns.length * 0.05; // Boost pattern matches
            }
            
            if (options.functions) {
              const commonFunctions = options.functions.filter(f =>
                metadata.functions && metadata.functions.includes(f)
              );
              similarity += commonFunctions.length * 0.03; // Boost function matches
            }
            
            return {
              filePath: row.file_path,
              similarity: Math.min(similarity, 1.0), // Cap at 1.0
              metadata,
              language: row.language,
              fileSize: row.file_size
            };
          });
          
          // Sort by similarity and return top results
          similarities.sort((a, b) => b.similarity - a.similarity);
          resolve(similarities.slice(0, limit));
        }
      );
    });
  }

  async findSimilarPatterns(patternType, patternContent, limit = 5) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM code_patterns WHERE pattern_type = ? AND pattern_content LIKE ? ORDER BY frequency DESC LIMIT ?',
        [patternType, `%${patternContent}%`, limit],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          const results = rows.map(row => ({
            type: row.pattern_type,
            content: row.pattern_content,
            files: JSON.parse(row.file_paths),
            frequency: row.frequency,
            createdAt: row.created_at
          }));
          
          resolve(results);
        }
      );
    });
  }

  async getCodebaseStats() {
    return new Promise((resolve, reject) => {
      const stats = {};
      
      // Get basic embedding stats
      this.db.get(
        'SELECT COUNT(*) as total, SUM(file_size) as totalSize FROM embeddings',
        [],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          stats.totalFiles = row.total;
          stats.totalSize = row.totalSize;
          
          // Get language distribution
          this.db.all(
            'SELECT language, COUNT(*) as count FROM embeddings GROUP BY language',
            [],
            (langErr, langRows) => {
              if (langErr) {
                reject(langErr);
                return;
              }
              
              stats.languages = langRows.reduce((acc, row) => {
                acc[row.language] = row.count;
                return acc;
              }, {});
              
              // Get pattern stats
              this.db.all(
                'SELECT pattern_type, COUNT(*) as count FROM code_patterns GROUP BY pattern_type',
                [],
                (patErr, patRows) => {
                  if (patErr) {
                    reject(patErr);
                    return;
                  }
                  
                  stats.patterns = patRows.reduce((acc, row) => {
                    acc[row.pattern_type] = row.count;
                    return acc;
                  }, {});
                  
                  resolve(stats);
                }
              );
            }
          );
        }
      );
    });
  }

  async getArchitecturalPatterns() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT architectural_patterns FROM ast_data WHERE architectural_patterns != "[]"',
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          const allPatterns = [];
          rows.forEach(row => {
            try {
              const patterns = JSON.parse(row.architectural_patterns);
              allPatterns.push(...patterns);
            } catch (e) {
              // Skip malformed data
            }
          });
          
          resolve(allPatterns);
        }
      );
    });
  }

  async getRelationshipGraph() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM code_relationships ORDER BY strength DESC',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  generateHash(content) {
    // Simple hash function for content
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const langMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.hpp': 'cpp',
      '.h': 'c',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby'
    };
    return langMap[ext] || 'unknown';
  }

  extractFunctions(content) {
    // Simple function extraction (can be improved)
    const functionPatterns = [
      /function\s+(\w+)/g,           // JavaScript functions
      /def\s+(\w+)/g,               // Python functions
      /class\s+(\w+)/g,             // Classes
      /(\w+)\s*\([^)]*\)\s*{/g      // C-style functions
    ];
    
    const functions = [];
    functionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        functions.push(match[1]);
      }
    });
    
    return functions.slice(0, 10); // Limit to 10 functions
  }

  async close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = CodeEmbeddings;