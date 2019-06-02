import { InitializeScript, SetOriginDir, SetArgsObject, SetDefaultConfigPath, SetUserConfigPath, CalcConfigPath, GetConfigObject, RemoveOptionsFromArgsObj, SetArgsArr, ModifyRelativePathsInConfigObject, AddFieldsToConfigObject, WriteConfigObjectToPath, ExecuteCommand } from './types';
/**
 * Initialize a script
 * input -> input
 */
export declare const initializeScript: InitializeScript;
/**
 * Sets the origin directory of the caller to state
 * input -> input + originDir
 */
export declare const setOriginDir: SetOriginDir;
/**
 * Sets the argsObject (derived from calling the script with options) to state
 *
 * input -> input + argsObject
 */
export declare const setArgsObject: SetArgsObject;
/**
 * Sets the default config file path for the script
 * Ex: a script may have a default config as `./config.json`
 *
 * defaultPath -> input -> input + defaultConfigPath
 */
export declare const setDefaultConfigPath: SetDefaultConfigPath;
/**
 * Sets the user specified config path (if any)
 * Ex: a user might say they have a config: `myScript --c ./hello.yml`
 * This would extract the `./hello.yml` value
 *
 * optionNames -> input + argsObject -> input + userSpecifiedConfigPath
 */
export declare const setUserConfigPath: SetUserConfigPath;
/**
 * Resolves the config path from either the user defined path or the default path, whichever is valid first
 * Returns the configPath as an absolute path
 *
 * input + originDir + defaultConfigPath + userSpecifiedConfigPath -> input + configPath
 */
export declare const calcConfigPath: CalcConfigPath;
/**
 * Sets the config object by loading the file at the config path
 *
 * input + configPath -> input + configObj
 */
export declare const getConfigObject: GetConfigObject;
/**
 * Removes options from the agsObj
 * This is useful if a user supplies input options that an executor responds to but the
 * end CLI script doesn't and you want to remove them after calling an executor with them
 *
 * optionNames -> input + argsObj -> input + argsObj
 */
export declare const removeOptionsFromArgsObj: RemoveOptionsFromArgsObj;
/**
 * Creates an args array from an args object
 * This argsArr is used to build commands to call a cli script with
 *
 * input + argsObj -> input + argsArr
 */
export declare const setArgsArr: SetArgsArr;
/**
 * Modifies fields in the config object such that relative fields become absolute fields
 * Paths relative to the caller repo are made into absolute paths.
 * A shouldModifyFn is used to evaluate whether relative paths should be modified
 * In some cases, like when the relative path is `<originDir>/somePath` (jest) we want to leave the relative path as is
 * because the cli script will still evaluate it correctly as long as the `originDir` is set in the config obj
 *
 * shouldModifyPath, fieldsWithModifiablePaths -> input + configObj + originDir -> input + configObj
 */
export declare const modifyRelativePathsInConfigObject: ModifyRelativePathsInConfigObject;
/**
 * Adds fields to the config object
 * Certain scripts may need to have their config modified
 *
 * Ex: In Jest, the `originDir` should be set if it isn't and in TSC the `includes` should be set if it isn't
 * The fieldsUpdater takes a configObj and returns lodash compatible object fields and the new values
 *
 * (updater = IState & OriginDir & ConfigObj -> { [fieldPath: string]: string | IConfigObjInner }) -> input + originDir + configObj -> input + configObj
 */
export declare const addFieldsToConfigObject: AddFieldsToConfigObject;
/**
 * Writes a configObj to a file path relative to the script
 *
 * path -> input + configObj -> input + tempConfigFilePath
 */
export declare const writeConfigObjectToPath: WriteConfigObjectToPath;
/**
 * Execute the cli command
 *
 * input + command -> input + commandStatus
 */
export declare const executeCommand: ExecuteCommand;
