import {
  InitializeScript,
  SetOriginDir,
  SetArgsObject,
  IArgsObj,
  SetDefaultConfigPath,
  SetUserConfigPath,
  CalcConfigPath,
  GetConfigObject,
  RemoveOptionsFromArgsObj,
  SetArgsArr,
  ModifyRelativePathsInConfigObject,
  AddFieldsToConfigObject,
  WriteConfigObjectToPath,
  ExecuteCommand,
  SetSpecifiedOriginDir,
  IState,
  OriginDir,
} from "./types";
import yargs from "yargs";
import { logger, LOG_LEVEL } from "./logger";
import path from "path";
import fs from "fs";
import stripJsonComments from "strip-json-comments";
import set from "lodash.set";
import get from "lodash.get";
import { execSync } from "child_process";

/**
 * Initialize a script
 * input -> input
 */
export const initializeScript = function(input) {
  // Makes the script crash on unhandled rejections instead of silently
  // ignoring them. In the future, promise rejections that are not handled will
  // terminate the Node.js process with a non-zero exit code.
  process.on("unhandledRejection", (err) => {
    logger(LOG_LEVEL.ERROR, "Error initializing script", err);
    throw err;
  });

  return { ...input };
} as InitializeScript;
initializeScript.prototype.name = "initializeScript";

/**
 * Sets the origin directory of the caller to state
 * input -> input + originDir
 */
export const setOriginDir = function(input) {
  const originDir = process.argv0.split("node_modules")[0];
  return { ...input, originDir };
} as SetOriginDir;
setOriginDir.prototype.name = "setOriginDir";

/**
 * Sets the argsObject (derived from calling the script with options) to state
 *
 * input -> input + argsObject
 */
export const setArgsObject = function(input) {
  const argsArr = process.argv.slice(2);
  const argsObj = yargs.parse(argsArr) as IArgsObj["argsObj"];
  return { ...input, argsObj };
} as SetArgsObject;
setArgsObject.prototype.name = "setArgsObject";

/**
 * Sets the default config file path for the script
 * Ex: a script may have a default config as `./config.json`
 *
 * defaultPath -> input -> input + defaultConfigPath
 */
// // setDefaultConfigPath: defaultPath -> input -> input + defaultConfigPath
export const setDefaultConfigPath = function({ defaultPath }) {
  const fn = function(input) {
    const defaultConfigPath = path.resolve(__dirname, defaultPath);
    return { ...input, defaultConfigPath };
  } as ReturnType<SetDefaultConfigPath>;
  fn.prototype.name = "setDefaultConfigPath";
  return fn;
} as SetDefaultConfigPath;
// setDefaultConfigPath.prototype.name = 'setDefaultConfigPath'

/**
 * Sets the user specified config path (if any)
 * Ex: a user might say they have a config: `myScript --c ./hello.yml`
 * This would extract the `./hello.yml` value
 *
 * optionNames -> input + argsObject -> input + userSpecifiedConfigPath
 */
export const setUserConfigPath = function({ optionNames }) {
  const fn = function({ argsObj, ...input }) {
    const configOptionsSpecified = optionNames.filter((c) => argsObj[c]);
    if (configOptionsSpecified.length > 1) {
      const message = `Can't specify multiple config options: ${optionNames}. They mean the same thing. Pick one!`;
      logger(LOG_LEVEL.ERROR, message);
      process.exit(1);
    } else if (configOptionsSpecified.length === 1) {
      const userSpecifiedConfigPath = argsObj[configOptionsSpecified[0]];

      return { ...input, argsObj, userSpecifiedConfigPath };
    }
    return { ...input, argsObj, userSpecifiedConfigPath: undefined };
  } as ReturnType<SetUserConfigPath>;
  fn.prototype.name = "setUserConfigPath";
  return fn;
} as SetUserConfigPath;

/**
 * Resolves the config path from either the user defined path or the default path, whichever is valid first
 * Returns the configPath as an absolute path
 *
 * input + originDir + defaultConfigPath + userSpecifiedConfigPath -> input + configPath
 */
export const calcConfigPath = function({
  originDir,
  defaultConfigPath,
  userSpecifiedConfigPath,
  ...input
}) {
  if (!userSpecifiedConfigPath) {
    return {
      ...input,
      originDir,
      defaultConfigPath,
      userSpecifiedConfigPath,
      configPath: defaultConfigPath,
    };
  }

  const userConfigPath = path.resolve(originDir, userSpecifiedConfigPath);
  let p;
  if (fs.existsSync(userConfigPath)) {
    p = userConfigPath;
  } else {
    p = defaultConfigPath;
  }
  return {
    ...input,
    originDir,
    defaultConfigPath,
    userSpecifiedConfigPath,
    configPath: p,
  };
} as CalcConfigPath;
calcConfigPath.prototype.name = "calcConfigPath";

