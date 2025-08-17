#!/usr/bin/env node

const { Command } = require('commander');
const readline = require('readline');
const chalk = require('chalk');
const ora = require('ora');
const axios = require('axios');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Simple config management
const configPath = path.join(os.homedir(), '.ai-terminal-config.json');
const config = {
  get: (key, defaultValue) => {
    try {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return data[key] || defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key, value) => {
    let data = {};
    try {
      data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {}
    data[key] = value;
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
  }
};

const program = new Command();

program
  .name('aiterm')
  .description('Terminal-based AI assistant')
  .version('1.0.0');

// Configuration commands
program
  .command('config')
  .description('Configure AI service settings')
  .action(async () => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('Choose AI service:');
    console.log('1. Groq (recommended)');
    console.log('2. OpenAI');
    console.log('3. Custom API');
    
    rl.question('Select option (1-3): ', (choice) => {
      let service = 'Groq';
      let apiUrl = 'https://api.groq.com/openai/v1';
      
      if (choice === '2') {
        service = 'OpenAI';
        apiUrl = 'https://api.openai.com/v1';
      } else if (choice === '3') {
        service = 'Custom API';
        apiUrl = '';
      }
      
      rl.question('Enter API key: ', (apiKey) => {
        if (!apiKey.trim()) {
          console.log(chalk.red('❌ API key is required'));
          rl.close();
          return;
        }
        
        if (choice === '3') {
          rl.question('Enter API URL: ', (customUrl) => {
            config.set('service', service);
            config.set('apiKey', apiKey);
            config.set('apiUrl', customUrl);
            console.log(chalk.green('✓ Configuration saved!'));
            rl.close();
          });
        } else {
          config.set('service', service);
          config.set('apiKey', apiKey);
          config.set('apiUrl', apiUrl);
          console.log(chalk.green('✓ Configuration saved!'));
          rl.close();
        }
      });
    });
  });

// Ask command
program
  .command('ask <question>')
  .description('Ask a question to AI')
  .option('-m, --model <model>', 'AI model to use', 'llama3-70b-8192')
  .action(async (question, options) => {
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.log(chalk.red('❌ No API key configured. Run: ai-term config'));
      return;
    }

    const spinner = ora('Thinking...').start();
    
    try {
      const response = await askAI(question, options.model);
      spinner.stop();
      
      console.log(chalk.blue('\n🤖 AI Response:'));
      console.log(chalk.white(response));
    } catch (error) {
      spinner.stop();
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  });

// Chat command
program
  .command('chat')
  .description('Start interactive chat session')
  .option('-m, --model <model>', 'AI model to use', 'llama3-70b-8192')
  .action(async (options) => {
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.log(chalk.red('❌ No API key configured. Run: ai-term config'));
      return;
    }

    console.log(chalk.green('🚀 Starting AI chat session. Type "exit" to quit.\n'));
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const conversation = [];
    
    const askQuestion = () => {
      rl.question(chalk.cyan('You: '), async (question) => {
        if (question.toLowerCase() === 'exit') {
          console.log(chalk.yellow('👋 Goodbye!'));
          rl.close();
          return;
        }

        if (!question.trim()) {
          askQuestion();
          return;
        }

        conversation.push({ role: 'user', content: question });
        
        const spinner = ora('Thinking...').start();
        
        try {
          const response = await askAI(question, options.model, conversation);
          spinner.stop();
          
          conversation.push({ role: 'assistant', content: response });
          
          console.log(chalk.blue('🤖 AI:'), chalk.white(response));
          console.log();
          askQuestion();
        } catch (error) {
          spinner.stop();
          console.log(chalk.red(`❌ Error: ${error.message}\n`));
          askQuestion();
        }
      });
    };
    
    askQuestion();
  });

// Status command
program
  .command('status')
  .description('Show configuration status')
  .action(() => {
    const service = config.get('service', 'Not configured');
    const hasApiKey = !!config.get('apiKey');
    const apiUrl = config.get('apiUrl', 'Default');

    console.log(chalk.blue('📊 AI Terminal Status:'));
    console.log(`Service: ${chalk.yellow(service)}`);
    console.log(`API Key: ${hasApiKey ? chalk.green('✓ Set') : chalk.red('❌ Not set')}`);
    console.log(`API URL: ${chalk.yellow(apiUrl)}`);
  });

// Code Review command
program
  .command('review <file>')
  .description('Review code file and provide feedback')
  .option('-m, --model <model>', 'AI model to use', 'llama3-70b-8192')
  .option('-t, --template <template>', 'Use specific review template')
  .action(async (file, options) => {
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.log(chalk.red('❌ No API key configured. Run: aiterm config'));
      return;
    }

    try {
      const code = fs.readFileSync(file, 'utf8');
      let prompt;
      
      if (options.template) {
        // Use custom template
        try {
          const templatePath = path.join(templatesDir, `${options.template}.txt`);
          const template = fs.readFileSync(templatePath, 'utf8');
          prompt = template.replace('{CODE}', code);
        } catch {
          console.log(chalk.red(`❌ Template '${options.template}' not found`));
          return;
        }
      } else {
        // Use default review prompt
        prompt = `Please review this code and provide feedback on:
1. Code quality and best practices
2. Potential bugs or issues
3. Performance improvements
4. Security concerns
5. Maintainability suggestions

Code to review:
\`\`\`
${code}
\`\`\``;
      }

      const spinner = ora('Reviewing code...').start();
      const response = await askAI(prompt, options.model);
      spinner.stop();
      
      console.log(chalk.blue('🔍 Code Review Results:'));
      console.log(chalk.white(response));
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  });

