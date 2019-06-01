// const executors = [initializeScript, setOriginDir, setArgsObject]

// const middleware = [
//   (input: IState) => input
// ]

// const applyMiddleware = (input: IState) => middleware.reduce((acc: IState, e: Executor) => e(acc), input)
// const curry = (decorator: typeof applyMiddleware) => (acc: IState, e: Executor) => e(decorator(acc))
// executors.reduce(curry(applyMiddleware), {} as IState)
