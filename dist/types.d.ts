export interface IState {
    [state: string]: any;
}
export declare type Executor = (input: IState) => IState;
export declare type Next = (executor: Executor, state: IState) => IState;
export declare type Middleware = (next: Next) => Next;
export interface IConfigObjInner {
    [state: string]: IConfigObjInner;
}
/**
 * ------------------------------------
 * Executors
 * -----------------------------------
 */
export declare type InitializeScript = (input: IState) => IState;
export declare type SetOriginDir = (input: IState) => {
    originDir: string;
} & IState;
export declare type OriginDir = ReturnType<SetOriginDir>;
export declare type SetArgsObject = (input: IState) => {
    argsObj: {
        [arg: string]: string;
    };
} & IState;
export declare type IArgsObj = ReturnType<SetArgsObject>;
export declare type SetDefaultConfigPath = (config: {
    defaultPath: string;
}) => (input: IState) => {
    defaultConfigPath: string;
} & IState;
export declare type DefaultConfigPath = ReturnType<SetDefaultConfigPath>;
export declare type SetUserConfigPath = (config: {
    optionNames: string[];
}) => (input: IState & IArgsObj) => {
    userSpecifiedConfigPath: string;
} & IState;
export declare type UserSpecifiedConfigPath = ReturnType<SetUserConfigPath>;
export declare type CalcConfigPath = (input: IState & OriginDir & DefaultConfigPath & UserSpecifiedConfigPath) => {
    configPath: string;
} & IState;
export declare type ConfigPath = ReturnType<CalcConfigPath>;
export declare type GetConfigObject = (input: IState & ConfigPath) => {
    configObj: IConfigObjInner;
} & IState;
export declare type ConfigObj = ReturnType<GetConfigObject>;
export declare type RemoveOptionsFromArgsObj = (config: {
    optionNames: string[];
}) => (input: IState & IArgsObj) => IArgsObj & IState;
export declare type SetArgsArr = (input: IState & IArgsObj) => {
    argsArr: string[];
} & IState;
export declare type ArgsArr = ReturnType<SetArgsArr>;
declare type IShouldModifyPath = {
    shouldModifyPath: (optionName: string) => boolean;
};
declare type IFieldsWithModifiablePaths = {
    fieldsWithModifiablePaths: string[];
};
export declare type ModifyRelativePathsInConfigObject = (config: IShouldModifyPath & IFieldsWithModifiablePaths & IState) => (input: ConfigObj & OriginDir) => ConfigObj & IState;
interface IFieldsUpdater {
    fieldsUpdater: (input: IState & OriginDir & ConfigObj) => {
        [fieldPath: string]: any;
    };
}
export declare type AddFieldsToConfigObject = (config: IFieldsUpdater) => (input: IState & ConfigObj & OriginDir) => ConfigObj & IState;
export declare type WriteConfigObjectToPath = (config: {
    tempConfigFilePath: string;
}) => (input: IState & ConfigObj) => {
    tempConfigFilePath: string;
} & IState;
export declare type TempConfigFilePath = ReturnType<WriteConfigObjectToPath>;
export declare type GenerateCommand = (input: IState & TempConfigFilePath & ConfigObj & ArgsArr) => {
    command: string;
} & IState;
export declare type Command = ReturnType<GenerateCommand>;
export declare type ExecuteCommand = (input: IState & Command) => {
    commandStatus?: {
        message?: string;
        code?: number;
    };
} & IState;
export declare type CommandResponse = ReturnType<ExecuteCommand>;
export {};
