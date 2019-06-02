import { Executor, Middleware, IState } from "./types";
export declare const applyMiddleware: <E extends Executor, M extends Middleware>(executors: E[], middleware: M[]) => () => IState;
