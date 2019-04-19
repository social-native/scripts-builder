
// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

const fs = require('fs');

const path = require('path');
const execSync = require('child_process').execSync;

let argv = process.argv.slice(2);
const configLocation = path.resolve(__dirname, "./config.json");
const prettierIgnoreLocation = path.resolve(__dirname, "./prettierignore");

const originDir = process.argv0;

// generate linting args
const lintArgs = argv
  .concat(`--config ${configLocation}`)
  .concat(`--check ${originDir}src/**/*`)
  .concat(`--ignore-path ${prettierIgnoreLocation}`)


const prettierBinLocation = path.resolve(__dirname, '../../', "node_modules/prettier/bin-prettier.js")

// run prettier
const command = `${prettierBinLocation} ${lintArgs.join(' ')}`
try {
  execSync(command, {stdio: 'inherit'})
} catch(e) {
  process.exit(1)
}


