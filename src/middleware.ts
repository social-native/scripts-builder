import { Executor, Middleware, IState, Next } from "./types";
import { logger, LOG_LEVEL } from "./logger";
import {inspect} from 'util';
import { detailedDiff } from 'deep-object-diff';
import chalk from "chalk";


export const logEntryAndExit = ((next: Next) => (executor: Executor, state: IState) => {
    const name = executor.prototype ? executor.prototype.name : 'Unnamed Function'
    logger(LOG_LEVEL.DEBUG, 'Executor:', name)
    const nextState = next(executor, state)
    return nextState
}) as Middleware

export const logStateChange = ((next: Next) => (executor: Executor, state: IState) => {
    const startState = {...state}
    const nextState = next(executor, state);

    const diff = detailedDiff(startState, nextState) as { [change: string]: { [fields: string]: string }}
    const changes = Object.keys(diff);

    changes.forEach(change => {
        if (Object.keys(diff[change]).length > 0) {
            const inspectedDiff = inspect(diff[change], false, 10, true)
            const coloredDiff = {
                added: inspectedDiff,
                deleted: chalk.red(inspectedDiff),
                updated: chalk.blue(inspectedDiff)
            } as { [change: string]: string}
            logger(LOG_LEVEL.DEBUG, `${change.charAt(0).toUpperCase() + change.slice(1)} state`, "\n\n" + coloredDiff[change] + "\n") //())
        }
    })

    return nextState;
}) as Middleware

