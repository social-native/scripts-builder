## Common Scripts

| script name     | run command     | 
| ---------  | --------------- |
| `tsc`      | `tsc [options]` |
| `jest`     | `jest [options]` |
| `tslint`   | `tslint [options]` |
| `depCheck` | `depCheck [options]` |
| `knex`     | `knex [options]` |
| `prettier` | `prettier [options]` |


## Commands 

The script builder currently supports:

1. Running scripts
2. Ejecting scripts and installing dependencies in the callee repo
3. Creating a git patch that applies user defined config options to the default config options

| option  | command                  | definition | 
| ------- | ------------------------ | ---------- |
| `run`   | `<scriptName> [options]` | Run a CLI tool with options
| `eject` | `eject <scriptName>`     | Eject a script and install dependencies in the callee repo
| `patch` | `patch <scriptName>`     | Create a git patch applying user defined config options to default config options


## Architecture

Each command for a script is represented as a series of serial steps carried out by executors.
Executors are applied onto one another and transform a state object as they are called. 
Middleware can be added to control / introspect state entering or leaving an executor

### Executors

Executors execute step-wise logic.
Each executor can create side effects and modify a state object. The state object is passed from one executor to the next.

Executors have the type:

```typescript
export interface IState { [state: string]: any }
export type Executor = (input: IState) => IState
```

Defining your own executor would look something like:

```typescript
const myExectuor = function(state) {
  <do something and or modify state>
  return { ...state}
}
myExecturor.prototype.name = 'myExecutor'
```

Script are defined in terms of the common executors:

- initializeScript: input -> input
- setOriginDir: input -> input + originDir
- setArgsObject: input -> input + argsObject
- setDefaultConfigPath: defaultPath -> input -> input + defaultConfigPath
- getUserConfigPath: optionNames -> input + argsObject -> input + userSpecifiedConfigPath
- getConfigPath: input + originDir + defaultConfigPath + userSpecifiedConfigPath -> input + configPath
- getConfigObject: input + configPath -> input + configObject
- removeOptionsFromArgsObj: optionNames -> input -> input 
- updateOptionsArr: input + argsObj -> input
- handleRelativePathsInConfigObject: shouldModifyFunction, fieldsWithRelativePaths -> input + configObject + originDir -> input + - configObject
- addFieldsToConfigObject: (updater = input -> fieldsObj) -> input + originDir -> input + configObject
- writeConfigObjectToLocation: path -> input + configObj -> input + tempConfigObjPath
- generateCommand: binLocation -> input + tempConfigObjPath + configObj + argsArr -> input + command
- executeCommand -> input -> input + commandStatus

### Middleware

Middleware can be added to control / introspect state entering or leaving an executor

Middleware has the type:

```typescript
interface IState { [state: string]: any }
type Executor = (input: IState) => IState
type Next = (executor: Executor, state: IState) => IState
type Middleware = (next: Next) => Next;
```

Defining your own middleware would look something like:

```typescript
const myMiddleware = ((next: Next) => (executor: Executor, state: IState) => {
    <do something before executor runs>

    const nextState = next(executor, state)

    <do something after executor runs>

    return nextState
}) as Middleware
```