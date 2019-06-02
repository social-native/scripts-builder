'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));
var yargs = _interopDefault(require('yargs'));
var fs = _interopDefault(require('fs'));
var get = _interopDefault(require('lodash.get'));
var set = _interopDefault(require('lodash.set'));
var stripJsonComments = _interopDefault(require('strip-json-comments'));
var __chunk_1 = require('../../chunk-90e31c2e.js');
var child_process = require('child_process');

/**
 * Initialize a script
 * input -> input
 */
const initializeScript = (function (input) {
    // Makes the script crash on unhandled rejections instead of silently
    // ignoring them. In the future, promise rejections that are not handled will
    // terminate the Node.js process with a non-zero exit code.
    process.on("unhandledRejection", err => {
        __chunk_1.logger(__chunk_1.LOG_LEVEL.ERROR, 'Error initializing script', err);
        throw err;
    });
    return { ...input };
});
initializeScript.prototype.name = 'initializeScript';
/**
 * Sets the origin directory of the caller to state
 * input -> input + originDir
 */
const setOriginDir = (function (input) {
    const originDir = process.argv0.split("node_modules")[0];
    return { ...input, originDir };
});
setOriginDir.prototype.name = 'setOriginDir';
/**
 * Sets the argsObject (derived from calling the script with options) to state
 *
 * input -> input + argsObject
 */
const setArgsObject = (function (input) {
    const argsArr = process.argv.slice(2);
    const argsObj = yargs.parse(argsArr);
    return { ...input, argsObj };
});
setArgsObject.prototype.name = 'setArgsObject';
/**
 * Sets the default config file path for the script
 * Ex: a script may have a default config as `./config.json`
 *
 * defaultPath -> input -> input + defaultConfigPath
 */
// // setDefaultConfigPath: defaultPath -> input -> input + defaultConfigPath
const setDefaultConfigPath = (function ({ defaultPath }) {
    const fn = (function (input) {
        const defaultConfigPath = path.resolve(__dirname, defaultPath);
        return { ...input, defaultConfigPath };
    });
    fn.prototype.name = 'setDefaultConfigPath';
    return fn;
});
// setDefaultConfigPath.prototype.name = 'setDefaultConfigPath'
/**
 * Sets the user specified config path (if any)
 * Ex: a user might say they have a config: `myScript --c ./hello.yml`
 * This would extract the `./hello.yml` value
 *
 * optionNames -> input + argsObject -> input + userSpecifiedConfigPath
 */
const setUserConfigPath = (function ({ optionNames }) {
    const fn = (function ({ argsObj, ...input }) {
        const configOptionsSpecified = optionNames.filter(c => argsObj[c]);
        if (configOptionsSpecified.length > 1) {
            const message = `Can't specify multiple config options: ${optionNames}. They mean the same thing. Pick one!`;
            __chunk_1.logger(__chunk_1.LOG_LEVEL.ERROR, message);
            process.exit(1);
        }
        else if (configOptionsSpecified.length === 1) {
            const userSpecifiedConfigPath = argsObj[configOptionsSpecified[0]];
            return { ...input, argsObj, userSpecifiedConfigPath };
        }
        return { ...input, argsObj };
    });
    fn.prototype.name = 'setUserConfigPath';
    return fn;
});
/**
 * Resolves the config path from either the user defined path or the default path, whichever is valid first
 * Returns the configPath as an absolute path
 *
 * input + originDir + defaultConfigPath + userSpecifiedConfigPath -> input + configPath
 */
const calcConfigPath = (function ({ originDir, defaultConfigPath, userSpecifiedConfigPath, ...input }) {
    if (!userSpecifiedConfigPath) {
        return { ...input, configPath: defaultConfigPath };
    }
    const userConfigPath = path.resolve(originDir, userSpecifiedConfigPath);
    let p;
    if (fs.existsSync(userConfigPath)) {
        p = userConfigPath;
    }
    else {
        p = defaultConfigPath;
    }
    return { ...input, originDir, defaultConfigPath, userSpecifiedConfigPath, configPath: p };
});
calcConfigPath.prototype.name = 'calcConfigPath';
/**
 * Sets the config object by loading the file at the config path
 *
 * input + configPath -> input + configObj
 */
const getConfigObject = (function ({ configPath, ...input }) {
    const configExtName = path.extname(configPath);
    let configObj;
    if (configExtName === ".json") {
        const raw = fs.readFileSync(configPath, "utf8");
        const json = JSON.parse(stripJsonComments(raw));
        configObj = JSON.parse(JSON.stringify(json));
    }
    else if (configExtName === ".js") {
        configObj = require(configPath);
    }
    else {
        const message = `Config file extension type not supported`;
        __chunk_1.logger(__chunk_1.LOG_LEVEL.ERROR, message, configExtName);
        process.exit(1);
    }
    return { ...input, configPath, configObj };
});
getConfigObject.prototype.name = 'getConfigObject';
/**
 * Removes options from the agsObj
 * This is useful if a user supplies input options that an executor responds to but the
 * end CLI script doesn't and you want to remove them after calling an executor with them
 *
 * optionNames -> input + argsObj -> input + argsObj
 */
