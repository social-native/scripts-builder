import {
  logger,
  LOG_LEVEL,
  compileArgs,
  initializeScript,
  getDefaultConfigPath,
  getOriginDir,
  getParsedArgs,
  extractConfigLocationFromArgs,
  removeOptionsFromArgsObject,
  generateConfigPath,
  addAbsPathsToConfigPaths,
  importConfig
} from "common";
import fs from "fs";
// import stripJsonComments from "strip-json-comments";
import path from "path";
import { execSync } from "child_process";

logger(LOG_LEVEL.DEBUG, "------------");
logger(LOG_LEVEL.DEBUG, "JEST script");
logger(LOG_LEVEL.DEBUG, "------------");

// setup
initializeScript();

// set the default config location
const defaultConfigPath = getDefaultConfigPath("config.js");
// set the directory of the callee repo
const originDir = getOriginDir();
// parse args array into an args object
const parsedArgs = getParsedArgs();
// get user defined config location, if any
const configLocationFromArgs = extractConfigLocationFromArgs(parsedArgs, [
  "config",
  "c"
]);

// remove user defined config location from the args object
const cleanedParsedArgs = removeOptionsFromArgsObject(parsedArgs, [
  "config",
  "c"
]);

// create a new args array using the cleaned args object
const newArgs = compileArgs(cleanedParsedArgs);

// resolve config path
const configLocation = generateConfigPath(
  originDir,
  defaultConfigPath,
  configLocationFromArgs
);

const jestConfigValuesWithPaths = [
  "cacheDirectory",
  "coverageDirectory",
  "moduleDirectories",
  "modulePaths",
  "prettierPath",
  "rootDir",
  "setupFiles",
  "setupFilesAfterEnv",
  "snapshotResolver",
  "snapshotSerializers"
];

const shouldModifyPathFn = (path: string) => !path.includes("<rootDir>");
const configObject = importConfig(configLocation);
const jestConfig = addAbsPathsToConfigPaths(
  configObject,
  jestConfigValuesWithPaths,
  originDir,
  shouldModifyPathFn
);

// set root directory if it isn't set
if (!jestConfig.rootDir) {
  jestConfig.rootDir = originDir;
}

const generatedJestConfigLocation = path.resolve(
  __dirname,
  "./jestConfigGenerated.json"
);
logger(
  LOG_LEVEL.DEBUG,
  "Generated config location",
  generatedJestConfigLocation
);

fs.writeFileSync(
  generatedJestConfigLocation,
  JSON.stringify(jestConfig, null, 2)
);

const lintArgs = newArgs.concat(`--config ${generatedJestConfigLocation}`);

const jestBinLocation = path.resolve(
  __dirname,
  "../../../",
  "node_modules/.bin/jest"
);
logger(LOG_LEVEL.DEBUG, "Jest bin location", jestBinLocation);

// run tsc
const command = `${jestBinLocation} ${lintArgs.join(" ")}`;
try {
  execSync(command, { stdio: "inherit" });
} catch (e) {
  process.exit(1);
}