/**
 * Sets the config object by loading the file at the config path
 *
 * input + configPath -> input + configObj
 */
export const getConfigObject = function({ configPath, ...input }) {
  const configExtName = path.extname(configPath);

  let configObj;
  if (configExtName === ".json") {
    const raw = fs.readFileSync(configPath, "utf8");
    const json = JSON.parse(stripJsonComments(raw));
    configObj = JSON.parse(JSON.stringify(json));
  } else if (configExtName === ".js") {
    configObj = require(configPath);
  } else {
    const message = `Config file extension type not supported`;
    logger(LOG_LEVEL.ERROR, message, configExtName);
    process.exit(1);
  }

  return { ...input, configPath, configObj };
} as GetConfigObject;
getConfigObject.prototype.name = "getConfigObject";

/**
 * Removes options from the agsObj
 * This is useful if a user supplies input options that an executor responds to but the
 * end CLI script doesn't and you want to remove them after calling an executor with them
 *
 * optionNames -> input + argsObj -> input + argsObj
 */
export const removeOptionsFromArgsObj = function({ optionNames }) {
  const fn = function({ argsObj, ...input }) {
    const newArgObject = { ...argsObj };
    optionNames.forEach((o) => {
      if (newArgObject[o]) {
        delete newArgObject[o];
      }
    });

    return { ...input, argsObj: newArgObject };
  } as ReturnType<RemoveOptionsFromArgsObj>;
  fn.prototype.name = "removeOptionsFromArgsObj";
  return fn;
} as RemoveOptionsFromArgsObj;

/**
 * Creates an args array from an args object
 * This argsArr is used to build commands to call a cli script with
 *
 * input + argsObj -> input + argsArr
 */
export const setArgsArr = function({ argsObj, ...input }) {
  const argsArr = Object.keys(argsObj).reduce(
    (acc, option) => {
      if (option === "_" || option === "$0") return acc;
      const value = argsObj[option];
      if (option.length === 1) {
        acc.push(`-${option}`);
      } else {
        acc.push(`--${option}`);
      }
      acc.push(value);
      return acc;
    },
    [] as Array<string>
  );
  return { ...input, argsObj, argsArr };
} as SetArgsArr;
setArgsArr.prototype.name = "setArgsArr";

/**
 * Modifies fields in the config object such that relative fields become absolute fields
 * Paths relative to the caller repo are made into absolute paths.
 * A shouldModifyFn is used to evaluate whether relative paths should be modified
 * In some cases, like when the relative path is `<originDir>/somePath` (jest) we want to leave the relative path as is
 * because the cli script will still evaluate it correctly as long as the `originDir` is set in the config obj
 *
 * shouldModifyPath, fieldsWithModifiablePaths -> input + configObj + originDir -> input + configObj
 */
export const modifyRelativePathsInConfigObject = function({
  shouldModifyPath,
  fieldsWithModifiablePaths,
}) {
  const fn = function({ configObj, originDir, ...input }) {
    fieldsWithModifiablePaths.forEach((p) => {
      // TODO FIX ME
      const value = (get(configObj, p) as any) as string;
      if (!value) {
        return;
      } else if (Array.isArray(value)) {
        const newValues = value.map((v) =>
          !shouldModifyPath(v) || path.isAbsolute(v)
            ? v
            : path.resolve(originDir, v)
        );
        set(configObj, p, newValues);
      } else {
        const newValue =
          !shouldModifyPath(value) || path.isAbsolute(value)
            ? value
            : path.resolve(originDir, value);
        set(configObj, p, newValue);
      }
    });

    return { ...input, configObj, originDir };
  } as ReturnType<ModifyRelativePathsInConfigObject>;
  fn.prototype.name = "modifyRelativePathsInConfigObject";

  return fn;
} as ModifyRelativePathsInConfigObject;

/**
 * Adds fields to the config object
 * Certain scripts may need to have their config modified
 *
 * Ex: In Jest, the `originDir` should be set if it isn't and in TSC the `includes` should be set if it isn't
 * The fieldsUpdater takes a configObj and returns lodash compatible object fields and the new values
 *
 * (updater = IState & OriginDir & ConfigObj -> { [fieldPath: string]: string | IConfigObjInner }) -> input + originDir + configObj -> input + configObj
 */