const removeOptionsFromArgsObj = (function ({ optionNames }) {
    const fn = (function ({ argsObj, ...input }) {
        const newArgObject = { ...argsObj };
        optionNames.forEach(o => {
            if (newArgObject[o]) {
                delete newArgObject[o];
            }
        });
        return { ...input, argsObj: newArgObject };
    });
    fn.prototype.name = 'removeOptionsFromArgsObj';
    return fn;
});
/**
 * Creates an args array from an args object
 * This argsArr is used to build commands to call a cli script with
 *
 * input + argsObj -> input + argsArr
 */
const setArgsArr = (function ({ argsObj, ...input }) {
    const argsArr = Object.keys(argsObj).reduce((acc, option) => {
        if (option === "_" || option === "$0")
            return acc;
        const value = argsObj[option];
        if (option.length === 1) {
            acc.push(`-${option}`);
        }
        else {
            acc.push(`--${option}`);
        }
        acc.push(value);
        return acc;
    }, []);
    return { ...input, argsObj, argsArr };
});
setArgsArr.prototype.name = 'setArgsArr';
/**
 * Modifies fields in the config object such that relative fields become absolute fields
 * Paths relative to the caller repo are made into absolute paths.
 * A shouldModifyFn is used to evaluate whether relative paths should be modified
 * In some cases, like when the relative path is `<originDir>/somePath` (jest) we want to leave the relative path as is
 * because the cli script will still evaluate it correctly as long as the `originDir` is set in the config obj
 *
 * shouldModifyPath, fieldsWithModifiablePaths -> input + configObj + originDir -> input + configObj
 */
const modifyRelativePathsInConfigObject = (function ({ shouldModifyPath, fieldsWithModifiablePaths }) {
    const fn = (function ({ configObj, originDir, ...input }) {
        fieldsWithModifiablePaths.forEach(p => {
            // TODO FIX ME
            const value = get(configObj, p);
            if (!value) {
                return;
            }
            else if (Array.isArray(value)) {
                const newValues = value.map(v => !shouldModifyPath(v) || path.isAbsolute(v)
                    ? v
                    : path.resolve(originDir, v));
                set(configObj, p, newValues);
            }
            else {
                const newValue = !shouldModifyPath(value) || path.isAbsolute(value)
                    ? value
                    : path.resolve(originDir, value);
                set(configObj, p, newValue);
            }
        });
        return { ...input, configObj, originDir };
    });
    fn.prototype.name = 'modifyRelativePathsInConfigObject';
    return fn;
});
/**
 * Adds fields to the config object
 * Certain scripts may need to have their config modified
 *
 * Ex: In Jest, the `originDir` should be set if it isn't and in TSC the `includes` should be set if it isn't
 * The fieldsUpdater takes a configObj and returns lodash compatible object fields and the new values
 *
 * (updater = IState & OriginDir & ConfigObj -> { [fieldPath: string]: string | IConfigObjInner }) -> input + originDir + configObj -> input + configObj
 */
const addFieldsToConfigObject = (function ({ fieldsUpdater }) {
    const fn = (function ({ originDir, configObj, ...input }) {
        const newConfigObj = { ...configObj };
        const fieldPathsToModify = fieldsUpdater({ configObj, originDir, input });
        Object.keys(fieldPathsToModify).forEach(path => {
            const value = fieldPathsToModify[path];
            set(newConfigObj, path, value);
        });
        return { ...input, originDir, configObj: newConfigObj };
    });
    fn.prototype.name = 'addFieldsToConfigObject';
    return fn;
});
/**
 * Writes a configObj to a file path relative to the script
 *
 * path -> input + configObj -> input + tempConfigFilePath
 */
const writeConfigObjectToPath = (function ({ tempConfigFilePath }) {
    const fn = (function ({ configObj, ...input }) {
        let absPath;
        if (path.isAbsolute(tempConfigFilePath)) {
            absPath = tempConfigFilePath;
        }
        else {
            absPath = path.resolve(__dirname, tempConfigFilePath);
        }
        const configExtName = path.extname(absPath);
        fs.writeFileSync(absPath, configExtName === '.json' ? JSON.stringify(configObj, null, 2) : configObj);
        return { ...input, configObj, tempConfigFilePath: absPath };
    });
    fn.prototype.name = 'writeConfigObjectToPath';
    return fn;
});
// // generateCommand: binLocation -> input + tempConfigObjPath + configObj + argsArr -> input + command
// export type GenerateCommand = (config: { scriptBinPath: string }) => (input: IState & TempConfigPath & ConfigObj & ArgsArr) => {command: string} & IState
// export type Command = ReturnType<GenerateCommand>
/**
 * Execute the cli command
 *
 * input + command -> input + commandStatus
 */
