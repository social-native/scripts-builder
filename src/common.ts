import path from "path";
import yargs from "yargs";
import fs from "fs";
import get from "lodash.get";
import set from "lodash.set";
import stripJsonComments from "strip-json-comments";
import { LOG_LEVEL, logger } from "./logger";
/**
 * Common code shared by `bin.js` and `scripts/`
 */

export interface IArgObject {
  [argName: string]: string;
}
/**
 * Creates a process.arg array from an object of { argName: argValue }
 */
export const compileArgs = (parsedArgs: IArgObject) => {
  const args = Object.keys(parsedArgs).reduce(
    (acc, option) => {
      if (option === "_" || option === "$0") return acc;
      const value = parsedArgs[option];
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
  logger(LOG_LEVEL.DEBUG, "Compiled args object into args array", args);
  return args;
};

/**
 * Initializes a script
 */
export const initializeScript = () => {
  // Makes the script crash on unhandled rejections instead of silently
  // ignoring them. In the future, promise rejections that are not handled will
  // terminate the Node.js process with a non-zero exit code.
  process.on("unhandledRejection", (err) => {
    throw err;
  });
  logger(LOG_LEVEL.DEBUG, "Ran initialize script");
};

/**
 * Returns the raw passed in args to the script
 */
export const scriptArgs = () => {
  const args = process.argv.slice(2);
  logger(LOG_LEVEL.DEBUG, "Script args", args);
  return args;
};

/**
 * Returns the absolute path to the default config file for the script
 */
export const getDefaultConfigPath = (defaultConfigFileName: string) => {
  const p = path.resolve(__dirname, defaultConfigFileName);
  logger(LOG_LEVEL.DEBUG, "Default config path", p);
  return p;
};

/**
 * Returns the absolute path to the origin directory of the repo calling this script
 * The origin directory is the first valid path outside all node module nesting
 */
export const getOriginDir = () => {
  const originDir = process.argv0.split("node_modules")[0];
  logger(LOG_LEVEL.DEBUG, "Origin dir", originDir);
  return originDir;
};

/**
 * Parse process.argv into an arg object
 */
export const getParsedArgs = () => {
  const argsObj = yargs.parse(scriptArgs()) as { [option: string]: string };
  logger(LOG_LEVEL.DEBUG, "Args object", argsObj);
  return argsObj;
};

/**
 * Extract config location from args
 */
export const extractConfigLocationFromArgs = (
  argObject: IArgObject,
  configOptionNames: string[]
) => {
  const configOptionsSpecified = configOptionNames.filter((c) => argObject[c]);
  if (configOptionsSpecified.length > 1) {
    const message = `Can't specify multiple config options: ${configOptionNames}. They mean the same thing. Pick one!`;
    logger(LOG_LEVEL.ERROR, message);
    process.exit(1);
  } else if (configOptionsSpecified.length === 1) {
    const configLocationFromArgs = argObject[configOptionsSpecified[0]];
    logger(LOG_LEVEL.DEBUG, "Found specified config location", {
      configKey: configOptionsSpecified,
      location: configLocationFromArgs,
    });
    return configLocationFromArgs;
  }
};

/**
 * Extract user specified config location from args
 */
export const removeOptionsFromArgsObject = (
  argObject: IArgObject,
  options: string[]
) => {
  const newArgObject = { ...argObject };
  options.forEach((o) => {
    if (newArgObject[o]) {
      delete newArgObject[o];
    }
  });
  logger(LOG_LEVEL.DEBUG, "Removed options from args object", {
    newObj: newArgObject,
    removed: options,
  });

  return newArgObject;
};

/**
 * Check if user config exists, if not use the default config location
 */
export const generateConfigPath = (
  originDir: string,
  defaultPath: string,
  userDefinedPath?: string
) => {
  if (!userDefinedPath) {
    logger(LOG_LEVEL.DEBUG, "Config path", defaultPath);

    return defaultPath;
  }

  const userConfigPath = path.resolve(originDir, userDefinedPath);
  let p;
  if (fs.existsSync(userConfigPath)) {
    p = userConfigPath;
  } else {
    p = defaultPath;
  }
  logger(LOG_LEVEL.DEBUG, "Config path", p);
  return p;
};

const importJson = (path: string) => {
  const raw = fs.readFileSync(path, "utf8");
  return JSON.parse(stripJsonComments(raw));
};

/**
 * Import config
 */
export const importConfig = (configLocation: string) => {
  const configExtName = path.extname(configLocation);
  // console.log('Config file ext', configExtName)
  if (configExtName === ".json") {
    const config = importJson(configLocation); // todo ref from common module
    const json = JSON.parse(JSON.stringify(config));
    logger(LOG_LEVEL.DEBUG, "Imported json config", json);
    return json;
  } else if (configExtName === ".js") {
    const js = require(configLocation);
    logger(LOG_LEVEL.DEBUG, "Imported js config", js);
    return js;
  } else {
    const message = `Config file extension type not supported`;
    logger(LOG_LEVEL.ERROR, message, configExtName);
    process.exit(1);
  }
};

/**
 * Add absolute paths to config file paths
 */
export const addAbsPathsToConfigPaths = (
  configObject: {
    [configKey: string]: string | { [configSubKey: string]: string };
  },
  modifiableConfigPaths: string[],
  originPath: string,
  shouldModifyPathFn: (path: string) => boolean = () => true
) => {
  modifiableConfigPaths.forEach((p) => {
    const value = get(configObject, p) as string;
    if (!value) {
      return;
    } else if (Array.isArray(value)) {
      const newValues = value.map((v) =>
        !shouldModifyPathFn(v) || path.isAbsolute(v)
          ? v
          : path.resolve(originPath, v)
      );
      set(configObject, p, newValues);
    } else {
      const newValue =
        !shouldModifyPathFn(value) || path.isAbsolute(value)
          ? value
          : path.resolve(originPath, value);
      set(configObject, p, newValue);
    }
  });
  logger(LOG_LEVEL.DEBUG, "Added abs paths to config", configObject);

  return configObject;
};
