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
logger(LOG_LEVEL.DEBUG, "TSC script");
logger(LOG_LEVEL.DEBUG, "------------");

// setup
initializeScript();

// set the default config location
const defaultConfigPath = getDefaultConfigPath("config.json");
// set the directory of the callee repo
const originDir = getOriginDir();
// parse args array into an args object
const parsedArgs = getParsedArgs();
// get user defined config location, if any
const configLocationFromArgs = extractConfigLocationFromArgs(parsedArgs, [
  "project",
  "p"
]);

// remove user defined config location from the args object
const cleanedParsedArgs = removeOptionsFromArgsObject(parsedArgs, [
  "project",
  "p"
]);

// create a new args array using the cleaned args object
const newArgs = compileArgs(cleanedParsedArgs);

// resolve config path
const configLocation = generateConfigPath(
  originDir,
  defaultConfigPath,
  configLocationFromArgs
);

const tsconfigValuesWithPaths = [
  "compilerOptions.outFile",
  "compilerOptions.outDir",
  "compilerOptions.baseUrl",
  "compilerOptions.declarationDir",
  "compilerOptions.rootDir",
  "compilerOptions.rootDirs",
  "compilerOptions.mapRoot",
  "compilerOptions.sourceRoot",
  "compilerOptions.typeRoots",
  "exclude"
];

const shouldModifyPathFn = (path: string) => !path.includes("<rootDir>");
const configObject = importConfig(configLocation);
const jestConfig = addAbsPathsToConfigPaths(
  configObject,
  tsconfigValuesWithPaths,
  originDir,
  shouldModifyPathFn
);

// set root directory if it isn't set
if (!jestConfig.rootDir) {
  jestConfig.rootDir = originDir;
}

const generatedTSConfigLocation = path.resolve(
  __dirname,
  "./tscConfigGenerated.json"
);
logger(LOG_LEVEL.DEBUG, "Generated config location", generatedTSConfigLocation);

fs.writeFileSync(
  generatedTSConfigLocation,
  JSON.stringify(jestConfig, null, 2)
);

const lintArgs = newArgs.concat(`--project ${generatedTSConfigLocation}`);

const jestBinLocation = path.resolve(
  __dirname,
  "../../../",
  "node_modules/typescript/bin/tsc"
);
logger(LOG_LEVEL.DEBUG, "Jest bin location", jestBinLocation);

// run tsc
const command = `${jestBinLocation} ${lintArgs.join(" ")}`;
try {
  execSync(command, { stdio: "inherit" });
} catch (e) {
  process.exit(1);
}
