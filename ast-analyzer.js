const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Advanced AST Analyzer inspired by Context repo
 * Provides deep architectural understanding for AI Terminal
 */
class ASTAnalyzer {
  constructor() {
    this.supportedLanguages = {
      javascript: ['.js', '.jsx', '.mjs'],
      typescript: ['.ts', '.tsx'],
      python: ['.py'],
      cpp: ['.cpp', '.cc', '.cxx', '.c++', '.hpp', '.h'],
      c: ['.c', '.h'],
      java: ['.java'],
      go: ['.go'],
      rust: ['.rs']
    };
    
    this.astCache = new Map();
    this.architecturalPatterns = new Map();
  }

  /**
   * Main entry point - analyze file and return rich AST context
   */
  async analyzeFile(filePath, content) {
    const language = this.detectLanguage(filePath);
    if (!language) {
      throw new Error(`Unsupported file type: ${path.extname(filePath)}`);
    }

    const cacheKey = `${filePath}:${this.getContentHash(content)}`;
    if (this.astCache.has(cacheKey)) {
      return this.astCache.get(cacheKey);
    }

    let astResult;
    switch (language) {
      case 'javascript':
      case 'typescript':
        astResult = await this.analyzeJavaScript(content, filePath, language);
        break;
      case 'python':
        astResult = await this.analyzePython(content, filePath);
        break;
      case 'cpp':
      case 'c':
        astResult = await this.analyzeCppLike(content, filePath, language);
        break;
      case 'java':
        astResult = await this.analyzeJava(content, filePath);
        break;
      default:
        astResult = await this.analyzeGeneric(content, filePath, language);
    }

    // Enhance with architectural patterns
    astResult.architecturalPatterns = this.detectArchitecturalPatterns(astResult);
    astResult.codeMetrics = this.calculateCodeMetrics(astResult);
    astResult.relationships = this.extractRelationships(astResult);

    this.astCache.set(cacheKey, astResult);
    return astResult;
  }

  /**
   * JavaScript/TypeScript AST Analysis using regex patterns
   * More robust than simple text parsing
   */
  async analyzeJavaScript(content, filePath, language) {
    const ast = {
      language,
      filePath,
      timestamp: new Date().toISOString(),
      classes: [],
      functions: [],
      variables: [],
      imports: [],
      exports: [],
      interfaces: [], // TypeScript
      types: [], // TypeScript
      decorators: [],
      asyncPatterns: [],
      errorHandling: [],
      dependencies: []
    };

    // Enhanced class extraction with inheritance and methods
    const classRegex = /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/gs;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const extendsClass = match[2];
      const implementsInterfaces = match[3] ? match[3].split(',').map(s => s.trim()) : [];
      const classBody = match[4];
      
      const classInfo = {
        kind: 'class',
        name: className,
        location: this.getLineNumber(content, match.index),
        extends: extendsClass || null,
        implements: implementsInterfaces,
        attributes: this.extractClassAttributes(match[0]),
        methods: this.extractMethods(classBody),
        properties: this.extractProperties(classBody),
        constructors: this.extractConstructors(classBody),
        accessibility: this.extractAccessibility(classBody)
      };

      ast.classes.push(classInfo);
    }

