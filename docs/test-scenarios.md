# AI Terminal vs Claude Code Comparison Tests

## Test Scenarios

### Test 1: Code Review with Context Awareness
**File**: `index.js`
**Task**: "Review this code for potential security vulnerabilities and suggest improvements"
**Expected**: Tool should identify security issues and provide context-aware suggestions

### Test 2: Pattern Recognition 
**File**: `real-benchmark.js`
**Task**: "Find similar functions in this codebase and suggest improvements"
**Expected**: Tool should identify patterns and reference similar code structures

### Test 3: Code Modification Following Conventions
**File**: `embeddings.js` 
**Task**: "Add input validation to the generateEmbedding function following this project's patterns"
**Expected**: Tool should follow existing error handling and validation patterns

### Test 4: Bug Detection with Project Context
**File**: `api-comparison-test.js`
**Task**: "Identify potential bugs in this error handling code and fix them"
**Expected**: Tool should understand project's error handling conventions

### Test 5: Architecture Understanding
**Task**: "Explain the overall architecture of this AI Terminal project"
**Expected**: Tool should demonstrate understanding of the codebase structure

## Scoring Criteria

1. **Context Relevance** (0-25 points): References project-specific context
2. **Pattern Recognition** (0-25 points): Identifies similar code patterns
3. **Convention Following** (0-20 points): Follows project coding conventions  
4. **Specificity** (0-15 points): Provides specific, actionable advice
5. **Accuracy** (0-15 points): Technically correct suggestions