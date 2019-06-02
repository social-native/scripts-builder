import { Executor, Middleware, IState, Next } from "./types";
import { logger, LOG_LEVEL } from "./common";
import isEqual from 'lodash.isequal';

const getObjectDiff = (obj1: any, obj2: any) => {
  const diff = Object.keys(obj1).reduce((result, key) => {
      if (!obj2.hasOwnProperty(key)) {
          result.push(key);
      } else if (isEqual(obj1[key], obj2[key])) {
          const resultKeyIndex = result.indexOf(key);
          result.splice(resultKeyIndex, 1);
      }
      return result;
  }, Object.keys(obj2));

  return diff;
}


export const loggingEntryAndExit = ((next: Next) => (executor: Executor, state: IState) => {
    logger(LOG_LEVEL.DEBUG, 'Entering:', executor.prototype.name)
    const nextState = next(executor, state)
    logger(LOG_LEVEL.DEBUG, 'Exited', executor.prototype.name)
    return nextState
}) as Middleware

export const logStateChange = ((next: Next) => (executor: Executor, state: IState) => {
    const startState = {...state}
    const nextState = next(executor, state);
    logger(LOG_LEVEL.DEBUG, 'State change', getObjectDiff(startState, nextState))
    return nextState;
})

