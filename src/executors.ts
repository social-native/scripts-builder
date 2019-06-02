import { InitializeScript, SetOriginDir, SetArgsObject, IArgsObj, SetDefaultConfigPath, SetUserConfigPath, CalcConfigPath, GetConfigObject, RemoveOptionsFromArgsObj, SetArgsArr, ModifyRelativePathsInConfigObject, AddFieldsToConfigObject, WriteConfigObjectToPath, ExecuteCommand, GenerateCommand } from './types';
import yargs from "yargs";
import { logger, LOG_LEVEL } from './common';
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
export const initializeScript = ((input) => {
  // Makes the script crash on unhandled rejections instead of silently
  // ignoring them. In the future, promise rejections that are not handled will
  // terminate the Node.js process with a non-zero exit code.
  process.on("unhandledRejection", err => {
    logger(LOG_LEVEL.ERROR, 'Error initializing script', err)
    throw err;
  });

  return {...input}
}) as InitializeScript


/**
 * Sets the origin directory of the caller to state
 * input -> input + originDir
 */
export const setOriginDir = ((input) => {
  const originDir = process.argv0.split("node_modules")[0];
  return { ...input, originDir }
}) as SetOriginDir


/**
 * Sets the argsObject (derived from calling the script with options) to state
 * 
 * input -> input + argsObject
 */
export const setArgsObject = ((input) => {
  const argsArr = process.argv.slice(2);
  const argsObj = yargs.parse(argsArr) as IArgsObj['argsObj'];
  return { ...input, argsObj }
}) as SetArgsObject


/**
 * Sets the default config file path for the script
 * Ex: a script may have a default config as `./config.json`
 * 
 * defaultPath -> input -> input + defaultConfigPath
 */
// // setDefaultConfigPath: defaultPath -> input -> input + defaultConfigPath
export const setDefaultConfigPath = (({ defaultPath }) => (input) => {
  const defaultConfigPath = path.resolve(__dirname, defaultPath);
  return { ...input, defaultConfigPath}
}) as SetDefaultConfigPath


/**
 * Sets the user specified config path (if any)
 * Ex: a user might say they have a config: `myScript --c ./hello.yml`
 * This would extract the `./hello.yml` value
 * 
 * optionNames -> input + argsObject -> input + userSpecifiedConfigPath
 */
export const setUserConfigPath = (({ optionNames }) => ({ argsObj, ...input }) => {
  const configOptionsSpecified = optionNames.filter(c => argsObj[c]);
  if (configOptionsSpecified.length > 1) {
    const message = `Can't specify multiple config options: ${optionNames}. They mean the same thing. Pick one!`;
    logger(LOG_LEVEL.ERROR, message);
    process.exit(1);
  } else if (configOptionsSpecified.length === 1) {
    const userSpecifiedConfigPath = argsObj[configOptionsSpecified[0]];

    return { ...input, userSpecifiedConfigPath};
  }
}) as SetUserConfigPath


/**
 * Resolves the config path from either the user defined path or the default path, whichever is valid first
 * Returns the configPath as an absolute path
 * 
 * input + originDir + defaultConfigPath + userSpecifiedConfigPath -> input + configPath
 */
export const calcConfigPath = (({ originDir, defaultConfigPath, userSpecifiedConfigPath, ...input }) => {
  if (!userSpecifiedConfigPath) {
    return {...input, configPath: defaultConfigPath};
  }

  const userConfigPath = path.resolve(originDir, userSpecifiedConfigPath);
  let p;
  if (fs.existsSync(userConfigPath)) {
    p = userConfigPath;
  } else {
    p = defaultConfigPath;
  }
  return {...input, configPath: p}
}) as CalcConfigPath


/**
 * Sets the config object by loading the file at the config path
 * 
 * input + configPath -> input + configObj
 */
export const getConfigObject = (({ configPath, ...input }) => {
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

  return { ...input, configObj}
}) as GetConfigObject


/**
 * Removes options from the agsObj
 * This is useful if a user supplies input options that an executor responds to but the
 * end CLI script doesn't and you want to remove them after calling an executor with them
 * 
 * optionNames -> input + argsObj -> input + argsObj
 */