// Refactor command
program
  .command('refactor <file>')
  .description('Get refactoring suggestions for code')
  .option('-m, --model <model>', 'AI model to use', 'llama3-70b-8192')
  .action(async (file, options) => {
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.log(chalk.red('❌ No API key configured. Run: aiterm config'));
      return;
    }

    try {
      const code = fs.readFileSync(file, 'utf8');
      const prompt = `Please suggest refactoring improvements for this code:
1. Simplify complex functions
2. Improve naming and structure  
3. Reduce code duplication
4. Enhance readability
5. Optimize performance

Provide specific, actionable suggestions with code examples.

Code to refactor:
\`\`\`
${code}
\`\`\``;

      const spinner = ora('Analyzing code for refactoring...').start();
      const response = await askAI(prompt, options.model);
      spinner.stop();
      
      console.log(chalk.blue('🔧 Refactoring Suggestions:'));
      console.log(chalk.white(response));
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  });

// Project Analysis command
program
  .command('analyze [directory]')
  .description('Analyze project structure and provide insights')
  .option('-m, --model <model>', 'AI model to use', 'llama3-70b-8192')
  .action(async (directory = '.', options) => {
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.log(chalk.red('❌ No API key configured. Run: aiterm config'));
      return;
    }

    try {
      const { spawn } = require('child_process');
      
      // Get project structure
      const tree = await new Promise((resolve, reject) => {
        const child = spawn('find', [directory, '-type', 'f', '-name', '*.js', '-o', '-name', '*.ts', '-o', '-name', '*.py', '-o', '-name', '*.java', '-o', '-name', '*.cpp', '-o', '-name', '*.c', '-o', '-name', '*.go', '-o', '-name', '*.rs'], { cwd: process.cwd() });
        let output = '';
        child.stdout.on('data', (data) => output += data);
        child.on('close', (code) => code === 0 ? resolve(output) : reject(new Error('Failed to analyze project')));
      });

      const files = tree.trim().split('\n').filter(f => f).slice(0, 20); // Limit to 20 files
      
      let projectInfo = `Project files found:\n${files.join('\n')}\n\n`;
      
      // Read package.json if exists
      try {
        const packageJson = fs.readFileSync(path.join(directory, 'package.json'), 'utf8');
        projectInfo += `Package.json:\n${packageJson}\n\n`;
      } catch {}

      const prompt = `Analyze this project structure and provide insights on:
1. Architecture and organization
2. Technology stack assessment
3. Potential improvements
4. Security considerations
5. Scalability suggestions

${projectInfo}`;

      const spinner = ora('Analyzing project...').start();
      const response = await askAI(prompt, options.model);
      spinner.stop();
      
      console.log(chalk.blue('📊 Project Analysis:'));
      console.log(chalk.white(response));
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  });

// Git Diff Review command
program
  .command('gitreview')
  .description('Review git changes (staged or unstaged)')
  .option('-m, --model <model>', 'AI model to use', 'llama3-70b-8192')
  .option('--staged', 'Review only staged changes')
  .action(async (options) => {
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.log(chalk.red('❌ No API key configured. Run: aiterm config'));
      return;
    }

    try {
      const { spawn } = require('child_process');
      
      const gitCmd = options.staged ? 'git diff --staged' : 'git diff HEAD';
      const diff = await new Promise((resolve, reject) => {
        const child = spawn('git', options.staged ? ['diff', '--staged'] : ['diff', 'HEAD'], { cwd: process.cwd() });
        let output = '';
        child.stdout.on('data', (data) => output += data);
        child.on('close', (code) => resolve(output));
      });

      if (!diff.trim()) {
        console.log(chalk.yellow('No changes to review'));
        return;
      }

      const prompt = `Please review these git changes and provide feedback on:
1. Code quality of the changes
2. Potential issues or bugs introduced
3. Suggestions for improvement
4. Whether changes follow best practices
5. Impact on existing codebase

Git diff:
\`\`\`
${diff}
\`\`\``;

      const spinner = ora('Reviewing git changes...').start();
      const response = await askAI(prompt, options.model);
      spinner.stop();
      
      console.log(chalk.blue('🔍 Git Changes Review:'));
      console.log(chalk.white(response));
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  });

// Test Generation command
program
  .command('test <file>')
  .description('Generate tests for a code file')
  .option('-m, --model <model>', 'AI model to use', 'llama3-70b-8192')
  .option('-f, --framework <framework>', 'Test framework (jest, mocha, pytest, etc.)')
  .action(async (file, options) => {
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.log(chalk.red('❌ No API key configured. Run: aiterm config'));
      return;
    }

    try {
      const code = fs.readFileSync(file, 'utf8');
      const framework = options.framework || 'auto-detect';
      
      const prompt = `Generate comprehensive tests for this code file:
1. Unit tests for all functions/methods
2. Edge cases and error handling
3. Integration tests if applicable
4. Mock dependencies where needed
5. Follow ${framework} framework conventions

Please provide complete, runnable test code.

Code to test:
\`\`\`
${code}
\`\`\``;

      const spinner = ora('Generating tests...').start();
      const response = await askAI(prompt, options.model);
      spinner.stop();
      
      console.log(chalk.blue('🧪 Generated Tests:'));
      console.log(chalk.white(response));
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  });

// Template Management
const templatesDir = path.join(os.homedir(), '.ai-terminal-templates');
const contextDir = path.join(os.homedir(), '.ai-terminal-context');
const CodeEmbeddings = require('./embeddings');
const ContextEvaluator = require('./evaluation');

// Ensure directories exist
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}
if (!fs.existsSync(contextDir)) {
  fs.mkdirSync(contextDir, { recursive: true });
}

