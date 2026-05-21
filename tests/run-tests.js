// Test runner execution script for Node.js native unit testing

const { spawn } = require('child_process');
const path = require('path');

console.log("Starting unit tests using Node.js native test runner...\n");

const testProcess = spawn('node', ['--test', path.join(__dirname, 'background.test.js')], {
  stdio: 'inherit'
});

testProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Tests failed with exit code ${code}`);
    process.exit(code);
  } else {
    console.log(`\n✅ All unit tests passed successfully!`);
    process.exit(0);
  }
});
