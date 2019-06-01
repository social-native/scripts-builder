import { IState, InitializeScript, SetOriginDir, SetArgsObject, IArgsObj } from './types';
import yargs from "yargs";


// initializeScript: input -> input
export const initializeScript = ((input) => {
    // Makes the script crash on unhandled rejections instead of silently
  // ignoring them. In the future, promise rejections that are not handled will
  // terminate the Node.js process with a non-zero exit code.
  process.on("unhandledRejection", err => {
    throw err;
  });
  return input
}) as InitializeScript


// // setOriginDir: input -> input + originDir
export const setOriginDir = ((input) => {
  const originDir = process.argv0.split("node_modules")[0];
  return { ...input, originDir }
}) as SetOriginDir


// // setArgsObject: input -> input + argsObject
export const setArgsObject = ((input) => {
  const argsArr = process.argv.slice(2);
  const argsObj = yargs.parse(argsArr) as IArgsObj['argsObj'];
  return { ...input, argsObj }
}) as SetArgsObject

const executors = [initializeScript, setOriginDir, setArgsObject]

executors.reduce((acc, e) => e(acc), {} as IState)

setArgsObject(setOriginDir(initializeScript({})))

// // setDefaultConfigPath: defaultPath -> input -> input + defaultConfigPath
// export type SetDefaultConfigPath = (defaultPath: string) => (input: IState) => { defaultConfigPath: string } & IState
// export type DefaultConfigPath = ReturnType<SetDefaultConfigPath>

// // getUserConfigPath: optionNames -> input + argsObject -> input + userSpecifiedConfigPath
// export type GetUserConfigPath = (optionNames: string[]) => (input: IState & IArgsObj) => { userSpecifiedConfigPath: string } & IState
// export type UserSpecifiedConfigPath = ReturnType<GetUserConfigPath>

// // getConfigPath: input + originDir + defaultConfigPath + userSpecifiedConfigPath -> input + configPath
// export type GetConfigPath = (input: IState & OriginDir & DefaultConfigPath & UserSpecifiedConfigPath) => (input: IState) => {configPath: string} & IState
// export type ConfigPath = ReturnType<GetConfigPath>