// Template commands
program
  .command('template')
  .description('Manage review templates')
  .addCommand(
    new Command('create')
      .argument('<name>', 'Template name')
      .description('Create a new review template')
      .action(async (name) => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        console.log(chalk.blue('📝 Creating review template. Enter template content:'));
        console.log(chalk.gray('(Use {CODE} placeholder for the code to review)'));
        console.log(chalk.gray('Press Ctrl+D when finished, or type "END" on a new line'));
        
        let templateContent = '';
        
        const readTemplate = () => {
          rl.question('> ', (line) => {
            if (line === 'END') {
              if (!templateContent.includes('{CODE}')) {
                templateContent += '\n\nCode to review:\n```\n{CODE}\n```';
              }
              
              const templatePath = path.join(templatesDir, `${name}.txt`);
              fs.writeFileSync(templatePath, templateContent);
              console.log(chalk.green(`✓ Template '${name}' created successfully!`));
              rl.close();
              return;
            }
            templateContent += line + '\n';
            readTemplate();
          });
        };
        
        readTemplate();
      })
  )
  .addCommand(
    new Command('list')
      .description('List all review templates')
      .action(() => {
        try {
          const templates = fs.readdirSync(templatesDir)
            .filter(f => f.endsWith('.txt'))
            .map(f => f.replace('.txt', ''));
          
          if (templates.length === 0) {
            console.log(chalk.yellow('No templates found. Create one with: aiterm template create <name>'));
            return;
          }
          
          console.log(chalk.blue('📋 Available Templates:'));
          templates.forEach(t => console.log(`  • ${chalk.yellow(t)}`));
        } catch (error) {
          console.log(chalk.red(`❌ Error: ${error.message}`));
        }
      })
  )
  .addCommand(
    new Command('show')
      .argument('<name>', 'Template name')
      .description('Show template content')
      .action((name) => {
        try {
          const templatePath = path.join(templatesDir, `${name}.txt`);
          const content = fs.readFileSync(templatePath, 'utf8');
          console.log(chalk.blue(`📄 Template: ${name}`));
          console.log(chalk.white(content));
        } catch (error) {
          console.log(chalk.red(`❌ Template '${name}' not found`));
        }
      })
  )
  .addCommand(
    new Command('delete')
      .argument('<name>', 'Template name')
      .description('Delete a template')
      .action((name) => {
        try {
          const templatePath = path.join(templatesDir, `${name}.txt`);
          fs.unlinkSync(templatePath);
          console.log(chalk.green(`✓ Template '${name}' deleted`));
        } catch (error) {
          console.log(chalk.red(`❌ Template '${name}' not found`));
        }
      })
  );

// Update command
program
  .command('update')
  .description('Update ai-terminal to latest version')
  .action(async () => {
    const spinner = ora('Checking for updates...').start();
    
    try {
      const { spawn } = require('child_process');
      const appDir = path.join(os.homedir(), 'ai-term', 'ai-terminal');
      
      // Check if git repo exists
      if (!fs.existsSync(path.join(appDir, '.git'))) {
        spinner.stop();
        console.log(chalk.yellow('⚠️  Git repository not found. Cloning fresh copy...'));
        
        // Clone the repo
        const cloneSpinner = ora('Cloning repository...').start();
        await new Promise((resolve, reject) => {
          const child = spawn('git', ['clone', 'https://github.com/kapil0x/ai-terminal.git', appDir], {
            stdio: 'pipe'
          });
          child.on('close', (code) => code === 0 ? resolve() : reject(new Error('Failed to clone repository')));
        });
        cloneSpinner.stop();
      } else {
        // Pull latest changes
        spinner.text = 'Pulling latest changes...';
        await new Promise((resolve, reject) => {
          const child = spawn('git', ['pull', 'origin', 'main'], {
            cwd: appDir,
            stdio: 'pipe'
          });
          child.on('close', (code) => code === 0 ? resolve() : reject(new Error('Failed to pull updates')));
        });
      }
      
      // Install dependencies
      spinner.text = 'Installing dependencies...';
      await new Promise((resolve, reject) => {
        const child = spawn('npm', ['install'], {
          cwd: appDir,
          stdio: 'pipe'
        });
        child.on('close', (code) => code === 0 ? resolve() : reject(new Error('Failed to install dependencies')));
      });
      
      // Update global installation
      spinner.text = 'Updating global installation...';
      await new Promise((resolve, reject) => {
        const child = spawn('sudo', ['cp', path.join(appDir, 'ai-term-standalone.js'), '/usr/local/bin/aiterm'], {
          stdio: 'pipe'
        });
        child.on('close', (code) => code === 0 ? resolve() : reject(new Error('Failed to update global installation')));
      });
      
      spinner.stop();
      console.log(chalk.green('✅ ai-terminal updated successfully!'));
      console.log(chalk.blue('🚀 You can now use the latest features'));
      
    } catch (error) {
      spinner.stop();
      console.log(chalk.red(`❌ Update failed: ${error.message}`));
      console.log(chalk.yellow('💡 Try manual update: git pull origin main'));
    }
  });

