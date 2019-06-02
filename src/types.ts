
export interface IState {
  [state: string]: any
}

export type Executor = (input: IState) => IState

export type Next = (executor: Executor, state: IState) => IState
export type Middleware = (next: Next) => Next;

export interface IConfigObjInner {
  [state: string]: IConfigObjInner
}

/**
 * ------------------------------------
 * Executors
 * -----------------------------------
 */

// initializeScript: input -> input
export type InitializeScript = (input: IState) => IState

// setOriginDir: input -> input + originDir
export type SetOriginDir = (input: IState) =>  { originDir: string } & IState
export type OriginDir = ReturnType<SetOriginDir>

// setArgsObject: input -> input + argsObj
export type SetArgsObject = (input: IState) => {argsObj: {[arg: string]: string}} & IState
export type IArgsObj = ReturnType<SetArgsObject>

// setDefaultConfigPath: defaultPath -> input -> input + defaultConfigPath
export type SetDefaultConfigPath = (config: {defaultPath: string}) => (input: IState) => { defaultConfigPath: string } & IState
export type DefaultConfigPath = ReturnType<SetDefaultConfigPath>

// setUserConfigPath: optionNames -> input + argsObj -> input + userSpecifiedConfigPath
export type SetUserConfigPath = (config: {optionNames: string[]}) => (input: IState & IArgsObj) => { userSpecifiedConfigPath: string } & IState
export type UserSpecifiedConfigPath = ReturnType<SetUserConfigPath>

// calcConfigPath: input + originDir + defaultConfigPath + userSpecifiedConfigPath -> input + configPath
export type CalcConfigPath = (input: IState & OriginDir & DefaultConfigPath & UserSpecifiedConfigPath) => {configPath: string} & IState
export type ConfigPath = ReturnType<CalcConfigPath>

// getConfigObject: input + configPath -> input + configObj
export type GetConfigObject = (input: IState & ConfigPath) => { configObj: IConfigObjInner } & IState
export type ConfigObj = ReturnType<GetConfigObject>

// removeOptionsFromArgsObj: optionNames -> input + argsObj -> input + argsObj
export type RemoveOptionsFromArgsObj = (config: {optionNames: string[]}) => (input: IState & IArgsObj) => IArgsObj & IState

// setArgsArr: input + argsObj -> input + argsArr
export type SetArgsArr = (input: IState & IArgsObj) => {argsArr: string[]} & IState
export type ArgsArr = ReturnType<SetArgsArr>

// modifyRelativePathsInConfigObject: shouldModifyPath, fieldsWithModifiablePaths -> input + configObj + originDir -> input + configObj
type IShouldModifyPath = { shouldModifyPath: (optionName: string) => boolean };
type IFieldsWithModifiablePaths = { fieldsWithModifiablePaths: string[] }
export type ModifyRelativePathsInConfigObject = (config: IShouldModifyPath & IFieldsWithModifiablePaths & IState) => (input: ConfigObj & OriginDir) => ConfigObj & IState

// addFieldsToConfigObject: (updater = IState & OriginDir & ConfigObj -> { [fieldPath: string]: string | IConfigObjInner }) -> input + originDir + configObj -> input + configObj
interface IFieldsUpdater {
  fieldsUpdater: (input: IState & OriginDir & ConfigObj) => { [fieldPath: string]: any }
}
export type AddFieldsToConfigObject = (config: IFieldsUpdater) => (input: IState & ConfigObj & OriginDir) => ConfigObj & IState

// writeConfigObjectToPath: tempConfigPath -> input + configObj -> input + tempConfigFilePath
export type WriteConfigObjectToPath = (config: { tempConfigFilePath: string }) => (input: IState & ConfigObj) => { tempConfigFilePath: string } & IState
export type TempConfigFilePath = ReturnType<WriteConfigObjectToPath>

// generateCommand: binLocation -> input + tempConfigFilePath + configObj + argsArr -> input + command
export type GenerateCommand = (input: IState & TempConfigFilePath & ConfigObj & ArgsArr) => {command: string} & IState
export type Command = ReturnType<GenerateCommand>

// executeCommand -> input -> input + commandStatus
export type ExecuteCommand = (input: IState & Command) => {commandStatus?: {message?: string, code?: number}} & IState
export type CommandResponse = ReturnType<ExecuteCommand>
