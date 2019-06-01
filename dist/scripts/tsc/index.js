'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));
require('yargs');
var fs = _interopDefault(require('fs'));
require('lodash.get');
require('lodash.set');
require('strip-json-comments');
var __chunk_1 = require('../../chunk-90e31c2e.js');
var child_process = require('child_process');

__chunk_1.logger(__chunk_1.LOG_LEVEL.DEBUG, "------------");
__chunk_1.logger(__chunk_1.LOG_LEVEL.DEBUG, "TSC script");
__chunk_1.logger(__chunk_1.LOG_LEVEL.DEBUG, "------------");
// setup
__chunk_1.initializeScript();
// set the default config location
const defaultConfigPath = __chunk_1.getDefaultConfigPath("config.json");
// set the directory of the callee repo
const originDir = __chunk_1.getOriginDir();
// parse args array into an args object
const parsedArgs = __chunk_1.getParsedArgs();
// get user defined config location, if any
const configLocationFromArgs = __chunk_1.extractConfigLocationFromArgs(parsedArgs, [
    "project",
    "p"
]);
// remove user defined config location from the args object
const cleanedParsedArgs = __chunk_1.removeOptionsFromArgsObject(parsedArgs, [
    "project",
    "p"
]);
// create a new args array using the cleaned args object
const newArgs = __chunk_1.compileArgs(cleanedParsedArgs);
// resolve config path
const configLocation = __chunk_1.generateConfigPath(originDir, defaultConfigPath, configLocationFromArgs);
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
const shouldModifyPathFn = (path) => !path.includes("<rootDir>");
const configObject = __chunk_1.importConfig(configLocation);
const jestConfig = __chunk_1.addAbsPathsToConfigPaths(configObject, tsconfigValuesWithPaths, originDir, shouldModifyPathFn);
// set root directory if it isn't set
if (!jestConfig.rootDir) {
    jestConfig.rootDir = originDir;
}
const generatedTSConfigLocation = path.resolve(__dirname, "./tscConfigGenerated.json");
__chunk_1.logger(__chunk_1.LOG_LEVEL.DEBUG, "Generated config location", generatedTSConfigLocation);
fs.writeFileSync(generatedTSConfigLocation, JSON.stringify(jestConfig, null, 2));
const lintArgs = newArgs.concat(`--project ${generatedTSConfigLocation}`);
const jestBinLocation = path.resolve(__dirname, "../../../", "node_modules/typescript/bin/tsc");
__chunk_1.logger(__chunk_1.LOG_LEVEL.DEBUG, "Jest bin location", jestBinLocation);
// run tsc
const command = `${jestBinLocation} ${lintArgs.join(" ")}`;
try {
    child_process.execSync(command, { stdio: "inherit" });
}
catch (e) {
    process.exit(1);
}