// Code Modification command
program
  .command('modify <file> <prompt>')
  .description('Modify code file based on natural language prompt')
  .option('-m, --model <model>', 'AI model to use', 'llama3-70b-8192')
  .option('--backup', 'Create backup before modifying')
  .option('--preview', 'Show changes without applying them')
  .action(async (file, prompt, options) => {
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.log(chalk.red('❌ No API key configured. Run: aiterm config'));
      return;
    }

    try {
      // Check if file exists
      if (!fs.existsSync(file)) {
        console.log(chalk.red(`❌ File '${file}' not found`));
        return;
      }

      const originalCode = fs.readFileSync(file, 'utf8');
      
      // Create backup if requested
      if (options.backup) {
        const backupPath = `${file}.backup.${Date.now()}`;
        fs.writeFileSync(backupPath, originalCode);
        console.log(chalk.green(`💾 Backup created: ${backupPath}`));
      }

      const modificationPrompt = `You are a code modification assistant. Based on the user's request, modify the provided code and return ONLY the complete modified code.

User Request: ${prompt}

Original Code:
\`\`\`
${originalCode}
\`\`\`

IMPORTANT: 
- Return ONLY the complete modified code, no explanations
- Maintain the original file structure and formatting style
- Ensure the code remains functional and follows best practices
- If the request is unclear or unsafe, explain why instead of modifying`;

      const spinner = ora('Modifying code...').start();
      const response = await askAI(modificationPrompt, options.model);
      spinner.stop();
      
      // Extract code from response (remove markdown if present)
      let modifiedCode = response;
      if (response.includes('```')) {
        const codeBlocks = response.match(/```[\s\S]*?```/g);
        if (codeBlocks && codeBlocks.length > 0) {
          modifiedCode = codeBlocks[0].replace(/```\w*\n?/g, '').replace(/```$/g, '');
        }
      }
      
      if (options.preview) {
        console.log(chalk.blue('🔍 Preview of Changes:'));
        console.log(chalk.green('--- Original'));
        console.log(chalk.red('+++ Modified'));
        console.log(chalk.white(modifiedCode));
        console.log(chalk.yellow('\n💡 Use without --preview to apply changes'));
        return;
      }
      
      // Show confirmation prompt
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      console.log(chalk.blue('🔧 Code Modified. Preview:'));
      console.log(chalk.gray('--- First 10 lines ---'));
      console.log(modifiedCode.split('\n').slice(0, 10).join('\n'));
      console.log(chalk.gray('--- ... ---'));
      
      rl.question(chalk.yellow('Apply changes? (y/N): '), (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          fs.writeFileSync(file, modifiedCode);
          console.log(chalk.green(`✅ File '${file}' modified successfully!`));
        } else {
          console.log(chalk.yellow('❌ Changes cancelled'));
        }
        rl.close();
      });
      
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  });

// Quick Fix command
program
  .command('fix <file>')
  .description('Auto-fix common issues in code')
  .option('-m, --model <model>', 'AI model to use', 'llama3-70b-8192')
  .option('--backup', 'Create backup before fixing')
  .action(async (file, options) => {
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.log(chalk.red('❌ No API key configured. Run: aiterm config'));
      return;
    }

    try {
      const originalCode = fs.readFileSync(file, 'utf8');
      
      if (options.backup) {
        const backupPath = `${file}.backup.${Date.now()}`;
        fs.writeFileSync(backupPath, originalCode);
        console.log(chalk.green(`💾 Backup created: ${backupPath}`));
      }

      const fixPrompt = `Fix common issues in this code:
1. Syntax errors
2. Unused variables
3. Missing error handling
4. Code style issues
5. Performance issues
6. Security vulnerabilities

Return ONLY the fixed code, no explanations.

Code to fix:
\`\`\`
${originalCode}
\`\`\``;

      const spinner = ora('Auto-fixing code...').start();
      const response = await askAI(fixPrompt, options.model);
      spinner.stop();
      
      let fixedCode = response;
      if (response.includes('```')) {
        const codeBlocks = response.match(/```[\s\S]*?```/g);
        if (codeBlocks && codeBlocks.length > 0) {
          fixedCode = codeBlocks[0].replace(/```\w*\n?/g, '').replace(/```$/g, '');
        }
      }
      
      console.log(chalk.blue('🔧 Auto-fix Results:'));
      console.log(chalk.green('Fixed code preview (first 10 lines):'));
      console.log(fixedCode.split('\n').slice(0, 10).join('\n'));
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question(chalk.yellow('Apply fixes? (y/N): '), (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          fs.writeFileSync(file, fixedCode);
          console.log(chalk.green(`✅ File '${file}' fixed successfully!`));
        } else {
          console.log(chalk.yellow('❌ Fixes cancelled'));
        }
        rl.close();
      });
      
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  });