export const removeOptionsFromArgsObj = (({ optionNames }) => ({ argsObj, ...input}) => {
  const newArgObject = { ...argsObj };
  optionNames.forEach(o => {
    if (newArgObject[o]) {
      delete newArgObject[o];
    }
  });

  return { ...input, argsObj: newArgObject };
}) as RemoveOptionsFromArgsObj


/**
 * Creates an args array from an args object
 * This argsArr is used to build commands to call a cli script with
 * 
 * input + argsObj -> input + argsArr
 */
export const setArgsArr = (({ argsObj, ...input }) => {
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
  return {...input, argsArr};
}) as SetArgsArr


/**
 * Modifies fields in the config object such that relative fields become absolute fields
 * Paths relative to the caller repo are made into absolute paths.
 * A shouldModifyFn is used to evaluate whether relative paths should be modified
 * In some cases, like when the relative path is `<originDir>/somePath` (jest) we want to leave the relative path as is
 * because the cli script will still evaluate it correctly as long as the `originDir` is set in the config obj
 * 
 * shouldModifyPath, fieldsWithModifiablePaths -> input + configObj + originDir -> input + configObj
 */
export const modifyRelativePathsInConfigObject = (({ shouldModifyPath, fieldsWithModifiablePaths }) => ({ configObj, originDir, ...input}) => {
  fieldsWithModifiablePaths.forEach(p => {
    // TODO FIX ME
    const value = get(configObj, p) as any as string;
    if (!value) {
      return;
    } else if (Array.isArray(value)) {
      const newValues = value.map(v =>
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

  return { ...input, configObj };
}) as ModifyRelativePathsInConfigObject

/**
 * Adds fields to the config object
 * Certain scripts may need to have their config modified
 * 
 * Ex: In Jest, the `originDir` should be set if it isn't and in TSC the `includes` should be set if it isn't
 * The fieldsUpdater takes a configObj and returns lodash compatible object fields and the new values
 * 
 * (updater = IState & OriginDir & ConfigObj -> { [fieldPath: string]: string | IConfigObjInner }) -> input + originDir + configObj -> input + configObj
 */
export const addFieldsToConfigObject = (({ fieldsUpdater }) => ({ originDir, configObj, ...input }) => {
  const newConfigObj = { ...configObj };
  const fieldPathsToModify = fieldsUpdater({configObj, originDir, input});

  Object.keys(fieldPathsToModify).forEach(path => {
    const value = fieldPathsToModify[path];
    set(newConfigObj, path, value)
  })

  return { ...input, originDir, configObj: newConfigObj}
}) as AddFieldsToConfigObject


/**
 * Writes a configObj to a file path relative to the script
 * 
 * path -> input + configObj -> input + tempConfigFilePath
 */
export const writeConfigObjectToPath = (({ tempConfigFilePath }) => ({ configObj, ...input}) => {
  let absPath;
  if (path.isAbsolute(tempConfigFilePath)) {
    absPath = tempConfigFilePath;
  } else {
    absPath = path.resolve(__dirname, tempConfigFilePath);
  }

  const configExtName = path.extname(absPath);


  fs.writeFileSync(
    absPath,
    configExtName === '.json' ? JSON.stringify(configObj, null, 2) : configObj
  );

  return { ...input, tempConfigFilePath: absPath } 
}) as WriteConfigObjectToPath

// // generateCommand: binLocation -> input + tempConfigObjPath + configObj + argsArr -> input + command
// export type GenerateCommand = (config: { scriptBinPath: string }) => (input: IState & TempConfigPath & ConfigObj & ArgsArr) => {command: string} & IState
// export type Command = ReturnType<GenerateCommand>

/**
 * Execute the cli command
 * 
 * input + command -> input + commandStatus
 */
export const executeCommand = (({ command, ...input }) => {
  let commandStatus
  try {
    execSync(command, { stdio: "inherit" });
    commandStatus = { message: 'Success', code: 0 };
  } catch (e) {
    commandStatus = { 
      message: e ? e.message || e : 'Error running script',
      code: 1 
    };

    // process.exit(1);
  }

  return { ...input, commandStatus}
}) as ExecuteCommand


// setArgsObject(setOriginDir(initializeScript({})))

