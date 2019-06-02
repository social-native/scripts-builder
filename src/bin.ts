#! /usr/bin/env node

/**
 * Based on react-scripts (licensed under MIT)
 * https://github.com/facebook/create-react-app/tree/master/packages/react-scripts
 */

import spawn from "cross-spawn";
import fs from "fs";
import path from "path";
import { logger, LOG_LEVEL } from "common";

logger(LOG_LEVEL.DEBUG, "Running main binary");

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on("unhandledRejection", err => {
  throw err;
});

// Root directory of repo calling this script
const originDir = process.argv[1].replace(
  "node_modules/.bin/snpkg-snapi-common",
  ""
);
logger(LOG_LEVEL.DEBUG, "Callee origin directory", originDir);

// Script directory where scripts are located
const scriptDir = path.resolve(__dirname, "scripts");
logger(LOG_LEVEL.DEBUG, "Directory where scripts exist", originDir);

// read list of scripts that exist from ../scripts
const existingScripts = fs.readdirSync(scriptDir).map(file => {
  const parts = file.split(".");
  if (parts.length > 1) {
    return parts.slice(0, -1).join(".");
  }
  return parts.join(".");
});
logger(LOG_LEVEL.DEBUG, "Existing scripts", existingScripts);

const args = process.argv.slice(2);
const scriptIndex = args.findIndex(arg => existingScripts.includes(arg));
const script = scriptIndex === -1 ? args[0] : args[scriptIndex];
logger(LOG_LEVEL.DEBUG, "Calling with script", script);

// check that desired script exists
if (!existingScripts.includes(script)) {
  logger(
    LOG_LEVEL.ERROR,
    "Desired script does not exist in existing scripts ",
    {
      desiredScript: script,
      existingScripts
    }
  );

  process.exit(1);
}

// calculate script location
const scriptLocation = require.resolve(path.resolve(scriptDir, script));
logger(LOG_LEVEL.DEBUG, "Script location", scriptLocation);

// extract args
const nodeArgs = scriptIndex > 0 ? args.slice(0, scriptIndex) : [];
const scriptArgs = args.slice(scriptIndex + 1);
logger(LOG_LEVEL.DEBUG, "Node args", nodeArgs);
logger(LOG_LEVEL.DEBUG, "Script args", scriptArgs);

// build command
const command = nodeArgs.concat(scriptLocation).concat(scriptArgs);
logger(LOG_LEVEL.DEBUG, "Running command", command.join(" "));

// run command
const result = spawn.sync("node", command, {
  stdio: "inherit",
  argv0: originDir
});
// logger(LOG_LEVEL.DEBUG, "Script result", result);

// process command result
if (result.signal) {
  if (result.signal === "SIGKILL") {
    const message = `
      The build failed because the process exited too early.
      This probably means the system ran out of memory or someone called
      "kill -9" on the process.`;
    logger(LOG_LEVEL.ERROR, message);
  } else if (result.signal === "SIGTERM") {
    const message = `
      The build failed because the process exited too early.
      Someone might have called "kill" or "killall", or the system could
      be shutting down.`;
    logger(LOG_LEVEL.ERROR, message);
  }
  logger(LOG_LEVEL.ERROR, "Script executed with an error");
  process.exit(1);
}
logger(LOG_LEVEL.DEBUG, "Script executed successfully");
process.exit(result.status);
