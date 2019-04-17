#! /usr/bin/env node

/**
 * Based on react-scripts (licensed under MIT)
 * https://github.com/facebook/create-react-app/tree/master/packages/react-scripts
 */

'use strict';

const spawn = require('cross-spawn');
const fs = require('fs');

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
    throw err;
  });

// Root directory of repo calling this script
const rootDir = process.argv[1].replace('node_modules/.bin/snpkg-snapi-common', '');
// Script directory where scripts are located
const scriptDir = process.argv[1].replace('.bin/', '').concat('/scripts/');

// read list of scripts that exist from ../scripts
const existingScripts = fs.readdirSync(scriptDir).map(file => {
  const parts = file.split('.');
  if (parts.length > 1) {
    return parts.slice(0, -1).join('.')
  }
  return parts.join('.')
})


const args = process.argv.slice(2);
const scriptIndex = args.findIndex(
  arg => existingScripts.includes(arg)
);
const script = scriptIndex === -1 ? args[0] : args[scriptIndex];

if (existingScripts.includes(script)) {
  const scriptLocation = require.resolve(scriptDir + script);
  const nodeArgs = scriptIndex > 0 ? args.slice(0, scriptIndex) : [];
  const scriptArgs = args.slice(scriptIndex + 1);

  // build command
  const command = nodeArgs
    .concat(scriptLocation)
    .concat(scriptArgs);

  console.log('Running command: ', command)

  // run command
  const result = spawn.sync(
    'node',
    command,
    { stdio: 'inherit' }
  );

  // process command result
  if (result.signal) {
    if (result.signal === 'SIGKILL') {
      console.log(
        'The build failed because the process exited too early. ' +
          'This probably means the system ran out of memory or someone called ' +
          '`kill -9` on the process.'
      );
    } else if (result.signal === 'SIGTERM') {
      console.log(
        'The build failed because the process exited too early. ' +
          'Someone might have called `kill` or `killall`, or the system could ' +
          'be shutting down.'
      );
    }
    process.exit(1);
  }
  process.exit(result.status);
} else {
  console.log('Unknown script "' + script + '".');
}
