
// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
console.log('USING SCRIPTS BUILDER', 'TSC')
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

let argv = process.argv.slice(2);
const defaultConfigLocation = path.resolve(__dirname, "./config.json");
// make sure origin directory is the first valid path outside all node module nesting
const originDir = process.argv0.split('node_modules')[0];
// get config location
const parsedArgs = yargs.parse(argv);
let configLocationFromArgs;
if (parsedArgs.project && parsedArgs.p) {
  throw new Error('Cant specify both --project and -p. They mean the same thing. Pick one!')
} else if (parsedArgs.project || parsedArgs.p) {
  configLocationFromArgs = parsedArgs.project || parsedArgs.p
  // delete project config options from parsedArgs
  delete parsedArgs.project
  delete parsedArgs.p
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

const addAbsBasePath = (oldConfig, configPaths, basePath) => {
  config = JSON.parse(JSON.stringify(oldConfig))
  configPaths.forEach(p => {
    const value = get(config, p)
    if (!value) { 
      return 
    } else if (Array.isArray(value)) {
      const newValues = value.map(v => path.isAbsolute(v) ? v : path.resolve(basePath, v))
      set(config, p, newValues)
    } else {
      const newValue = path.isAbsolute(value) ? value : path.resolve(basePath, value);
      set(config, p, newValue)
    }
  })
  return config;
}

const tsconfigValuesWithPaths = [
  'compilerOptions.outFile',
  'compilerOptions.outDir',
  'compilerOptions.baseUrl',
  'compilerOptions.declarationDir',
  'compilerOptions.rootDir',
  'compilerOptions.rootDirs',
  'compilerOptions.mapRoot',
  'compilerOptions.sourceRoot',
  'compilerOptions.typeRoots',
  'exclude'
];

const importJson = (path) => {
  const raw = fs.readFileSync(path, 'utf8');
  return JSON.parse(stripJsonComments(raw));
}

const importDefaultConfig = (configLocation, tsconfigValuesWithPaths, originDir) => {
  let config = importJson(configLocation);
  const include = config.include || [];
  config.include = [...include, originDir];
  config = addAbsBasePath(config, tsconfigValuesWithPaths, originDir);
  // console.log('IMPORTED CONFIG', config)
  return config;
}


/**
 * Get tsconfig and check if it includes the originDir
 * If it doesn't exist we should make it off a default tsconfig file
 * If the originDir isn't specified in the tsconfig `include` we should add it
 * Once we've made any changes, we should update the generated tsconfig file (`tsconfigGenerated.json`)
 */
let tsconfig;
const generatedTSConfigLocation = path.resolve(__dirname, "./tsconfigGenerated.json");
// if (fs.existsSync(generatedTSConfigLocation)) {
//   tsconfig = importJson(generatedTSConfigLocation)
//   if (
//     (tsconfig.include && Array.isArray(tsconfig.include) && !tsconfig.include.includes(originDir)) ||
//     (tsconfig.include && !Array.isArray(tsconfig.include)) ||
//     (!tsconfig.include)
//   ) {
//     tsconfig = importDefaultConfig(configLocation, tsconfigValuesWithPaths, originDir);
//     fs.writeFileSync(generatedTSConfigLocation, JSON.stringify(tsconfig, null, 2));
//   }
// } else {
  tsconfig = importDefaultConfig(configLocation, tsconfigValuesWithPaths, originDir);
  fs.writeFileSync(generatedTSConfigLocation, JSON.stringify(tsconfig, null, 2));
// }


// generate tsc args
const lintArgs = argv
  .concat(`--project ${generatedTSConfigLocation}`)


const tscBinLocation = path.resolve(__dirname, '../../', "node_modules/typescript/bin/tsc")

// run tsc
const command = `${tscBinLocation} ${lintArgs.join(' ')}`
try {
  execSync(command, {stdio: 'inherit'})
} catch(e) {
  process.exit(1)
}

