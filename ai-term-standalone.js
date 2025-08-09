#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Use the absolute path to the ai-terminal directory
const appDir = path.join(os.homedir(), 'ai-term', 'ai-terminal');

// Run the original script from its directory
const child = spawn('node', [path.join(appDir, 'index.js'), ...process.argv.slice(2)], {
  cwd: appDir,
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code);
});