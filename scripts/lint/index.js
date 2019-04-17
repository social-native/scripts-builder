
// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

const path = require('path');
const execSync = require('child_process').execSync;

let argv = process.argv.slice(2);
const configLocation = path.resolve(__dirname, "./config.json");

const lintArgs = argv
  .concat(`--config ${configLocation}`)
  .concat(`--project ${path.resolve(__dirname, "../../../snapi-creator/tsconfig.json")}`)

const tslintBin = path.resolve(__dirname, '../../', "node_modules/tslint/bin/tslint")

const command = `${tslintBin} ${lintArgs.join(' ')}`
console.log("COMMAND: ", command)
try {
  execSync(command, {stdio: 'inherit'})
} catch(e) {
  process.exit(1)
}


