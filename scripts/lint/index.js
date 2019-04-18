
// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

const fs = require('fs');
const stripJsonComments = require('strip-json-comments');

const path = require('path');
const execSync = require('child_process').execSync;

let argv = process.argv.slice(2);
const configLocation = path.resolve(__dirname, "./config.json");

const originDir = process.argv0;


/**
 * Get tsconfig and check if it includes the originDir
 * If it doesn't exist we should make it off a default tsconfig file
 * If the originDir isn't specified in the tsconfig `include` we should add it
 * Once we've made any changes, we should update the generated tsconfig file (`tsconfigGenerated.json`)
 */
let tsconfig;
const generatedTSConfigLocation = path.resolve(__dirname, "./tsconfigGenerated.json");
if (fs.existsSync(generatedTSConfigLocation)) {
  const tsconfigRaw = fs.readFileSync(generatedTSConfigLocation, 'utf8');
  tsconfig = JSON.parse(stripJsonComments(tsconfigRaw));
} else {
  const defaultTSConfigLocation = path.resolve(__dirname, "../ts/config.json");
  const tsconfigRaw = fs.readFileSync(defaultTSConfigLocation, 'utf8');
  tsconfig = JSON.parse(stripJsonComments(tsconfigRaw));
}

if (tsconfig.include && Array.isArray(tsconfig.include)) {
  if (!tsconfig.include.includes(originDir)) {
    tsconfig.include.push(originDir)
    fs.writeFileSync(generatedTSConfigLocation, JSON.stringify(tsconfig, null, 2))
  }
} else {
  tsconfig.include = [originDir];
  fs.writeFileSync(generatedTSConfigLocation, JSON.stringify(tsconfig, null, 2))
}

// generate linting args
const lintArgs = argv
  .concat(`--config ${configLocation}`)
  .concat(`--project ${generatedTSConfigLocation}`)


const tslintBinLocation = path.resolve(__dirname, '../../', "node_modules/tslint/bin/tslint")

// run tslint
const command = `${tslintBinLocation} ${lintArgs.join(' ')}`
try {
  execSync(command, {stdio: 'inherit'})
} catch(e) {
  process.exit(1)
}


