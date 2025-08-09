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
  .name('ai-term')
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