    // Enhanced function extraction with parameters and return types
    const functionRegex = /(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|\bfunction))\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*{/g;
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1] || match[2];
      const parameters = match[3] ? this.parseParameters(match[3]) : [];
      const returnType = match[4] ? match[4].trim() : null;
      
      const functionInfo = {
        kind: 'function',
        name: functionName,
        location: this.getLineNumber(content, match.index),
        parameters,
        returnType,
        isAsync: match[0].includes('async'),
        isExported: match[0].includes('export'),
        complexity: this.calculateFunctionComplexity(content, match.index)
      };

      ast.functions.push(functionInfo);
    }

    // TypeScript interfaces
    if (language === 'typescript') {
      const interfaceRegex = /(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+([\w,\s]+))?\s*{([^{}]*)}/gs;
      while ((match = interfaceRegex.exec(content)) !== null) {
        ast.interfaces.push({
          kind: 'interface',
          name: match[1],
          location: this.getLineNumber(content, match.index),
          extends: match[2] ? match[2].split(',').map(s => s.trim()) : [],
          properties: this.parseInterfaceProperties(match[3])
        });
      }
    }

    // Enhanced import/export analysis
    ast.imports = this.extractImports(content);
    ast.exports = this.extractExports(content);
    
    // Error handling patterns
    ast.errorHandling = this.extractErrorHandling(content);
    
    // Async patterns
    ast.asyncPatterns = this.extractAsyncPatterns(content);

    return ast;
  }

  /**
   * Python AST Analysis
   */
  async analyzePython(content, filePath) {
    const ast = {
      language: 'python',
      filePath,
      timestamp: new Date().toISOString(),
      classes: [],
      functions: [],
      variables: [],
      imports: [],
      decorators: [],
      comprehensions: [],
      errorHandling: []
    };

    // Python class extraction with inheritance and decorators
    const classRegex = /(?:@[\w.]+\s*\n\s*)*class\s+(\w+)(?:\(([^)]+)\))?\s*:/g;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const inheritance = match[2] ? match[2].split(',').map(s => s.trim()) : [];
      
      ast.classes.push({
        kind: 'class',
        name: className,
        location: this.getLineNumber(content, match.index),
        inherits: inheritance,
        decorators: this.extractPythonDecorators(content, match.index),
        methods: this.extractPythonMethods(content, match.index)
      });
    }

    // Python function extraction
    const functionRegex = /(?:@[\w.]+\s*\n\s*)*def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*([^:]+))?\s*:/g;
    while ((match = functionRegex.exec(content)) !== null) {
      ast.functions.push({
        kind: 'function',
        name: match[1],
        location: this.getLineNumber(content, match.index),
        parameters: this.parsePythonParameters(match[2]),
        returnType: match[3] ? match[3].trim() : null,
        decorators: this.extractPythonDecorators(content, match.index)
      });
    }

    // Python imports
    const importRegex = /(?:from\s+([\w.]+)\s+)?import\s+([\w,\s*]+)/g;
    while ((match = importRegex.exec(content)) !== null) {
      ast.imports.push({
        kind: 'import',
        module: match[1] || null,
        items: match[2].split(',').map(s => s.trim()),
        location: this.getLineNumber(content, match.index)
      });
    }

    return ast;
  }

  /**
   * C/C++ AST Analysis (inspired by Context repo)
   */
  async analyzeCppLike(content, filePath, language) {
    const ast = {
      language,
      filePath,
      timestamp: new Date().toISOString(),
      classes: [],
      functions: [],
      variables: [],
      includes: [],
      namespaces: [],
      templates: [],
      enums: [],
      structs: []
    };

    // C++ class extraction with inheritance and access specifiers
    const classRegex = /(?:template\s*<[^>]*>\s*)?class\s+(\w+)(?:\s*:\s*((?:(?:public|private|protected)\s+\w+(?:\s*,\s*)?)+))?\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/gs;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const inheritance = match[2] ? this.parseCppInheritance(match[2]) : [];
      const classBody = match[3];

      ast.classes.push({
        kind: 'class',
        name: className,
        location: this.getLineNumber(content, match.index),
        inheritance,
        attributes: this.extractCppAttributes(match[0]),
        methods: this.extractCppMethods(classBody),
        members: this.extractCppMembers(classBody),
        accessSpecifiers: this.extractAccessSpecifiers(classBody)
      });
    }

    // C++ function extraction
    const functionRegex = /(?:(?:inline|static|virtual|constexpr)\s+)*(?:(\w+(?:\s*\*)*)\s+)?(\w+)\s*\(([^)]*)\)(?:\s*(const|noexcept|override|final))?\s*(?:->[\s\w*&]+)?\s*[{;]/g;
    while ((match = functionRegex.exec(content)) !== null) {
      const returnType = match[1] || 'void';
      const functionName = match[2];
      const parameters = match[3];
      const modifiers = match[4] || '';

      ast.functions.push({
        kind: 'function',
        name: functionName,
        location: this.getLineNumber(content, match.index),
        returnType: returnType.trim(),
        parameters: this.parseCppParameters(parameters),
        modifiers: modifiers ? [modifiers] : [],
        attributes: this.extractCppFunctionAttributes(match[0])
      });
    }

    // Include statements
    const includeRegex = /#include\s*[<""]([^>"]+)[>""]/g;
    while ((match = includeRegex.exec(content)) !== null) {
      ast.includes.push({
        kind: 'include',
        file: match[1],
        location: this.getLineNumber(content, match.index),
        isSystemHeader: match[0].includes('<')
      });
    }

    return ast;
  }

  /**
   * Java AST Analysis
   */
  async analyzeJava(content, filePath) {
    const ast = {
      language: 'java',
      filePath,
      timestamp: new Date().toISOString(),
      classes: [],
      interfaces: [],
      functions: [],
      variables: [],
      imports: [],
      annotations: [],
      packages: []
    };

    // Java package declaration
    const packageMatch = content.match(/package\s+([\w.]+);/);
    if (packageMatch) {
      ast.packages.push({
        kind: 'package',
        name: packageMatch[1],
        location: this.getLineNumber(content, packageMatch.index)
      });
    }

    // Java class extraction
    const classRegex = /(?:@\w+\s*)*(?:(public|private|protected)\s+)?(?:(abstract|final)\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/gs;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      ast.classes.push({
        kind: 'class',
        name: match[3],
        location: this.getLineNumber(content, match.index),
        visibility: match[1] || 'package-private',
        modifiers: match[2] ? [match[2]] : [],
        extends: match[4] || null,
        implements: match[5] ? match[5].split(',').map(s => s.trim()) : [],
        methods: this.extractJavaMethods(match[6]),
        fields: this.extractJavaFields(match[6])
      });
    }

    return ast;
  }

  /**
   * Generic AST analysis for unsupported languages
   */
  async analyzeGeneric(content, filePath, language) {
    return {
      language,
      filePath,
      timestamp: new Date().toISOString(),
      functions: this.extractGenericFunctions(content),
      structures: this.extractGenericStructures(content),
      imports: this.extractGenericImports(content),
      comments: this.extractComments(content),
      complexity: this.calculateGenericComplexity(content)
    };
  }

  /**
   * Detect architectural patterns from AST
   */
  detectArchitecturalPatterns(ast) {
    const patterns = [];

    // Singleton Pattern
    if (this.detectSingletonPattern(ast)) {
      patterns.push({ pattern: 'Singleton', confidence: 0.8, evidence: 'Private constructor with static instance' });
    }

    // Factory Pattern
    if (this.detectFactoryPattern(ast)) {
      patterns.push({ pattern: 'Factory', confidence: 0.7, evidence: 'Create methods returning interface types' });
    }

    // Observer Pattern
    if (this.detectObserverPattern(ast)) {
      patterns.push({ pattern: 'Observer', confidence: 0.75, evidence: 'Event subscription/notification methods' });
    }

    // Strategy Pattern
    if (this.detectStrategyPattern(ast)) {
      patterns.push({ pattern: 'Strategy', confidence: 0.6, evidence: 'Interface with multiple implementations' });
    }

    // MVC Pattern
    if (this.detectMVCPattern(ast)) {
      patterns.push({ pattern: 'MVC', confidence: 0.65, evidence: 'Controller, Model, View separation' });
    }

    return patterns;
  }

  /**
   * Calculate comprehensive code metrics
   */
  calculateCodeMetrics(ast) {
    return {
      cyclomaticComplexity: this.calculateCyclomaticComplexity(ast),
      cohesion: this.calculateCohesion(ast),
      coupling: this.calculateCoupling(ast),
      inheritance: this.calculateInheritanceMetrics(ast),
      maintainabilityIndex: this.calculateMaintainabilityIndex(ast),
      technicalDebt: this.estimateTechnicalDebt(ast)
    };
  }

  /**
   * Extract code relationships and dependencies
   */
  extractRelationships(ast) {
    return {
      inheritance: this.buildInheritanceGraph(ast),
      composition: this.detectComposition(ast),
      dependencies: this.analyzeDependencies(ast),
      callGraph: this.buildCallGraph(ast),
      dataFlow: this.analyzeDataFlow(ast)
    };
  }

  // ===================== HELPER METHODS =====================

  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    for (const [language, extensions] of Object.entries(this.supportedLanguages)) {
      if (extensions.includes(ext)) {
        return language;
      }
    }
    return null;
  }

  getContentHash(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  extractMethods(classBody) {
    const methods = [];
    const methodRegex = /(?:(public|private|protected)\s+)?(?:(static|async)\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*{/g;
    let match;
    while ((match = methodRegex.exec(classBody)) !== null) {
      methods.push({
        name: match[3],
        visibility: match[1] || 'public',
        modifiers: match[2] ? [match[2]] : [],
        parameters: this.parseParameters(match[4]),
        returnType: match[5] ? match[5].trim() : null
      });
    }
    return methods;
  }

  extractProperties(classBody) {
    const properties = [];
    const propertyRegex = /(?:(public|private|protected)\s+)?(?:(static|readonly)\s+)?(\w+)(?:\s*:\s*([^=;{]+))?(?:\s*=\s*([^;{]+))?[;{]/g;
    let match;
    while ((match = propertyRegex.exec(classBody)) !== null) {
      properties.push({
        name: match[3],
        visibility: match[1] || 'public',
        modifiers: match[2] ? [match[2]] : [],
        type: match[4] ? match[4].trim() : null,
        defaultValue: match[5] ? match[5].trim() : null
      });
    }
    return properties;
  }

  parseParameters(paramString) {
    if (!paramString || paramString.trim() === '') return [];
    
    return paramString.split(',').map(param => {
      param = param.trim();
      const parts = param.split(':');
      return {
        name: parts[0].trim(),
        type: parts[1] ? parts[1].trim() : null,
        defaultValue: param.includes('=') ? param.split('=')[1].trim() : null
      };
    });
  }

  extractImports(content) {
    const imports = [];
    
    // ES6 imports
    const es6ImportRegex = /import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))(?:\s*,\s*\{([^}]+)\})?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = es6ImportRegex.exec(content)) !== null) {
      imports.push({
        kind: 'import',
        type: 'es6',
        items: match[1] ? match[1].split(',').map(s => s.trim()) : [match[2] || match[3]],
        from: match[5],
        location: this.getLineNumber(content, match.index)
      });
    }
    
    // CommonJS requires
    const requireRegex = /(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push({
        kind: 'import',
        type: 'commonjs',
        items: match[1] ? match[1].split(',').map(s => s.trim()) : [match[2]],
        from: match[3],
        location: this.getLineNumber(content, match.index)
      });
    }
    
    return imports;
  }

  extractExports(content) {
    const exports = [];
    
    // Named exports
    const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push({
        kind: 'export',
        type: 'named',
        name: match[1],
        location: this.getLineNumber(content, match.index)
      });
    }
    
    // Default exports
    const defaultExportRegex = /export\s+default\s+(?:class\s+(\w+)|function\s+(\w+)|(\w+))/g;
    while ((match = defaultExportRegex.exec(content)) !== null) {
      exports.push({
        kind: 'export',
        type: 'default',
        name: match[1] || match[2] || match[3],
        location: this.getLineNumber(content, match.index)
      });
    }
    
    return exports;
  }

  // Pattern detection methods
  detectSingletonPattern(ast) {
    return ast.classes.some(cls => 
      cls.methods.some(method => method.name === 'getInstance' && method.modifiers.includes('static')) &&
      cls.properties.some(prop => prop.modifiers.includes('static') && prop.visibility === 'private')
    );
  }

  detectFactoryPattern(ast) {
    return ast.classes.some(cls =>
      cls.methods.some(method => 
        method.name.toLowerCase().includes('create') || 
        method.name.toLowerCase().includes('factory')
      )
    );
  }

  detectObserverPattern(ast) {
    return ast.classes.some(cls =>
      cls.methods.some(method => 
        method.name.toLowerCase().includes('subscribe') ||
        method.name.toLowerCase().includes('notify') ||
        method.name.toLowerCase().includes('observer')
      )
    );
  }

  detectStrategyPattern(ast) {
    // Look for interfaces with multiple implementations
    return ast.interfaces && ast.interfaces.length > 0 && 
           ast.classes.filter(cls => cls.implements && cls.implements.length > 0).length > 1;
  }

  detectMVCPattern(ast) {
    const hasController = ast.classes.some(cls => cls.name.toLowerCase().includes('controller'));
    const hasModel = ast.classes.some(cls => cls.name.toLowerCase().includes('model'));
    const hasView = ast.classes.some(cls => cls.name.toLowerCase().includes('view'));
    return hasController && hasModel && hasView;
  }

  // Complexity calculations
  calculateCyclomaticComplexity(ast) {
    // Simplified complexity calculation based on AST structure
    let complexity = 1; // Base complexity
    
    ast.functions.forEach(func => {
      complexity += func.complexity || 1;
    });
    
    ast.classes.forEach(cls => {
      cls.methods.forEach(method => {
        complexity += 1; // Each method adds complexity
      });
    });
    
    return complexity;
  }

  calculateFunctionComplexity(content, startIndex) {
    // Find the function body and count complexity indicators
    const functionStart = content.indexOf('{', startIndex);
    if (functionStart === -1) return 1;
    
    let braceCount = 1;
    let endIndex = functionStart + 1;
    
    while (braceCount > 0 && endIndex < content.length) {
      if (content[endIndex] === '{') braceCount++;
      if (content[endIndex] === '}') braceCount--;
      endIndex++;
    }
    
    const functionBody = content.substring(functionStart, endIndex);
    
    // Count complexity indicators
    const complexityIndicators = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||', '?'];
    let complexity = 1;
    
    complexityIndicators.forEach(indicator => {
      const regex = new RegExp(`\\b${indicator}\\b`, 'g');
      const matches = functionBody.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    });
    
    return complexity;
  }

  // Additional helper methods for other languages...
  extractCppMethods(classBody) {
    // Implementation for C++ method extraction
    return [];
  }

  extractJavaMethods(classBody) {
    // Implementation for Java method extraction
    return [];
  }

  // Additional helper methods for comprehensive AST analysis
  
  extractErrorHandling(content) {
    return {
      tryBlocks: (content.match(/try\s*{/g) || []).length,
      catchBlocks: (content.match(/catch\s*\(/g) || []).length,
      throwStatements: (content.match(/throw\s+/g) || []).length,
      errorTypes: this.extractErrorTypes(content),
      hasErrorHandling: content.includes('try') && content.includes('catch')
    };
  }

  extractAsyncPatterns(content) {
    return {
      asyncFunctions: (content.match(/async\s+function/g) || []).length,
      awaitCalls: (content.match(/await\s+/g) || []).length,
      promises: (content.match(/new\s+Promise/g) || []).length,
      promiseChains: (content.match(/\.then\s*\(/g) || []).length,
      hasAsyncAwait: content.includes('async') && content.includes('await')
    };
  }

  extractErrorTypes(content) {
    const errorTypes = [];
    const errorPatterns = [
      /new\s+(\w*Error)\s*\(/g,
      /throw\s+new\s+(\w*Error)\s*\(/g,
      /catch\s*\(\s*(\w+)\s*:/g
    ];
    
    errorPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        errorTypes.push(match[1]);
      }
    });
    
    return [...new Set(errorTypes)];
  }

  extractConstructors(classBody) {
    const constructors = [];
    const constructorRegex = /constructor\s*\(([^)]*)\)\s*{/g;
    let match;
    while ((match = constructorRegex.exec(classBody)) !== null) {
      constructors.push({
        parameters: this.parseParameters(match[1]),
        location: this.getLineNumber(classBody, match.index)
      });
    }
    return constructors;
  }

  extractAccessibility(classBody) {
    return {
      public: (classBody.match(/public\s+\w+/g) || []).length,
      private: (classBody.match(/private\s+\w+/g) || []).length,
      protected: (classBody.match(/protected\s+\w+/g) || []).length,
      static: (classBody.match(/static\s+\w+/g) || []).length
    };
  }

  extractClassAttributes(classDeclaration) {
    const attributes = [];
    if (classDeclaration.includes('abstract')) attributes.push('abstract');
    if (classDeclaration.includes('final')) attributes.push('final');
    if (classDeclaration.includes('export')) attributes.push('exported');
    return attributes;
  }

  parseInterfaceProperties(interfaceBody) {
    const properties = [];
    const propertyRegex = /(\w+)(?:\?)?\s*:\s*([^;,{]+)[;,]/g;
    let match;
    while ((match = propertyRegex.exec(interfaceBody)) !== null) {
      properties.push({
        name: match[1],
        type: match[2].trim(),
        optional: interfaceBody.includes(match[1] + '?')
      });
    }
    return properties;
  }

  extractPythonDecorators(content, startIndex) {
    const decorators = [];
    const lines = content.substring(0, startIndex).split('\n');
    
    // Look backwards for decorators
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('@')) {
        decorators.unshift(line.substring(1));
      } else if (line.length > 0 && !line.startsWith('#')) {
        break;
      }
    }
    
    return decorators;
  }

  extractPythonMethods(content, classStartIndex) {
    const methods = [];
    const methodRegex = /def\s+(\w+)\s*\(([^)]*)\)/g;
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      if (match.index > classStartIndex) {
        methods.push({
          name: match[1],
          parameters: this.parsePythonParameters(match[2]),
          location: this.getLineNumber(content, match.index)
        });
      }
    }
    return methods;
  }

  parsePythonParameters(paramString) {
    if (!paramString.trim()) return [];
    
    return paramString.split(',').map(param => {
      param = param.trim();
      const parts = param.split(':');
      const namePart = parts[0].trim();
      const typePart = parts[1] ? parts[1].trim() : null;
      
      return {
        name: namePart.split('=')[0].trim(),
        type: typePart ? typePart.split('=')[0].trim() : null,
        defaultValue: param.includes('=') ? param.split('=')[1].trim() : null
      };
    });
  }

  parseCppInheritance(inheritanceString) {
    return inheritanceString.split(',').map(inherit => {
      const parts = inherit.trim().split(/\s+/);
      return {
        access: parts[0] || 'private',
        class: parts[1] || parts[0]
      };
    });
  }

  extractCppAttributes(declaration) {
    const attributes = [];
    if (declaration.includes('virtual')) attributes.push('virtual');
    if (declaration.includes('static')) attributes.push('static');
    if (declaration.includes('const')) attributes.push('const');
    if (declaration.includes('inline')) attributes.push('inline');
    if (declaration.includes('template')) attributes.push('template');
    return attributes;
  }

  extractCppFunctionAttributes(declaration) {
    const attributes = [];
    if (declaration.includes('static')) attributes.push('static');
    if (declaration.includes('virtual')) attributes.push('virtual');
    if (declaration.includes('inline')) attributes.push('inline');
    if (declaration.includes('constexpr')) attributes.push('constexpr');
    if (declaration.includes('noexcept')) attributes.push('noexcept');
    if (declaration.includes('override')) attributes.push('override');
    if (declaration.includes('final')) attributes.push('final');
    return attributes;
  }

  extractCppMembers(classBody) {
    const members = [];
    const memberRegex = /(?:(public|private|protected)\s*:)?\s*(?:(static|mutable)\s+)?(\w+(?:\s*\*)*)\s+(\w+)(?:\s*=\s*[^;]+)?;/g;
    let match;
    while ((match = memberRegex.exec(classBody)) !== null) {
      members.push({
        access: match[1] || 'private',
        modifiers: match[2] ? [match[2]] : [],
        type: match[3],
        name: match[4]
      });
    }
    return members;
  }

  parseCppParameters(paramString) {
    if (!paramString.trim()) return [];
    
    return paramString.split(',').map(param => {
      param = param.trim();
      const parts = param.split(/\s+/);
      return {
        type: parts.slice(0, -1).join(' ') || 'void',
        name: parts[parts.length - 1] || 'unnamed'
      };
    });
  }

  extractJavaFields(classBody) {
    const fields = [];
    const fieldRegex = /(?:(public|private|protected)\s+)?(?:(static|final)\s+)?(\w+(?:<[^>]+>)?)\s+(\w+)(?:\s*=\s*[^;]+)?;/g;
    let match;
    while ((match = fieldRegex.exec(classBody)) !== null) {
      fields.push({
        visibility: match[1] || 'package-private',
        modifiers: match[2] ? [match[2]] : [],
        type: match[3],
        name: match[4]
      });
    }
    return fields;
  }

  extractGenericFunctions(content) {
    // Generic function extraction for unsupported languages
    const functions = [];
    const patterns = [
      /function\s+(\w+)/g,
      /def\s+(\w+)/g,
      /(\w+)\s*\(/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        functions.push({
          name: match[1],
          location: this.getLineNumber(content, match.index)
        });
      }
    });
    
    return functions.slice(0, 20); // Limit results
  }

  extractGenericStructures(content) {
    const structures = [];
    const structurePatterns = [
      /class\s+(\w+)/g,
      /struct\s+(\w+)/g,
      /interface\s+(\w+)/g,
      /type\s+(\w+)/g
    ];
    
    structurePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        structures.push({
          type: pattern.source.split('\\')[0],
          name: match[1],
          location: this.getLineNumber(content, match.index)
        });
      }
    });
    
    return structures;
  }

  extractGenericImports(content) {
    const imports = [];
    const importPatterns = [
      /import\s+(.+)/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /#include\s*[<""]([^>"]+)[>""]/g,
      /use\s+(.+);/g
    ];
    
    importPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push({
          module: match[1],
          location: this.getLineNumber(content, match.index)
        });
      }
    });
    
    return imports;
  }

  extractComments(content) {
    const comments = {
      singleLine: (content.match(/\/\/.*$/gm) || []).length,
      multiLine: (content.match(/\/\*[\s\S]*?\*\//g) || []).length,
      docComments: (content.match(/\/\*\*[\s\S]*?\*\//g) || []).length
    };
    
    return comments;
  }

  calculateGenericComplexity(content) {
    const indicators = ['if', 'else', 'for', 'while', 'switch', 'try', 'catch'];
    let complexity = 1;
    
    indicators.forEach(indicator => {
      const regex = new RegExp(`\\b${indicator}\\b`, 'g');
      complexity += (content.match(regex) || []).length;
    });
    
    return complexity;
  }

  // Metric calculation methods
  calculateCohesion(ast) {
    // Simplified cohesion metric
    if (!ast.classes || ast.classes.length === 0) return 0;
    
    let totalCohesion = 0;
    ast.classes.forEach(cls => {
      const methodCount = cls.methods ? cls.methods.length : 0;
      const propertyCount = cls.properties ? cls.properties.length : 0;
      totalCohesion += methodCount > 0 ? propertyCount / methodCount : 0;
    });
    
    return totalCohesion / ast.classes.length;
  }

  calculateCoupling(ast) {
    // Simplified coupling metric based on imports
    return ast.imports ? ast.imports.length : 0;
  }

  calculateInheritanceMetrics(ast) {
    const metrics = {
      depthOfInheritance: 0,
      numberOfChildren: 0,
      classHierarchies: 0
    };
    
    if (ast.classes) {
      ast.classes.forEach(cls => {
        if (cls.extends) {
          metrics.depthOfInheritance++;
        }
        if (cls.implements && cls.implements.length > 0) {
          metrics.numberOfChildren += cls.implements.length;
        }
      });
      metrics.classHierarchies = ast.classes.length;
    }
    
    return metrics;
  }

  calculateMaintainabilityIndex(ast) {
    // Simplified maintainability index
    const complexity = ast.codeMetrics ? ast.codeMetrics.cyclomaticComplexity : 10;
    const linesOfCode = ast.filePath ? 100 : 50; // Rough estimate
    
    return Math.max(0, (171 - 5.2 * Math.log(complexity) - 0.23 * linesOfCode) * 100 / 171);
  }

  estimateTechnicalDebt(ast) {
    let debt = 0;
    
    // Add debt for complexity
    if (ast.codeMetrics && ast.codeMetrics.cyclomaticComplexity > 10) {
      debt += ast.codeMetrics.cyclomaticComplexity * 0.5;
    }
    
    // Add debt for missing error handling
    if (ast.errorHandling && !ast.errorHandling.hasErrorHandling) {
      debt += 5;
    }
    
    // Add debt for large functions
    if (ast.functions) {
      ast.functions.forEach(func => {
        if (func.complexity && func.complexity > 8) {
          debt += func.complexity * 0.3;
        }
      });
    }
    
    return Math.round(debt * 10) / 10;
  }

  buildInheritanceGraph(ast) {
    const graph = {};
    
    if (ast.classes) {
      ast.classes.forEach(cls => {
        graph[cls.name] = {
          extends: cls.extends || cls.inherits || null,
          implements: cls.implements || [],
          children: []
        };
      });
      
      // Build reverse relationships
      Object.values(graph).forEach(node => {
        if (node.extends && graph[node.extends]) {
          graph[node.extends].children.push(node);
        }
      });
    }
    
    return graph;
  }

  detectComposition(ast) {
    const compositions = [];
    
    if (ast.classes) {
      ast.classes.forEach(cls => {
        if (cls.properties) {
          cls.properties.forEach(prop => {
            if (prop.type && ast.classes.some(c => c.name === prop.type)) {
              compositions.push({
                owner: cls.name,
                component: prop.type,
                relationship: 'composition'
              });
            }
          });
        }
      });
    }
    
    return compositions;
  }

  analyzeDependencies(ast) {
    const dependencies = {
      internal: [],
      external: []
    };
    
    if (ast.imports) {
      ast.imports.forEach(imp => {
        const moduleName = imp.from || imp.module;
        if (moduleName.startsWith('.') || moduleName.startsWith('/')) {
          dependencies.internal.push(moduleName);
        } else {
          dependencies.external.push(moduleName);
        }
      });
    }
    
    return dependencies;
  }

  buildCallGraph(ast) {
    // Simplified call graph - would need more sophisticated analysis
    const graph = {};
    
    if (ast.functions) {
      ast.functions.forEach(func => {
        graph[func.name] = {
          calls: [], // Would need to analyze function body
          calledBy: []
        };
      });
    }
    
    return graph;
  }

  analyzeDataFlow(ast) {
    // Simplified data flow analysis
    return {
      globalVariables: ast.variables ? ast.variables.filter(v => v.scope === 'global') : [],
      localVariables: ast.variables ? ast.variables.filter(v => v.scope === 'local') : [],
      dataStreams: [] // Would need more sophisticated analysis
    };
  }
}

module.exports = ASTAnalyzer;