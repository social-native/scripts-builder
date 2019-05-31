
// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
console.log('USING SCRIPTS BUILDER', 'JEST')
process.on('unhandledRejection', err => {
  throw err;
});

const fs = require('fs');
const stripJsonComments = require('strip-json-comments');

const path = require('path');
const execSync = require('child_process').execSync;
const get = require('lodash.get');
const set = require('lodash.set');
const yargs = require('yargs');

const compileArgs = parsedArgs => {
    return Object.keys(parsedArgs).reduce((acc, option) => {
      if (option === '_' || option === '$0') return acc;
      const value = parsedArgs[option];
      if (option.length === 1) {
        acc.push(`-${option}`)
      } else {
        acc.push(`--${option}`)
      }
      acc.push(value);
      return acc
    }, [])
  }

// get user passed in args
let argv = process.argv.slice(2);
// default config location
const defaultConfigLocation = path.resolve(__dirname, "./config.js");
// make sure origin directory is the first valid path outside all node module nesting
const originDir = process.argv0.split('node_modules')[0];
// get config location
const parsedArgs = yargs.parse(argv);
let configLocationFromArgs;
if (parsedArgs.config && parsedArgs.c) {
  throw new Error('Cant specify both --config and -c. They mean the same thing. Pick one!')
} else if (parsedArgs.config || parsedArgs.c) {
  configLocationFromArgs = parsedArgs.config || parsedArgs.c
  // delete config config options from parsedArgs
  delete parsedArgs.config
  delete parsedArgs.c
  // reconstruct argv from parsedArgs
  argv = compileArgs(parsedArgs)
}


// resolve config path
const userConfigPath = path.resolve(originDir, configLocationFromArgs)
let configLocation;
if (fs.existsSync(userConfigPath)) {
  configLocation = userConfigPath;
} else {
  configLocation = defaultConfigLocation;
}

const addAbsBasePath = (config, configPaths, basePath, shouldModifyPathFn = (path) => path) => {
    // config = JSON.parse(JSON.stringify(oldConfig))
    configPaths.forEach(p => {
      const value = get(config, p)
      if (!value) { 
        return 
      } else if (Array.isArray(value)) {
        console.log(shouldModifyPathFn, value)
        const newValues = value.map(v => !shouldModifyPathFn(v) || path.isAbsolute(v) ? v : path.resolve(basePath, v))
        set(config, p, newValues)
      } else {
        const newValue = !shouldModifyPathFn(v) || path.isAbsolute(value) ? value : path.resolve(basePath, value);
        set(config, p, newValue)
      }
    })
    return config;
  }

  
const jestConfigValuesWithPaths = [
    'cacheDirectory',
    'coverageDirectory',
    'moduleDirectories',
    'modulePaths',
    'prettierPath',
    'rootDir',
    'setupFiles',
    'setupFilesAfterEnv',
    'snapshotResolver',
    'snapshotSerializers',
];

console.log(argv, configLocation)


const importDefaultConfig = (configLocation, configOptionsWithPaths, originDir, shouldModifyPathFn) => {
    let config;
    const configExtName = path.extname(configLocation);
    // console.log('Config file ext', configExtName)
    if (configExtName === '.json') {
        // let config = importJson(configLocation); // todo ref from common module
    } else if (configExtName === '.js') {
        // console.log('found js file')
        config = require(configLocation);
    } else {
        throw new Error('Config file extension type not supported')
    }
    // console.log('Found config', configLocation, config)

    // const include = config.include || [];
    // config.include = [...include, originDir];
    config = addAbsBasePath(config, configOptionsWithPaths, originDir, shouldModifyPathFn);
    // console.log('IMPORTED CONFIG', config)
    return config;
  }

/**
 * Get tsconfig and check if it includes the originDir
 * If it doesn't exist we should make it off a default tsconfig file
 * If the originDir isn't specified in the tsconfig `include` we should add it
 * Once we've made any changes, we should update the generated tsconfig file (`jestConfigGenerated.json`)
 */
let jestConfig;
const generatedJestConfigLocation = path.resolve(__dirname, "./jestConfigGenerated.json");
// if (fs.existsSync(generatedJestConfigLocation)) {
//   tsconfig = importJson(generatedJestConfigLocation)
//   if (
//     (tsconfig.include && Array.isArray(tsconfig.include) && !tsconfig.include.includes(originDir)) ||
//     (tsconfig.include && !Array.isArray(tsconfig.include)) ||
//     (!tsconfig.include)
//   ) {
//     tsconfig = importDefaultConfig(configLocation, tsconfigValuesWithPaths, originDir);
//     fs.writeFileSync(generatedJestConfigLocation, JSON.stringify(tsconfig, null, 2));
//   }
// } else {

shouldModifyPathFn = (path) => !path.includes('<rootDir>');

  jestConfig = importDefaultConfig(configLocation, jestConfigValuesWithPaths, originDir, shouldModifyPathFn);
  if (!jestConfig.rootDir) {
      jestConfig.rootDir = originDir
  }
//   console.log(jestConfig)
  fs.writeFileSync(generatedJestConfigLocation, JSON.stringify(jestConfig, null, 2));
// }

const lintArgs = argv
  .concat(`--config ${generatedJestConfigLocation}`)


const jestBinLocation = path.resolve(__dirname, '../../', "node_modules/.bin/jest")

// run tsc
const command = `${jestBinLocation} ${lintArgs.join(' ')}`
try {
  execSync(command, {stdio: 'inherit'})
} catch(e) {
  process.exit(1)
}