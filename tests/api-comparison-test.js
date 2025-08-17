#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');
const { spawn } = require('child_process');

// Real API comparison testing framework
class APIComparisonTest {
  constructor() {
    this.config = this.loadConfig();
    this.testResults = [];
  }

  loadConfig() {
    const configPath = path.join(require('os').homedir(), '.ai-terminal-config.json');
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      console.log(chalk.red('❌ No AI Terminal config found. Run: aiterm config'));
      process.exit(1);
    }
  }

  // Test with actual AI Terminal (context-aware)
  async testWithAITerminal(prompt, filePath) {
    return new Promise((resolve, reject) => {
      const aiTermProcess = spawn('node', ['index.js', 'ask', prompt], {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      aiTermProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      aiTermProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      aiTermProcess.on('close', (code) => {
        if (code === 0) {
          resolve({
            tool: 'ai-terminal',
            response: output.trim(),
            contextAware: true,
            error: null
          });
        } else {
          reject(new Error(`AI Terminal failed: ${error}`));
        }
      });

      // Set timeout
      setTimeout(() => {
        aiTermProcess.kill();
        reject(new Error('AI Terminal timeout'));
      }, 30000);
    });
  }

  // Test with generic AI (no context)
  async testWithGenericAI(prompt, filePath) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const genericPrompt = `${prompt}\n\nCode:\n${fileContent.slice(0, 2000)}`;

      const response = await axios.post(`${this.config.apiUrl}/chat/completions`, {
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'user',
            content: genericPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        tool: 'generic-ai',
        response: response.data.choices[0].message.content,
        contextAware: false,
        error: null
      };

    } catch (error) {
      throw new Error(`Generic AI failed: ${error.response?.data?.error || error.message}`);
    }
  }

  // Score responses objectively
  scoreResponse(response, testCase) {
    const content = response.response.toLowerCase();
    const score = {
      projectContextMentions: 0,
      specificInsights: 0,
      patternRecognition: 0,
      actionableAdvice: 0,
      codeQuality: 0
    };

    // Project Context (0-25 points)
    const contextKeywords = ['project', 'codebase', 'similar', 'pattern', 'convention', 'team', 'architecture'];
    contextKeywords.forEach(keyword => {
      if (content.includes(keyword)) score.projectContextMentions += 3;
    });
    score.projectContextMentions = Math.min(score.projectContextMentions, 25);

    // Specific Insights (0-25 points)
    const specificKeywords = testCase.expectedKeywords || [];
    specificKeywords.forEach(keyword => {
      if (content.includes(keyword.toLowerCase())) score.specificInsights += 5;
    });
    score.specificInsights = Math.min(score.specificInsights, 25);

    // Pattern Recognition (0-20 points)
    const patternKeywords = ['similar', 'pattern', 'consistent', 'follows', 'matches', 'like'];
    patternKeywords.forEach(keyword => {
      if (content.includes(keyword)) score.patternRecognition += 3;
    });
    score.patternRecognition = Math.min(score.patternRecognition, 20);

    // Actionable Advice (0-15 points)
    const actionKeywords = ['should', 'recommend', 'suggest', 'consider', 'improve', 'fix', 'add', 'remove'];
    actionKeywords.forEach(keyword => {
      if (content.includes(keyword)) score.actionableAdvice += 2;
    });
    score.actionableAdvice = Math.min(score.actionableAdvice, 15);

    // Code Quality Focus (0-15 points)
    const qualityKeywords = ['security', 'performance', 'maintainable', 'readable', 'error', 'validation'];
    qualityKeywords.forEach(keyword => {
      if (content.includes(keyword)) score.codeQuality += 2;
    });
    score.codeQuality = Math.min(score.codeQuality, 15);

    const total = Object.values(score).reduce((sum, val) => sum + val, 0);
    
    return {
      ...score,
      total,
      percentage: total,
      responseLength: response.response.length
    };
  }

  // Create realistic test cases from codebase
  createTestCases(codebaseDir) {
    const testCases = [];
    
    try {
      const files = this.findCodeFiles(codebaseDir).slice(0, 5); // Test 5 files max
      
      const prompts = [
        {
          text: "Review this code for potential security vulnerabilities and suggest improvements",
          expectedKeywords: ["security", "validation", "sanitization", "authentication", "authorization"],
          type: "security_review"
        },
        {
          text: "Analyze this code and suggest refactoring opportunities to improve maintainability", 
          expectedKeywords: ["refactor", "maintainable", "clean", "structure", "modular"],
          type: "refactoring"
        },
        {
          text: "Identify potential bugs in this code and explain how to fix them",
          expectedKeywords: ["bug", "error", "exception", "fix", "handle"],
          type: "bug_detection"
        },
        {
          text: "Suggest how to add proper error handling to this code following best practices",
          expectedKeywords: ["error", "exception", "try", "catch", "handle", "validation"],
          type: "error_handling"
        }
      ];

      files.forEach((file, fileIndex) => {
        prompts.forEach((prompt, promptIndex) => {
          testCases.push({
            id: `${fileIndex}-${promptIndex}`,
            name: `${prompt.type}_${path.basename(file)}`,
            file: file,
            prompt: prompt.text,
            expectedKeywords: prompt.expectedKeywords,
            type: prompt.type
          });
        });
      });

    } catch (error) {
      console.log(chalk.red(`Error creating test cases: ${error.message}`));
    }

    return testCases.slice(0, 8); // Limit to 8 total tests
  }

  findCodeFiles(dir) {
    const files = [];
    
    function scanDir(currentDir) {
      try {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
          if (item.startsWith('.') || item === 'node_modules' || item === 'tests') continue;
          
          const fullPath = path.join(currentDir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            scanDir(fullPath);
          } else {
            const ext = path.extname(fullPath).toLowerCase();
            if (['.js', '.ts', '.py', '.java', '.cpp', '.c', '.hpp', '.h'].includes(ext)) {
              const size = stat.size;
              if (size > 500 && size < 50000) { // Files between 500 bytes and 50KB
                files.push(fullPath);
              }
            }
          }
        }
      } catch (error) {
        // Skip directories that can't be read
      }
    }
    
    scanDir(dir);
    return files;
  }

  // Run the comparison test
  async runComparison(codebaseDir) {
    console.log(chalk.blue('🔬 Starting Real API Comparison Test\n'));
    
    const testCases = this.createTestCases(codebaseDir);
    
    if (testCases.length === 0) {
      console.log(chalk.red('❌ No suitable test files found'));
      return;
    }

    console.log(chalk.green(`✅ Created ${testCases.length} test cases\n`));

    const results = [];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(chalk.yellow(`\n📋 Test ${i + 1}/${testCases.length}: ${testCase.name}`));
      console.log(chalk.gray(`File: ${testCase.file}`));
      console.log(chalk.gray(`Prompt: ${testCase.prompt}\n`));

      try {
        // Test AI Terminal (with context)
        const spinner1 = ora('Testing AI Terminal (context-aware)...').start();
        const aiTerminalResult = await this.testWithAITerminal(
          `Review the file ${testCase.file}: ${testCase.prompt}`, 
          testCase.file
        );
        spinner1.stop();
        
        aiTerminalResult.testCase = testCase;
        aiTerminalResult.score = this.scoreResponse(aiTerminalResult, testCase);
        results.push(aiTerminalResult);
        
        console.log(chalk.green(`✅ AI Terminal: ${aiTerminalResult.score.total}/100`));

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test Generic AI (no context)
        const spinner2 = ora('Testing Generic AI (no context)...').start();
        const genericResult = await this.testWithGenericAI(testCase.prompt, testCase.file);
        spinner2.stop();
        
        genericResult.testCase = testCase;
        genericResult.score = this.scoreResponse(genericResult, testCase);
        results.push(genericResult);
        
        console.log(chalk.blue(`✅ Generic AI: ${genericResult.score.total}/100`));
        
        const improvement = ((aiTerminalResult.score.total - genericResult.score.total) / genericResult.score.total * 100);
        console.log(chalk.white(`📊 Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%`));

      } catch (error) {
        console.log(chalk.red(`❌ Test failed: ${error.message}`));
      }

      // Delay between test cases
      if (i < testCases.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Generate final report
    this.generateFinalReport(results, codebaseDir);
    return results;
  }

  generateFinalReport(results, codebaseDir) {
    console.log(chalk.blue('\n📊 FINAL COMPARISON REPORT\n'));

    const aiTerminalResults = results.filter(r => r.tool === 'ai-terminal');
    const genericResults = results.filter(r => r.tool === 'generic-ai');

    if (aiTerminalResults.length === 0 || genericResults.length === 0) {
      console.log(chalk.red('❌ Insufficient results for comparison'));
      return;
    }

    // Calculate averages
    const aiAvg = aiTerminalResults.reduce((sum, r) => sum + r.score.total, 0) / aiTerminalResults.length;
    const genericAvg = genericResults.reduce((sum, r) => sum + r.score.total, 0) / genericResults.length;
    const overallImprovement = ((aiAvg - genericAvg) / genericAvg * 100);

    console.log(chalk.green('🎯 PERFORMANCE SUMMARY:'));
    console.log(`Codebase tested: ${codebaseDir}`);
    console.log(`Test cases run: ${aiTerminalResults.length}`);
    console.log(`AI Terminal (context-aware): ${aiAvg.toFixed(1)}/100`);
    console.log(`Generic AI (no context): ${genericAvg.toFixed(1)}/100`);
    console.log(`Overall improvement: ${overallImprovement > 0 ? '+' : ''}${overallImprovement.toFixed(1)}%\n`);

    // Category breakdown
    console.log(chalk.yellow('📈 CATEGORY BREAKDOWN:'));
    const categories = ['projectContextMentions', 'specificInsights', 'patternRecognition', 'actionableAdvice', 'codeQuality'];
    
    categories.forEach(category => {
      const aiCatAvg = aiTerminalResults.reduce((sum, r) => sum + r.score[category], 0) / aiTerminalResults.length;
      const genericCatAvg = genericResults.reduce((sum, r) => sum + r.score[category], 0) / genericResults.length;
      const catImprovement = genericCatAvg > 0 ? ((aiCatAvg - genericCatAvg) / genericCatAvg * 100) : 0;
      
      console.log(`${category.padEnd(25)}: ${aiCatAvg.toFixed(1)} vs ${genericCatAvg.toFixed(1)} (${catImprovement > 0 ? '+' : ''}${catImprovement.toFixed(1)}%)`);
    });

    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      codebase: codebaseDir,
      summary: {
        aiTerminalAverage: aiAvg,
        genericAIAverage: genericAvg,
        improvementPercentage: overallImprovement,
        testCasesCompleted: aiTerminalResults.length,
        significantImprovement: overallImprovement > 15
      },
      results: results
    };

    const reportFile = path.join(__dirname, `api-comparison-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));

    console.log(chalk.green(`\n💾 Detailed report saved: ${reportFile}`));

    // Verdict
    if (overallImprovement > 20) {
      console.log(chalk.green('\n🎉 AI TERMINAL SHOWS SIGNIFICANT IMPROVEMENT!'));
      console.log(chalk.green('Context-aware features provide measurable benefits.'));
    } else if (overallImprovement > 5) {
      console.log(chalk.yellow('\n📈 AI Terminal shows modest improvement'));
      console.log(chalk.yellow('Context features provide some benefit.'));
    } else if (overallImprovement > -5) {
      console.log(chalk.blue('\n📊 Results are roughly equivalent'));
      console.log(chalk.blue('No significant difference detected.'));
    } else {
      console.log(chalk.red('\n📉 Generic AI outperformed AI Terminal'));
      console.log(chalk.red('Context features may need improvement.'));
    }

    console.log(chalk.gray(`\n🔬 This test used real API calls with actual code analysis.`));
    console.log(chalk.gray(`Results represent genuine performance comparison.`));
  }
}

// CLI usage
if (require.main === module) {
  const tester = new APIComparisonTest();
  const codebaseDir = process.argv[2] || '/Users/surbhijain/ai-term/cpp-test';
  
  console.log(chalk.blue('🚀 AI Terminal vs Generic AI - Real API Comparison'));
  console.log(chalk.gray(`Testing on: ${codebaseDir}\n`));
  
  tester.runComparison(codebaseDir).then(() => {
    console.log(chalk.blue('\n✅ Comparison test completed!'));
  }).catch(error => {
    console.log(chalk.red(`❌ Test failed: ${error.message}`));
  });
}

module.exports = APIComparisonTest;