import { Executor, Middleware, IState, Next } from "./types";
export declare const loggingEntryAndExit: Middleware;
export declare const logStateChange: (next: Next) => (executor: Executor, state: IState) => IState;