export const addFieldsToConfigObject = function({ fieldsUpdater }) {
  const fn = function({ originDir, configObj, ...input }) {
    const newConfigObj = { ...configObj };
    const fieldPathsToModify = fieldsUpdater({ configObj, originDir, input });

    Object.keys(fieldPathsToModify).forEach((path) => {
      const value = fieldPathsToModify[path];
      set(newConfigObj, path, value);
    });

    return { ...input, originDir, configObj: newConfigObj };
  } as ReturnType<AddFieldsToConfigObject>;
  fn.prototype.name = "addFieldsToConfigObject";
  return fn;
} as AddFieldsToConfigObject;

/**
 * Writes a configObj to a file path relative to the script
 *
 * path -> input + configObj -> input + tempConfigFilePath
 */
export const writeConfigObjectToPath = function({ tempConfigFilePath }) {
  const fn = function({ configObj, ...input }) {
    let absPath;
    if (path.isAbsolute(tempConfigFilePath)) {
      absPath = tempConfigFilePath;
    } else {
      absPath = path.resolve(__dirname, tempConfigFilePath);
    }

    const configExtName = path.extname(absPath);

    fs.writeFileSync(
      absPath,
      configExtName === ".json" ? JSON.stringify(configObj, null, 2) : configObj
    );

    return { ...input, configObj, tempConfigFilePath: absPath };
  } as ReturnType<WriteConfigObjectToPath>;
  fn.prototype.name = "writeConfigObjectToPath";
  return fn;
} as WriteConfigObjectToPath;

// Note: generateCommand is not enabled because it is too specific. This executor will have to be generated for each script
// // generateCommand: binLocation -> input + tempConfigObjPath + configObj + argsArr -> input + command
// export type GenerateCommand = (config: { scriptBinPath: string }) => (input: IState & TempConfigPath & ConfigObj & ArgsArr) => {command: string} & IState
// export type Command = ReturnType<GenerateCommand>

/**
 * Execute the cli command
 *
 * input + command -> input + commandStatus
 */
export const executeCommand = function({ command, ...input }) {
  let commandStatus;
  try {
    execSync(command, { stdio: "inherit" });
    commandStatus = { message: "Success", code: 0 };
  } catch (e) {
    commandStatus = {
      message: e ? e.message || e : "Error running script",
      code: 1,
    };

    process.exit(1);
  }

  return { ...input, commandStatus };
} as ExecuteCommand;
executeCommand.prototype.name = "executeCommand";

/**
 * FORWARD BUILT originDir
 */
export const setSpecifiedOriginDir = function({ argsObj, ...input }) {
  const originDir =
    argsObj["@scriptsBuilderOriginDir"] ||
    process.argv[1].split("node_modules")[0]; // <-- new
  // console.log(
  //   "dirname",
  //   path.resolve(__dirname),
  //   "process argv1",
  //   process.argv[1]
  // );

  return { ...input, argsObj, originDir };
} as SetSpecifiedOriginDir;
setSpecifiedOriginDir.prototype.name = "setSpecifiedOriginDir";

export const setConfigFileName = function({
  configFileName,
}: {
  configFileName: string;
}) {
  const fn = function(input: IState) {
    return { ...input, configFileName };
  };
  fn.prototype.name = "setConfigFileName";
  return fn;
};

enum LOCATION {
  ABOVE = "above",
  BELOW = "below",
  EVEN = "even",
}

export type SetLastDirToCallProcess = (
  input: IState
) => { dirToCallProcess: string } & IState;
export type DirToCallProcess = ReturnType<SetLastDirToCallProcess>;

export const setLastDirToCallProcess = function(state) {
  const dirToCallProcess = process.argv[1].split("node_modules")[0];
  return { ...state, dirToCallProcess };
} as SetLastDirToCallProcess;
setLastDirToCallProcess.prototype.name = "setLastDirToCallProcess";

export const calcScriptsBuilderLocationRelativeToCallee = function({
  originDir,
  ...input
}: IState & OriginDir) {
  const scriptsBuilderDir = path.resolve(__dirname).split("/").length;
  const callee = path.resolve(originDir).split("/").length;

  let location: LOCATION;
  if (scriptsBuilderDir < callee) {
    location = LOCATION.ABOVE;
  } else if (scriptsBuilderDir > callee) {
    location = LOCATION.BELOW;
  } else {
    location = LOCATION.EVEN;
  }

  return {
    ...input,
    originDir,
    scriptsBuilderLocationRelativeToCallee: location,
  };
};
calcScriptsBuilderLocationRelativeToCallee.prototype.name =
  "calcScriptsBuilderLocationRelativeToCallee";

