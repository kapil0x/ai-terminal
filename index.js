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
  .action(async (file, options) => {
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.log(chalk.red('❌ No API key configured. Run: aiterm config'));
      return;
    }

    try {
      const code = fs.readFileSync(file, 'utf8');
      const prompt = `Please review this code and provide feedback on:
1. Code quality and best practices
2. Potential bugs or issues
3. Performance improvements
4. Security concerns
5. Maintainability suggestions

Code to review:
\`\`\`
${code}
\`\`\``;

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

async function askAI(question, model = 'llama3-70b-8192', conversation = []) {
  const apiKey = config.get('apiKey');
  const apiUrl = config.get('apiUrl', 'https://api.groq.com/openai/v1');
  
  const messages = conversation.length > 0 ? conversation : [
    { role: 'user', content: question }
  ];

  const response = await axios.post(`${apiUrl}/chat/completions`, {
    model: model,
    messages: messages,
    max_tokens: 1000,
    temperature: 0.7
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.choices[0].message.content.trim();
}

if (process.argv.length === 2) {
  program.help();
}

program.parse();