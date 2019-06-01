/**
 * Common code shared by `bin.js` and `scripts/`
 */
export declare enum LOG_LEVEL {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
export declare const logger: (level: LOG_LEVEL, message: string, data?: any) => void;
export interface IArgObject {
    [argName: string]: string;
}
/**
 * Creates a process.arg array from an object of { argName: argValue }
 */
export declare const compileArgs: (parsedArgs: IArgObject) => string[];
/**
 * Initializes a script
 */
export declare const initializeScript: () => void;
/**
 * Returns the raw passed in args to the script
 */
export declare const scriptArgs: () => string[];
/**
 * Returns the absolute path to the default config file for the script
 */
export declare const getDefaultConfigPath: (defaultConfigFileName: string) => string;
/**
 * Returns the absolute path to the origin directory of the repo calling this script
 * The origin directory is the first valid path outside all node module nesting
 */
export declare const getOriginDir: () => string;
/**
 * Parse process.argv into an arg object
 */
export declare const getParsedArgs: () => {
    [option: string]: string;
};
/**
 * Extract config location from args
 */
export declare const extractConfigLocationFromArgs: (argObject: IArgObject, configOptionNames: string[]) => string | undefined;
/**
 * Extract user specified config location from args
 */
export declare const removeOptionsFromArgsObject: (argObject: IArgObject, options: string[]) => {
    [x: string]: string;
};
/**
 * Check if user config exists, if not use the default config location
 */
export declare const generateConfigPath: (originDir: string, defaultPath: string, userDefinedPath?: string | undefined) => string;
/**
 * Import config
 */
export declare const importConfig: (configLocation: string) => any;
/**
 * Add absolute paths to config file paths
 */
export declare const addAbsPathsToConfigPaths: (configObject: {
    [configKey: string]: string | {
        [configSubKey: string]: string;
    };
}, modifiableConfigPaths: string[], originPath: string, shouldModifyPathFn?: (path: string) => boolean) => {
    [configKey: string]: string | {
        [configSubKey: string]: string;
    };
};