const executeCommand = (function ({ command, ...input }) {
    let commandStatus;
    try {
        child_process.execSync(command, { stdio: "inherit" });
        commandStatus = { message: 'Success', code: 0 };
    }
    catch (e) {
        commandStatus = {
            message: e ? e.message || e : 'Error running script',
            code: 1
        };
        // process.exit(1);
    }
    return { ...input, commandStatus };
});
executeCommand.prototype.name = 'executeCommand';
// setArgsObject(setOriginDir(initializeScript({})))

// import isEqual from 'lodash.isequal';
// const getObjectDiff = (obj1: any, obj2: any) => {
//   const diff = Object.keys(obj1).reduce((result, key) => {
//       if (!obj2.hasOwnProperty(key)) {
//           result.push(key);
//       } else if (isEqual(obj1[key], obj2[key])) {
//           const resultKeyIndex = result.indexOf(key);
//           result.splice(resultKeyIndex, 1);
//       }
//       return result;
//   }, Object.keys(obj2));
//   return diff;
// }
const loggingEntryAndExit = ((next) => (executor, state) => {
    const name = executor.prototype ? executor.prototype.name : 'hi';
    __chunk_1.logger(__chunk_1.LOG_LEVEL.DEBUG, 'Entering:', name);
    const nextState = next(executor, state);
    __chunk_1.logger(__chunk_1.LOG_LEVEL.DEBUG, 'Exited', name);
    return nextState;
});
const logStateChange = ((next) => (executor, state) => {
    const startState = { ...state };
    __chunk_1.logger(__chunk_1.LOG_LEVEL.DEBUG, 'Start state', startState);
    const nextState = next(executor, state);
    // logger(LOG_LEVEL.DEBUG, 'State change', getObjectDiff(startState, nextState))
    return nextState;
});

const evaluator = (executor, state) => executor(state);
const applyMiddleware = (executors, middleware) => () => {
    const compiled = middleware.reduce((acc, m) => {
        return m(acc);
    }, evaluator);
    return executors.reduce((state, executor) => {
        if (!compiled) {
            return executor(state);
        }
        return compiled(executor, state);
    }, {});
};
// const ejectScript = (executors: Executor[], middleware?: Middleware[]) => {
//   const { configObj, defaultConfigPath, originDir }= executors.reduce((acc, e: Executor) => {
//     if (middleware && middleware.length > 0) {
//       acc = middleware.forEach(m => m(acc, e)
//     }
//     acc = e(acc)
//     if (e.prototype.name === 'getConfigObject') {
//       break;
//     }
//   }, {} as IState) as ConfigObj & DefaultConfigPath & OriginDir;
//   writefile to originDir with configName
//   install node modules
//   swap out script with direct call to cli
//   // if (!configObj) { logger(LOG_LEVEL.ERROR, 'No config object found')}
// }
// const createConfigPatch

const generateJestCommand = (({ tempConfigFilePath, configObj, argsArr, ...input }) => {
    const commandArgs = argsArr.concat(`--config ${tempConfigFilePath}`);
    const binLocation = path.resolve(__dirname, "../../../", "node_modules/.bin/jest");
    const command = `${binLocation} ${commandArgs.join(" ")}`;
    return { ...input, configObj, argsArr, tempConfigFilePath, command };
});
const executors = [
    initializeScript,
    setOriginDir,
    setArgsObject,
    setDefaultConfigPath({ defaultPath: 'config.js' }),
    setUserConfigPath({ optionNames: ['config', 'c'] }),
    calcConfigPath,
    getConfigObject,
    removeOptionsFromArgsObj({ optionNames: ['config', 'c'] }),
    setArgsArr,
    modifyRelativePathsInConfigObject({
        shouldModifyPath: (path) => !path.includes("<rootDir>"),
        fieldsWithModifiablePaths: [
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
        ]
    }),
    addFieldsToConfigObject({
        fieldsUpdater: ({ originDir }) => ({
            'rootDir': originDir
        })
    }),
    writeConfigObjectToPath({ tempConfigFilePath: './generatedConfig.json' }),
    generateJestCommand,
    executeCommand,
];
const middleware = [
    logStateChange,
    loggingEntryAndExit,
];
const script = applyMiddleware(executors, middleware);
script();
