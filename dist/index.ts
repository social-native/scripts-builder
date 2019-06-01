'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));
var yargs = _interopDefault(require('yargs'));
var fs = _interopDefault(require('fs'));
var get = _interopDefault(require('lodash.get'));
var set = _interopDefault(require('lodash.set'));
var stripJsonComments = _interopDefault(require('strip-json-comments'));

(function (LOG_LEVEL) {
    LOG_LEVEL["DEBUG"] = "debug";
    LOG_LEVEL["INFO"] = "info";
    LOG_LEVEL["WARN"] = "warn";
    LOG_LEVEL["ERROR"] = "error";
})(exports.LOG_LEVEL || (exports.LOG_LEVEL = {}));
const logger = (level, message, data) => {
    data ? console.log(level, message, data) : console.log(level, message);
};
/**
 * Creates a process.arg array from an object of { argName: argValue }
 */
const compileArgs = (parsedArgs) => {
    const args = Object.keys(parsedArgs).reduce((acc, option) => {
        if (option === "_" || option === "$0")
            return acc;
        const value = parsedArgs[option];
        if (option.length === 1) {
            acc.push(`-${option}`);
        }
        else {
            acc.push(`--${option}`);
        }
        acc.push(value);
        return acc;
    }, []);
    logger(exports.LOG_LEVEL.DEBUG, "Compiled args object into args array", args);
    return args;
};
/**
 * Initializes a script
 */
const initializeScript = () => {
    // Makes the script crash on unhandled rejections instead of silently
    // ignoring them. In the future, promise rejections that are not handled will
    // terminate the Node.js process with a non-zero exit code.
    process.on("unhandledRejection", err => {
        throw err;
    });
    logger(exports.LOG_LEVEL.DEBUG, "Ran initialize script");
};
/**
 * Returns the raw passed in args to the script
 */
const scriptArgs = () => {
    const args = process.argv.slice(2);
    logger(exports.LOG_LEVEL.DEBUG, "Script args", args);
    return args;
};
/**
 * Returns the absolute path to the default config file for the script
 */
const getDefaultConfigPath = (defaultConfigFileName) => {
    const p = path.resolve(__dirname, defaultConfigFileName);
    logger(exports.LOG_LEVEL.DEBUG, "Default config path", p);
    return p;
};
/**
 * Returns the absolute path to the origin directory of the repo calling this script
 * The origin directory is the first valid path outside all node module nesting
 */
const getOriginDir = () => {
    const originDir = process.argv0.split("node_modules")[0];
    logger(exports.LOG_LEVEL.DEBUG, "Origin dir", originDir);
    return originDir;
};
/**
 * Parse process.argv into an arg object
 */
const getParsedArgs = () => {
    const argsObj = yargs.parse(scriptArgs());
    logger(exports.LOG_LEVEL.DEBUG, "Args object", argsObj);
    return argsObj;
};
/**
 * Extract config location from args
 */
const extractConfigLocationFromArgs = (argObject, configOptionNames) => {
    const configOptionsSpecified = configOptionNames.filter(c => argObject[c]);
    if (configOptionsSpecified.length > 1) {
        const message = `Can't specify multiple config options: ${configOptionNames}. They mean the same thing. Pick one!`;
        logger(exports.LOG_LEVEL.ERROR, message);
        process.exit(1);
    }
    else if (configOptionsSpecified.length === 1) {
        const configLocationFromArgs = argObject[configOptionsSpecified[0]];
        logger(exports.LOG_LEVEL.DEBUG, "Found specified config location", {
            configKey: configOptionsSpecified,
            location: configLocationFromArgs
        });
        return configLocationFromArgs;
    }
};
/**
 * Extract user specified config location from args
 */
const removeOptionsFromArgsObject = (argObject, options) => {
    const newArgObject = { ...argObject };
    options.forEach(o => {
        if (newArgObject[o]) {
            delete newArgObject[o];
        }
    });
    logger(exports.LOG_LEVEL.DEBUG, "Removed options from args object", {
        newObj: newArgObject,
        removed: options
    });
    return newArgObject;
};
/**
 * Check if user config exists, if not use the default config location
 */
const generateConfigPath = (originDir, defaultPath, userDefinedPath) => {
    if (!userDefinedPath) {
        logger(exports.LOG_LEVEL.DEBUG, "Config path", defaultPath);
        return defaultPath;
    }
    const userConfigPath = path.resolve(originDir, userDefinedPath);
    let p;
    if (fs.existsSync(userConfigPath)) {
        p = userConfigPath;
    }
    else {
        p = defaultPath;
    }
    logger(exports.LOG_LEVEL.DEBUG, "Config path", p);
    return p;
};
const importJson = (path) => {
    const raw = fs.readFileSync(path, "utf8");
    return JSON.parse(stripJsonComments(raw));
};
/**
 * Import config
 */
const importConfig = (configLocation) => {
    const configExtName = path.extname(configLocation);
    // console.log('Config file ext', configExtName)
    if (configExtName === ".json") {
        const config = importJson(configLocation); // todo ref from common module
        const json = JSON.parse(JSON.stringify(config));
        logger(exports.LOG_LEVEL.DEBUG, "Imported json config", json);
        return json;
    }
    else if (configExtName === ".js") {
        const js = require(configLocation);
        logger(exports.LOG_LEVEL.DEBUG, "Imported js config", js);
        return js;
    }
    else {
        const message = `Config file extension type not supported`;
        logger(exports.LOG_LEVEL.ERROR, message, configExtName);
        process.exit(1);
    }
};
/**
 * Add absolute paths to config file paths
 */
const addAbsPathsToConfigPaths = (configObject, modifiableConfigPaths, originPath, shouldModifyPathFn = () => true) => {
    modifiableConfigPaths.forEach(p => {
        const value = get(configObject, p);
        if (!value) {
            return;
        }
        else if (Array.isArray(value)) {
            const newValues = value.map(v => !shouldModifyPathFn(v) || path.isAbsolute(v)
                ? v
                : path.resolve(originPath, v));
            set(configObject, p, newValues);
        }
        else {
            const newValue = !shouldModifyPathFn(value) || path.isAbsolute(value)
                ? value
                : path.resolve(originPath, value);
            set(configObject, p, newValue);
        }
    });
    logger(exports.LOG_LEVEL.DEBUG, "Added abs paths to config", configObject);
    return configObject;
};
//# sourceMappingURL=common.js.map

exports.addAbsPathsToConfigPaths = addAbsPathsToConfigPaths;
exports.compileArgs = compileArgs;
exports.extractConfigLocationFromArgs = extractConfigLocationFromArgs;
exports.generateConfigPath = generateConfigPath;
exports.getDefaultConfigPath = getDefaultConfigPath;
exports.getOriginDir = getOriginDir;
exports.getParsedArgs = getParsedArgs;
exports.importConfig = importConfig;
exports.initializeScript = initializeScript;
exports.logger = logger;
exports.removeOptionsFromArgsObject = removeOptionsFromArgsObject;
exports.scriptArgs = scriptArgs;
