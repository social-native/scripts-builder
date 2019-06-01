
export interface IState {
  [state: string]: any
}

export interface IConfigObjInner {
  [state: string]: IConfigObjInner
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

// getConfigObject: input + configPath -> input + configObj
export type GetConfigObject = (input: IState & ConfigPath) => { configObj: IConfigObjInner } & IState
export type ConfigObj = ReturnType<GetConfigObject>

// removeOptionsFromArgsObj: optionNames -> input -> input 
export type RemoveOptionsFromArgsObj = (optionNames: string[]) => (input: IState) => IArgsObj & IState

// updateOptionsArr: input + argsObj -> input
export type UpdateArgsArr = (input: IState & IArgsObj) => {argsArr: string[]} & IState
export type ArgsArr = ReturnType<UpdateArgsArr>

// modifyRelativePathsInConfigObject: shouldModifyFunction, fieldsWithRelativePaths -> input + configObj + originDir -> input + configObj
type IShouldModifyPath = { ShouldModifyPath: (optionName: string) => boolean };
type IFieldsWithModifiablePaths = { fieldsWithModifiablePaths: string[] }
export type ModifyRelativePathsInConfigObject = (config: IShouldModifyPath & IFieldsWithModifiablePaths & IState) => (input: ConfigObj & OriginDir) => ConfigObj & IState

// addFieldsToConfigObject: (updater = input -> fieldsObj) -> input + originDir -> input + configObj
interface IFieldsUpdater {
  fieldsUpdater: (fieldPath: string) => boolean
}
export type AddFieldsToConfigObject = (config: IFieldsUpdater) => (input: IState & OriginDir) => ConfigObj & IState

// writeConfigObjectToLocation: path -> input + configObj -> input + tempConfigObjPath
export type WriteConfigObjectToLocation = (config: { path: string }) => (input: IState & ConfigObj) => { tempConfigPath: string } & IState
export type TempConfigPath = ReturnType<WriteConfigObjectToLocation>

// generateCommand: binLocation -> input + tempConfigObjPath + configObj + argsArr -> input + command
export type GenerateCommand = (config: { scriptBinPath: string }) => (input: IState & TempConfigPath & ConfigObj & ArgsArr) => {command: string} & IState
export type Command = ReturnType<GenerateCommand>

// executeCommand -> input -> input + commandStatus
export type ExecuteCommand = (input: IState & Command) => {commandStatus?: {message?: string, code?: number}} & IState
export type CommandResponse = ReturnType<ExecuteCommand>
