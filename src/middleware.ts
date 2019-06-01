import { Executor, Middleware, IState } from "./types";
import { logger, LOG_LEVEL } from "./common";
import isEqual from 'lodash.isequal';

const getObjectDiff = (obj1: any, obj2: any) {
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


export const logging = (state: IState, exec: Executor) => {
  const startState = {...state};
  const name = exec.prototype.name;
  const endState = exec(state);
  logger(LOG_LEVEL.DEBUG, name, getObjectDiff(startState, endState))
  return endState;
} as Middleware