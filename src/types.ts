
export interface IState {
  [state: string]: any
}

// initializeScript: input -> input
export type InitializeScript = (input: IState) => IState

// setOriginDir: input -> input + originDir
export type SetOriginDir = (input: IState) =>  { originDir: string } & IState
export type OriginDir = ReturnType<SetOriginDir>

// setArgsObject: input -> input + argsObj
export type SetArgsObject = (input: IState) => {argsObj: {[arg: string]: string}} & IState
export type IArgsObj = ReturnType<SetArgsObject>

// setDefaultConfigPath: defaultPath -> input -> input + defaultConfigPath
export type SetDefaultConfigPath = (defaultPath: string) => (input: IState) => { defaultConfigPath: string } & IState
export type DefaultConfigPath = ReturnType<SetDefaultConfigPath>

// getUserConfigPath: optionNames -> input + argsObj -> input + userSpecifiedConfigPath
export type GetUserConfigPath = (optionNames: string[]) => (input: IState & IArgsObj) => { userSpecifiedConfigPath: string } & IState
export type UserSpecifiedConfigPath = ReturnType<GetUserConfigPath>

// getConfigPath: input + originDir + defaultConfigPath + userSpecifiedConfigPath -> input + configPath
export type GetConfigPath = (input: IState & OriginDir & DefaultConfigPath & UserSpecifiedConfigPath) => (input: IState) => {configPath: string} & IState
export type ConfigPath = ReturnType<GetConfigPath>

// getConfigObject: input + configPath -> input + configObject

// removeOptionsFromArgsObj: optionNames -> input -> input 

// updateOptionsArr: input + argsObj -> input


// handleRelativePathsInConfigObject: shouldModifyFunction, fieldsWithRelativePaths -> input + configObject + originDir -> input + configObject
// addFieldsToConfigObject: (updater = input -> fieldsObj) -> input + originDir -> input + configObject
// writeConfigObjectToLocation: path -> input + configObj -> input + tempConfigObjPath
// generateCommand: binLocation -> input + tempConfigObjPath + configObj + argsArr -> input + command
// executeCommand -> input -> input + commandStatus

