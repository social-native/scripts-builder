import { IState, Executor, Middleware, ConfigObj, DefaultConfigPath, OriginDir } from "./types";
import { logger, LOG_LEVEL } from "./common";
import { isModuleSpecifier } from "@babel/types";

// const executors = [initializeScript, setOriginDir, setArgsObject]

// const middleware = [
//   (input: IState) => input
// ]

// const applyMiddleware = (input: IState) => middleware.reduce((acc: IState, e: Executor) => e(acc), input)
// const curry = (decorator: typeof applyMiddleware) => (acc: IState, e: Executor) => e(decorator(acc))
// executors.reduce(curry(applyMiddleware), {} as IState)

const runScript = (executors: Executor[], middleware?: Middleware[]) => {
  executors.reduce((acc, e: Executor) => {
    if (middleware && middleware.length > 0) {
      return middleware.forEach(m => m(acc, e)
    }
    return e(acc)
  }, {} as IState)
}

const ejectScript = (executors: Executor[], middleware?: Middleware[]) => {
  const { configObj, defaultConfigPath, originDir }= executors.reduce((acc, e: Executor) => {
    if (middleware && middleware.length > 0) {
      acc = middleware.forEach(m => m(acc, e)
    }
    acc = e(acc)
    if (e.prototype.name === 'getConfigObject') {
      break;
    }
  }, {} as IState) as ConfigObj & DefaultConfigPath & OriginDir;

  writefile to originDir with configName
  install node modules
  swap out script with direct call to cli
  // if (!configObj) { logger(LOG_LEVEL.ERROR, 'No config object found')}
}

const createConfigPatch