type FindFn = (currentDir: string, state: IState) => string | undefined;
const walkUpwardsApplyingFindFn = (
  dirOne: string,
  dirTwo: string,
  findFn: FindFn,
  state: IState
) => {
  let shortDir: string[];
  let longDir: string[];

  const dirOneArr = dirOne.split("/");
  const dirTwoArr = dirTwo.split("/");

  if (dirOneArr.length < dirTwoArr.length) {
    shortDir = dirOneArr;
    longDir = dirTwoArr;
  } else {
    longDir = dirOneArr;
    shortDir = dirTwoArr;
  }

  let foundDir = undefined;
  while (longDir.length > shortDir.length) {
    const result = findFn(longDir.join("/"), state);
    if (result) {
      // replace existing if found to allow higher dirs that match the findFn to take precedence
      foundDir = result;
    }
    longDir.pop();
  }
  return foundDir;
};

type TraverseDirectoriesAndFind = (config: {
  findFn: FindFn;
}) => (
  input: IState & OriginDir & DirToCallProcess
) => { traversedAndFoundDirectory?: string } & OriginDir & IState;
type TraversedAndFoundDirectory = ReturnType<
  ReturnType<TraverseDirectoriesAndFind>
>;

export const traverseDirectoriesAndFind = function({ findFn }) {
  const fn = function({ originDir, dirToCallProcess, ...state }) {
    const scriptsBuilderDir = path.resolve(__dirname);
    const calleeDir = path.resolve(originDir);
    const dirToCallProcessDir = path.resolve(dirToCallProcess);

    const fullState = { ...state, originDir, dirToCallProcess };
    let foundDir: string | undefined;
    foundDir =
      findFn(calleeDir, fullState) || // most priority
      findFn(dirToCallProcessDir, fullState) ||
      walkUpwardsApplyingFindFn(
        scriptsBuilderDir,
        calleeDir,
        findFn,
        fullState
      ); // least priority

    return {
      ...state,
      originDir,
      dirToCallProcess,
      traversedAndFoundDirectory: foundDir,
    };
  } as ReturnType<TraverseDirectoriesAndFind>;
  fn.prototype.name = "traverseDirectoriesAndFind";
  return fn;
} as TraverseDirectoriesAndFind;

export type SetScriptName = (input: IState) => { scriptName: string } & IState;
export type ScriptName = ReturnType<SetScriptName>;

export const setScriptName = function(state) {
  const scriptName = process.argv[2];
  return { ...state, scriptName };
} as SetScriptName;
setScriptName.prototype.name = "setScriptName";

export const extractAndSetConfiguredScriptInfo = function({
  traversedAndFoundDirectory,
  scriptName,
  ...state
}: IState & TraversedAndFoundDirectory & ScriptName) {
  if (!traversedAndFoundDirectory) {
    logger(
      LOG_LEVEL.ERROR,
      "Error specifying package.json location",
      traversedAndFoundDirectory
    );
    return { ...state, traversedAndFoundDirectory, scriptName };
  }

  const packageJSON = require(traversedAndFoundDirectory);
  if (!packageJSON || !packageJSON.scriptsBuilder) {
    logger(
      LOG_LEVEL.ERROR,
      "package.json not found at location:",
      traversedAndFoundDirectory
    );
    return { ...state, traversedAndFoundDirectory, scriptName };
  }

  const aliasInformation = packageJSON.scriptsBuilder[scriptName];
  if (!aliasInformation) {
    logger(LOG_LEVEL.ERROR, "script alias not found", scriptName);
    return { ...state, traversedAndFoundDirectory, scriptName };
  }

  const { scriptName: newScriptName, configFilename } = aliasInformation;

  return {
    ...state,
    traversedAndFoundDirectory,
    scriptName: newScriptName,
    configFilename,
  };
};
extractAndSetConfiguredScriptInfo.prototype.name =
  "extractAndSetConfiguredScriptInfo";
// export const findScriptPath = (function({ originDir, configFileName, ...input }) {

// })

// export const findDefaultConfigPath = (function() {

// })

// 1. find script
// recurse down from origin repo
// look at package.json for scriptBuilderDir
// if dir is not found, keep walking down path towards scriptBuilder recursively
// if dir is found, get script location

// 2. find config
// recurse down from origin repo
// look for config that matches scripts configName
// if no config is found, keep walking down path towards scriptBuilder recurisvely
// if config is found, get config location

// scriptAliases: {
//   alias: {
//     originScriptName: string
//     configFilename: string
//   }
// }
