// get config
1. initialize script
2. get default config path <- set defaultConfigPath
3. get origin dir
4. parse user provided args
5. look for config override path in args <- set configOptionNames
6. get config object

// modify config | inputs: configObject, rootDir, 
7. change relative paths to absolute paths in config object <- specify optionNames, specify shouldModifyFn
8. modify config object (ex: add 'rootDir')

// modify args
8. remove config override path options (if specified) from configOptionNames 
9. create new input args array


// construct command | inputs: origin | args | config | tempConfigFilePath
10. optionally save config as tmp file <- set tempConfig file name
11 construct new args

// run | inputs: command
12. execute command


execution path -> fn[]

there are the main executors: 
initialize, getConfig, modifyConfig, createCommand from config + userArgs,  executeCommand

Each executor is made up of executors:


initializeScript: input -> input

setOriginDir: input -> input + originDir
setArgsObject: input -> input + argsObject
setDefaultConfigPath: defaultPath -> input -> input + defaultConfigPath
getUserConfigPath: optionNames -> input + argsObject -> input + userSpecifiedConfigPath
getConfigPath: input + originDir + defaultConfigPath + userSpecifiedConfigPath -> input + configPath
getConfigObject: input + configPath -> input + configObject
removeOptionsFromArgsObj: optionNames -> input -> input 
updateOptionsArr: input + argsObj -> input


handleRelativePathsInConfigObject: shouldModifyFunction, fieldsWithRelativePaths -> input + configObject + originDir -> input + configObject
addFieldsToConfigObject: (updater = input -> fieldsObj) -> input + originDir -> input + configObject
writeConfigObjectToLocation: path -> input + configObj -> input + tempConfigObjPath
generateCommand: binLocation -> input + tempConfigObjPath + configObj + argsArr -> input + command
executeCommand -> input -> input + commandStatus