// Advanced Embedding System
program
  .command('embed-learn')
  .description('Generate embeddings for codebase using local ML model')
  .option('-d, --directory <dir>', 'Directory to learn from', '.')
  .action(async (options) => {
    const spinner = ora('Initializing CodeT5 model...').start();
    
    try {
      const embeddings = new CodeEmbeddings();
      await embeddings.initialize();
      
      spinner.text = 'Scanning codebase for files...';
      
      // Find code files using a more reliable approach
      const findCodeFiles = (dir) => {
        const files = [];
        const fs = require('fs');
        const path = require('path');
        
        function scanDir(currentDir) {
          try {
            const items = fs.readdirSync(currentDir);
            for (const item of items) {
              if (item.startsWith('.') || item === 'node_modules') continue;
              
              const fullPath = path.join(currentDir, item);
              const stat = fs.statSync(fullPath);
              
              if (stat.isDirectory()) {
                scanDir(fullPath);
              } else {
                const ext = path.extname(fullPath).toLowerCase();
                if (['.js', '.ts', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.php', '.jsx', '.tsx'].includes(ext)) {
                  files.push(fullPath);
                }
              }
            }
          } catch (error) {
            // Skip directories that can't be read
          }
        }
        
        scanDir(dir);
        return files;
      };
      
      const files = findCodeFiles(options.directory);
      
      
      if (files.length === 0) {
        spinner.stop();
        console.log(chalk.yellow('No code files found to embed'));
        return;
      }

      spinner.text = `Generating embeddings for ${files.length} files...`;
      
      let processed = 0;
      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          await embeddings.embedFile(file, content);
          processed++;
          
          if (processed % 5 === 0) {
            spinner.text = `Embedded ${processed}/${files.length} files...`;
          }
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }
      
      await embeddings.close();
      spinner.stop();
      
      console.log(chalk.green(`✅ Successfully embedded ${processed} files`));
      console.log(chalk.blue('🧠 Local ML model ready for semantic code search'));
      console.log(chalk.gray('💡 All AI commands now use smart context selection'));
      
    } catch (error) {
      spinner.stop();
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  });

// Smart Context Search
program
  .command('search <query>')
  .description('Semantic search through codebase using embeddings')
  .option('-l, --limit <number>', 'Number of results', '5')
  .action(async (query, options) => {
    const spinner = ora('Searching codebase...').start();
    
    try {
      const embeddings = new CodeEmbeddings();
      await embeddings.initialize();
      
      // Generate embedding for query
      const queryEmbedding = await embeddings.generateEmbedding(query);
      
      // Find similar code
      const results = await embeddings.findSimilar(queryEmbedding, parseInt(options.limit));
      
      await embeddings.close();
      spinner.stop();
      
      console.log(chalk.blue(`🔍 Search results for: "${query}"`));
      
      results.forEach((result, index) => {
        console.log(chalk.yellow(`\n${index + 1}. ${result.filePath}`));
        console.log(chalk.gray(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`));
        console.log(chalk.gray(`   Language: ${result.metadata.language}`));
        if (result.metadata.functions.length > 0) {
          console.log(chalk.gray(`   Functions: ${result.metadata.functions.slice(0, 3).join(', ')}`));
        }
      });
      
    } catch (error) {
      spinner.stop();
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  });

// Evaluation System
program
  .command('benchmark')
  .description('Benchmark context awareness against other AI tools')
  .action(async () => {
    const evaluator = new ContextEvaluator();
    const results = await evaluator.runBenchmark();
    
    console.log(chalk.blue('\n📈 Benchmark Results:'));
    console.log(`Test cases prepared: ${results.testCases}`);
    console.log(`Expected improvement: ${((results.baselines.ourTool - results.baselines.copilot) * 100).toFixed(1)}% over Copilot`);
    console.log(`Expected improvement: ${((results.baselines.ourTool - results.baselines.cursor) * 100).toFixed(1)}% over Cursor`);
    console.log(`Expected improvement: ${((results.baselines.ourTool - results.baselines.claudeCode) * 100).toFixed(1)}% over Claude Code`);
    
    console.log(chalk.green('\n🚀 To validate these claims:'));
    console.log('1. Run: aiterm embed-learn (build embeddings)');
    console.log('2. Test: aiterm review <file> (context-aware)');
    console.log('3. Compare: Same query in Copilot/Cursor');
    console.log('4. Measure: Project-specific understanding');
    console.log('5. Run: aiterm real-test (automated comparison)');
  });

// Real Testing Commands
program
  .command('real-test')
  .description('Run real comparison test against generic AI')
  .option('-d, --directory <dir>', 'Directory to test', '.')
  .action(async (options) => {
    const RealBenchmark = require('./real-benchmark.js');
    const benchmark = new RealBenchmark();
    
    console.log(chalk.blue('🔬 Running Real Comparison Test'));
    console.log(chalk.gray(`Testing on: ${options.directory}\n`));
    
    try {
      await benchmark.runBenchmark(options.directory);
    } catch (error) {
      console.log(chalk.red(`❌ Test failed: ${error.message}`));
    }
  });

program
  .command('api-test')
  .description('Run real API comparison with actual AI calls')
  .option('-d, --directory <dir>', 'Directory to test', '.')
  .action(async (options) => {
    const APIComparisonTest = require('./api-comparison-test.js');
    const tester = new APIComparisonTest();
    
    console.log(chalk.blue('🚀 AI Terminal vs Generic AI - Real API Test'));
    console.log(chalk.gray(`Testing on: ${options.directory}\n`));
    
    try {
      await tester.runComparison(options.directory);
    } catch (error) {
      console.log(chalk.red(`❌ API test failed: ${error.message}`));
    }
  });

// Codebase Learning System
program
  .command('learn')
  .description('Learn your codebase patterns and conventions')
  .option('-d, --directory <dir>', 'Directory to learn from', '.')
  .option('-m, --model <model>', 'AI model to use', 'llama3-70b-8192')
  .action(async (options) => {
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.log(chalk.red('❌ No API key configured. Run: aiterm config'));
      return;
    }

    const spinner = ora('Learning your codebase...').start();
    
    try {
      const { spawn } = require('child_process');
      
      // Find code files
      const findFiles = await new Promise((resolve) => {
        const child = spawn('find', [options.directory, '-type', 'f', '(', '-name', '*.js', '-o', '-name', '*.ts', '-o', '-name', '*.py', '-o', '-name', '*.java', '-o', '-name', '*.cpp', '-o', '-name', '*.c', '-o', '-name', '*.go', '-o', '-name', '*.rs', '-o', '-name', '*.php', ')'], { cwd: process.cwd() });
        let output = '';
        child.stdout.on('data', (data) => output += data);
        child.on('close', () => resolve(output));
      });

      const files = findFiles.trim().split('\n').filter(f => f && !f.includes('node_modules') && !f.includes('.git')).slice(0, 50);
      
      if (files.length === 0) {
        spinner.stop();
        console.log(chalk.yellow('No code files found to learn from'));
        return;
      }

      // Sample files for analysis
      const sampleFiles = files.slice(0, 10);
      let codebaseContent = '';
      
      for (const file of sampleFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          codebaseContent += `\n--- ${file} ---\n${content.slice(0, 2000)}\n`;
        } catch {}
      }

      // Check for config files
      let projectContext = '';
      const configFiles = ['package.json', 'requirements.txt', 'Cargo.toml', 'pom.xml', 'go.mod'];
      for (const configFile of configFiles) {
        const configPath = path.join(options.directory, configFile);
        if (fs.existsSync(configPath)) {
          const content = fs.readFileSync(configPath, 'utf8');
          projectContext += `\n--- ${configFile} ---\n${content}\n`;
        }
      }

      const learningPrompt = `Analyze this codebase and learn the patterns, conventions, and architecture. Focus on:

1. **Code Style & Conventions**: Naming, formatting, structure patterns
2. **Architecture Patterns**: How components/modules are organized
3. **Technology Stack**: Frameworks, libraries, tools used
4. **Error Handling**: How errors are typically handled
5. **Testing Patterns**: Testing approaches and conventions
6. **Documentation Style**: Comment patterns and documentation approaches

Project Configuration:
${projectContext}

Sample Code Files:
${codebaseContent}

Provide a comprehensive analysis that can be used to maintain consistency in future code reviews and modifications.`;

      spinner.text = 'Analyzing codebase patterns...';
      const analysis = await askAI(learningPrompt, options.model);
      spinner.stop();
      
      // Save learned context
      const contextFile = path.join(contextDir, 'codebase-analysis.json');
      const contextData = {
        timestamp: new Date().toISOString(),
        directory: options.directory,
        filesAnalyzed: files.length,
        analysis: analysis,
        fileList: files
      };
      
      fs.writeFileSync(contextFile, JSON.stringify(contextData, null, 2));
      
      console.log(chalk.green(`✅ Learned from ${files.length} files in ${options.directory}`));
      console.log(chalk.blue('🧠 Codebase Analysis:'));
      console.log(chalk.white(analysis));
      console.log(chalk.gray(`\n💾 Context saved for future AI commands`));
      
    } catch (error) {
      spinner.stop();
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  });

// Remember command
program
  .command('remember <note>')
  .description('Add custom context about your project')
  .action((note) => {
    try {
      const contextFile = path.join(contextDir, 'custom-notes.json');
      let notes = [];
      
      if (fs.existsSync(contextFile)) {
        notes = JSON.parse(fs.readFileSync(contextFile, 'utf8'));
      }
      
      notes.push({
        timestamp: new Date().toISOString(),
        note: note
      });
      
      fs.writeFileSync(contextFile, JSON.stringify(notes, null, 2));
      console.log(chalk.green(`✅ Remembered: "${note}"`));
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  });

// Advanced code analysis command
program
  .command('analyze-code <file>')
  .description('Advanced code analysis with specific references and insights')
  .option('-m, --model <model>', 'AI model to use', 'llama3-70b-8192')
  .action(async (file, options) => {
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.log(chalk.red('❌ No API key configured. Run: aiterm config'));
      return;
    }

    try {
      const code = fs.readFileSync(file, 'utf8');
      const lines = code.split('\n');
      
      // Get detailed analysis using embeddings
      const embeddings = new CodeEmbeddings();
      await embeddings.initialize();
      
      // Get file metadata
      const metadata = embeddings.extractEnhancedMetadata(file, code);
      
      // Find similar files
      const fileEmbedding = await embeddings.generateEmbedding(code);
      const similarFiles = await embeddings.findSimilar(fileEmbedding, 3);
      
      await embeddings.close();
      
      // Create detailed analysis prompt (optimized for large files)
      const maxLines = 150; // Limit for very large files
      const codeToAnalyze = lines.length > maxLines 
        ? lines.slice(0, maxLines).map((line, i) => `${(i + 1).toString().padStart(3, ' ')}: ${line}`).join('\n') + `\n... (truncated after ${maxLines} lines)`
        : lines.map((line, i) => `${(i + 1).toString().padStart(3, ' ')}: ${line}`).join('\n');
        
      const analysisPrompt = `Perform advanced analysis of this code file with specific line references and detailed insights.

📁 File: ${file}
🔤 Language: ${metadata.language}
📊 Stats: ${metadata.lines} lines, ${metadata.functions.length} functions, complexity ${metadata.complexity}
🛡️ Security: ${metadata.security.vulnerabilities.length > 0 ? metadata.security.vulnerabilities.join(', ') : 'No issues detected'}
🔧 Error handling: ${metadata.errorHandling.hasErrorHandling ? `${metadata.errorHandling.tryBlocks} try blocks` : 'Missing'}

🔍 Similar files:
${similarFiles.slice(0, 2).map(f => `- ${f.filePath} (${(f.similarity * 100).toFixed(1)}% similar)`).join('\n')}

📝 Code analysis:
\`\`\`${metadata.language}
${codeToAnalyze}
\`\`\`

Provide analysis with specific line references:
1. **Security Issues** - Line numbers and explanations
2. **Code Quality** - Specific improvements needed  
3. **Pattern Recognition** - Similarities to other project files
4. **Optimization** - Performance and maintainability suggestions

Use format: "Line X: description of issue/suggestion".`;

      const spinner = ora('Performing advanced code analysis...').start();
      const response = await askAI(analysisPrompt, options.model, [], false); // Don't use context to avoid duplication
      spinner.stop();
      
      console.log(chalk.blue('🔬 Advanced Code Analysis Results:'));
      console.log(chalk.white(response));
      
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  });

// AST Architectural Analysis command
program
  .command('ast-analyze [file]')
  .description('Deep architectural analysis using AST parsing')
  .option('-p, --patterns', 'Focus on architectural patterns')
  .option('-r, --relationships', 'Show code relationships')
  .option('-m, --metrics', 'Display code metrics')
  .action(async (file, options) => {
    try {
      const embeddings = new CodeEmbeddings();
      await embeddings.initialize();
      
      if (file) {
        // Analyze specific file
        const content = fs.readFileSync(file, 'utf8');
        const astData = await embeddings.getASTData(file);
        
        if (!astData) {
          console.log(chalk.yellow(`No AST data found for ${file}. Run 'embed-learn' first.`));
          return;
        }
        
        console.log(chalk.blue(`🌳 AST Analysis: ${file}`));
        console.log(chalk.white(`Language: ${astData.ast_json.language}`));
        console.log(chalk.white(`Classes: ${astData.ast_json.classes?.length || 0}`));
        console.log(chalk.white(`Functions: ${astData.ast_json.functions?.length || 0}`));
        
        if (options.patterns && astData.architectural_patterns.length > 0) {
          console.log(chalk.yellow('\n🏗️  Architectural Patterns:'));
          astData.architectural_patterns.forEach(pattern => {
            console.log(`  • ${pattern.pattern} (${(pattern.confidence * 100).toFixed(1)}% confidence)`);
            console.log(`    Evidence: ${pattern.evidence}`);
          });
        }
        
        if (options.relationships) {
          const related = await embeddings.findRelatedFiles(file);
          console.log(chalk.cyan('\n🔗 Code Relationships:'));
          related.forEach(rel => {
            console.log(`  • ${rel.relationship} → ${rel.file} (${(rel.strength * 100).toFixed(1)}%)`);
          });
        }
        
        if (options.metrics && astData.code_metrics) {
          console.log(chalk.magenta('\n📊 Code Metrics:'));
          Object.entries(astData.code_metrics).forEach(([metric, value]) => {
            console.log(`  • ${metric}: ${typeof value === 'number' ? value.toFixed(2) : value}`);
          });
        }
        
      } else {
        // Analyze entire codebase architecture
        const stats = await embeddings.getCodebaseStats();
        
        console.log(chalk.blue('🏛️  Codebase Architecture Overview'));
        console.log(`Total files: ${stats.totalFiles}`);
        console.log(`Languages: ${Object.keys(stats.languages).join(', ')}`);
        
        // Get all AST data for pattern analysis
        const allPatterns = await embeddings.getArchitecturalPatterns();
        
        if (allPatterns.length > 0) {
          console.log(chalk.yellow('\n🏗️  Detected Architectural Patterns:'));
          const patternCounts = {};
          allPatterns.forEach(pattern => {
            patternCounts[pattern.pattern] = (patternCounts[pattern.pattern] || 0) + 1;
          });
          
          Object.entries(patternCounts)
            .sort(([,a], [,b]) => b - a)
            .forEach(([pattern, count]) => {
              console.log(`  • ${pattern}: ${count} occurrences`);
            });
        }
        
        // Show relationship graph
        const relationships = await embeddings.getRelationshipGraph();
        if (relationships.length > 0) {
          console.log(chalk.cyan('\n🕸️  Code Relationship Graph:'));
          const relTypes = {};
          relationships.forEach(rel => {
            relTypes[rel.relationship_type] = (relTypes[rel.relationship_type] || 0) + 1;
          });
          
          Object.entries(relTypes).forEach(([type, count]) => {
            console.log(`  • ${type}: ${count} connections`);
          });
        }
      }
      
      await embeddings.close();
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  });

// Context command
program
  .command('context')
  .description('Show learned codebase context')
  .action(() => {
    try {
      console.log(chalk.blue('🧠 Learned Codebase Context:'));
      
      // Show codebase analysis
      const analysisFile = path.join(contextDir, 'codebase-analysis.json');
      if (fs.existsSync(analysisFile)) {
        const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));
        console.log(chalk.yellow(`\n📊 Last Analysis: ${new Date(analysis.timestamp).toLocaleString()}`));
        console.log(chalk.white(`Directory: ${analysis.directory}`));
        console.log(chalk.white(`Files: ${analysis.filesAnalyzed}`));
        console.log(chalk.gray('\n--- Analysis Summary ---'));
        console.log(analysis.analysis.slice(0, 500) + '...');
      } else {
        console.log(chalk.yellow('No codebase analysis found. Run: aiterm learn'));
      }
      
      // Show custom notes
      const notesFile = path.join(contextDir, 'custom-notes.json');
      if (fs.existsSync(notesFile)) {
        const notes = JSON.parse(fs.readFileSync(notesFile, 'utf8'));
        console.log(chalk.blue('\n📝 Custom Notes:'));
        notes.slice(-5).forEach(note => {
          console.log(chalk.gray(`${new Date(note.timestamp).toLocaleDateString()}: ${note.note}`));
        });
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  });

// Enhanced helper function to get learned context with smart embeddings
async function getLearnedContext(query = '', useEmbeddings = true) {
  let context = '';
  
  try {
    // Get traditional learned context
    const analysisFile = path.join(contextDir, 'codebase-analysis.json');
    if (fs.existsSync(analysisFile)) {
      const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));
      context += `\n--- Learned Codebase Patterns ---\n${analysis.analysis}\n`;
    }
    
    // Get custom notes
    const notesFile = path.join(contextDir, 'custom-notes.json');
    if (fs.existsSync(notesFile)) {
      const notes = JSON.parse(fs.readFileSync(notesFile, 'utf8'));
      const recentNotes = notes.slice(-5).map(n => n.note).join('\n');
      context += `\n--- Project Conventions & Team Notes ---\n${recentNotes}\n`;
    }
    
    // Add advanced embedding-based context if available and query provided
    if (useEmbeddings && query) {
      try {
        const embeddings = new CodeEmbeddings();
        const embeddingDbExists = fs.existsSync(path.join(os.homedir(), '.ai-terminal-embeddings.db'));
        
        if (embeddingDbExists) {
          await embeddings.initialize();
          
          // Get codebase stats for better context
          const stats = await embeddings.getCodebaseStats();
          if (stats.totalFiles > 0) {
            context += `\n--- Codebase Intelligence ---\n`;
            context += `Total files analyzed: ${stats.totalFiles}\n`;
            context += `Languages: ${Object.keys(stats.languages).join(', ')}\n`;
            
            if (stats.patterns && Object.keys(stats.patterns).length > 0) {
              context += `Common patterns: ${Object.keys(stats.patterns).join(', ')}\n`;
            }
          }
          
          // Get semantically similar files
          const queryEmbedding = await embeddings.generateEmbedding(query);
          const similarFiles = await embeddings.findSimilar(queryEmbedding, 5);
          
          if (similarFiles.length > 0) {
            context += `\n--- Relevant Code Examples ---\n`;
            for (const file of similarFiles) {
              if (file.similarity > 0.2) { // Lower threshold for more context
                context += `\n📁 ${file.filePath} (${(file.similarity * 100).toFixed(1)}% relevant)\n`;
                context += `   Language: ${file.metadata.language}\n`;
                
                if (file.metadata.functions && file.metadata.functions.length > 0) {
                  context += `   Functions: ${file.metadata.functions.slice(0, 3).join(', ')}\n`;
                }
                
                if (file.metadata.classes && file.metadata.classes.length > 0) {
                  context += `   Classes: ${file.metadata.classes.map(c => c.name).slice(0, 2).join(', ')}\n`;
                }
                
                if (file.metadata.patterns && file.metadata.patterns.length > 0) {
                  context += `   Patterns: ${file.metadata.patterns.join(', ')}\n`;
                }
                
                if (file.metadata.complexity) {
                  context += `   Complexity: ${file.metadata.complexity}\n`;
                }
                
                if (file.metadata.security && file.metadata.security.vulnerabilities.length > 0) {
                  context += `   Security notes: ${file.metadata.security.vulnerabilities.join(', ')}\n`;
                }
              }
            }
          }
          
          // Find similar patterns based on query
          const queryWords = query.toLowerCase().split(/\s+/);
          for (const word of queryWords) {
            if (word.length > 3) {
              const patterns = await embeddings.findSimilarPatterns('function', word, 3);
              if (patterns.length > 0) {
                context += `\n--- Similar Functions Found ---\n`;
                patterns.forEach(pattern => {
                  context += `   ${pattern.content} (used in ${pattern.files.length} files, frequency: ${pattern.frequency})\n`;
                });
                break; // Only show patterns for first meaningful word
              }
            }
          }
          
          // Add AST-based architectural insights
          const architecturalPatterns = await embeddings.getArchitecturalPatterns();
          if (architecturalPatterns.length > 0) {
            context += `\n--- Architectural Patterns in Codebase ---\n`;
            const uniquePatterns = [...new Set(architecturalPatterns.map(p => p.pattern))];
            uniquePatterns.slice(0, 5).forEach(pattern => {
              const count = architecturalPatterns.filter(p => p.pattern === pattern).length;
              context += `   ${pattern} pattern detected (${count} occurrences)\n`;
            });
          }
          
          // Add relevant relationships if analyzing specific files
          const queryMentionsFile = queryWords.find(word => word.includes('.js') || word.includes('.ts') || word.includes('.py'));
          if (queryMentionsFile) {
            try {
              const related = await embeddings.findRelatedFiles(queryMentionsFile);
              if (related.length > 0) {
                context += `\n--- Code Relationships for ${queryMentionsFile} ---\n`;
                related.slice(0, 3).forEach(rel => {
                  context += `   ${rel.relationship} → ${rel.file} (${(rel.strength * 100).toFixed(1)}% strength)\n`;
                });
              }
            } catch (error) {
              // File relationships not available
            }
          }
          
          await embeddings.close();
        }
      } catch (error) {
        // Silently continue if embeddings fail
        console.log(chalk.gray('Smart embeddings temporarily unavailable'));
      }
    }
    
    // Add context usage instructions
    if (context.trim()) {
      context += `\n--- Instructions ---\n`;
      context += `Use the above context to provide project-specific, accurate responses.\n`;
      context += `Reference specific files, functions, and patterns when relevant.\n`;
      context += `Follow the project's established conventions and coding style.\n`;
    }
    
  } catch {}
  
  return context;
}

async function askAI(question, model = 'llama3-70b-8192', conversation = [], useContext = true) {
  // Input validation
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    throw new Error('Question must be a non-empty string');
  }
  
  const apiKey = config.get('apiKey');
  const apiUrl = config.get('apiUrl', 'https://api.groq.com/openai/v1');
  
  if (!apiKey) {
    throw new Error('API key not configured. Run: aiterm config');
  }
  
  if (!apiUrl) {
    throw new Error('API URL not configured. Run: aiterm config');
  }
  
  let finalQuestion = question.trim();
  
  // Add learned context to question if available (now with smart embeddings)
  if (useContext) {
    try {
      const context = await getLearnedContext(question, true);
      if (context && context.trim()) {
        finalQuestion = `${context}\n\n--- User Request ---\n${question}`;
      }
    } catch (contextError) {
      console.log(chalk.yellow('⚠️  Context loading failed, proceeding without context'));
    }
  }
  
  const messages = conversation.length > 0 ? conversation : [
    { role: 'user', content: finalQuestion }
  ];

  // Validate message length to prevent API errors
  const totalTokens = finalQuestion.length / 4; // Rough estimate
  if (totalTokens > 8000) {
    console.log(chalk.yellow('⚠️  Request is very large, truncating context...'));
    finalQuestion = question; // Fall back to just the question
  }

  try {
    const response = await axios.post(`${apiUrl}/chat/completions`, {
      model: model,
      messages: [{ role: 'user', content: finalQuestion }],
      max_tokens: Math.min(2000, 16000 - totalTokens), // Dynamic max tokens
      temperature: 0.1, // Lower temperature for more accurate responses
      top_p: 0.9
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    if (!response.data || !response.data.choices || response.data.choices.length === 0) {
      throw new Error('Invalid response from AI service');
    }

    const content = response.data.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from AI service');
    }

    return content.trim();
    
  } catch (error) {
    // Enhanced error handling
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 401) {
        throw new Error('Authentication failed. Check your API key.');
      } else if (status === 429) {
        throw new Error('Rate limit exceeded. Please wait and try again.');
      } else if (status === 413) {
        throw new Error('Request too large. Try with a shorter query.');
      } else if (status >= 500) {
        throw new Error('AI service temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`AI service error (${status}): ${errorData?.error?.message || 'Unknown error'}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. The AI service is taking too long to respond.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Network error. Check your internet connection.');
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

if (process.argv.length === 2) {
  program.help();
}

program.parse();