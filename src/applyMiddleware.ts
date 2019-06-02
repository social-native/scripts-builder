import { Executor, Middleware, IState } from "./types";

const evaluator = (executor: Executor, state: IState) => executor(state);

export const applyMiddleware = (executors: Executor[], middleware: Middleware[]) => () => {
  const compiled = middleware.reduce((acc, m: Middleware) => {
    return m(acc)
  }, evaluator)

  return executors.reduce((state, executor: Executor) => {
    if (!compiled) {
      return executor(state)
    }
    return compiled(executor,state)
  }, {} as IState)
}

// const ejectScript = (executors: Executor[], middleware?: Middleware[]) => {
//   const { configObj, defaultConfigPath, originDir }= executors.reduce((acc, e: Executor) => {
//     if (middleware && middleware.length > 0) {
//       acc = middleware.forEach(m => m(acc, e)
//     }
//     acc = e(acc)
//     if (e.prototype.name === 'getConfigObject') {
//       break;
//     }
//   }, {} as IState) as ConfigObj & DefaultConfigPath & OriginDir;

//   writefile to originDir with configName
//   install node modules
//   swap out script with direct call to cli
//   // if (!configObj) { logger(LOG_LEVEL.ERROR, 'No config object found')}
// }

// const createConfigPatch