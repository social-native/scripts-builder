#!/usr/bin/env node

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

const fs = require('fs');
const path = require('path');
const stripJsonComments = require('strip-json-comments');
const execSync = require('child_process').execSync;
const depcheck = require('depcheck');
// make sure origin directory is the first valid path outside all node module nesting
const originDir = process.argv0.split('node_modules')[0];

const processUnusedDevDependencies = (unusedDevDependencies, usedDependencies) => {
    const {types, nonTypes} = filterTypesAndNonTypeDependencies(unusedDevDependencies);
    // check if the types (extracted from @types/<someLib> to <someLib>) are in `usedDependencies`
    //   if they are, dont count them as unused
    const missingTypes = types.filter(t => !usedDependencies[t]);
    return [...nonTypes, ...missingTypes.map(t => `@types/${t}`)];
};

const filterTypesAndNonTypeDependencies = dependencyNames =>
    // @types/<someLib> aren't filtered correctly
    // here we seperate out dependencies that are types (above) and nonTypes
    // types are extracted from @types/<someLib> to <someLib>
    dependencyNames.reduce(
        (acc, dep) => {
            const matches = dep.match(/(@types\/)(.*)/);
            if (matches && matches[1]) {
                acc.types.push(matches[2]);
            } else {
                acc.nonTypes.push(dep);
            }

            return acc;
        },
        {types: [], nonTypes: []}
    );

const defaultConfigLocation =  path.resolve(__dirname, "./config.json");
const defaultConfigRaw = fs.readFileSync(defaultConfigLocation, 'utf8');
const defaultConfig = JSON.parse(stripJsonComments(defaultConfigRaw));

let config;
const configLocation = path.resolve(originDir, "./depcheck.json");
if (fs.existsSync(configLocation)) {
  const configRaw = fs.readFileSync(configLocation, 'utf8');
  const newConfig = JSON.parse(stripJsonComments(configRaw));
  if (!newConfig) { 
    console.log('Error reading depcheck config file: `depcheck.json`');
    process.exit(1);
  }
  config = { ...defaultConfig, ...newConfig };
} else {
  config = defaultConfig;
}

// keys on `unused` are `dependencies`, `devDependencies`, `using`, `missing`, `invalidFiles`, `invalidDirs`
depcheck(originDir, config, unused => {
    const devDependencies = processUnusedDevDependencies(unused.devDependencies, unused.using);
    let unusedDependenciesExist = unused.dependencies.length > 0 || devDependencies.length > 0;

    const results = {...unused, devDependencies};
    const resultsDir = `${originDir}tmp/`;
    const resultsFile = `${resultsDir}depcheck.result.json`

    if (unusedDependenciesExist) {
      if (!fs.existsSync(resultsDir)) {
          fs.mkdirSync(resultsDir);
      }
      fs.writeFile(resultsFile, JSON.stringify(results), function(err) {
          if (err) {
              console.log(err);
          }
  
          console.log('Found unused dependencies:');
          console.log('\n dependencies', results.dependencies); // an array containing the unused dependencies
          console.log('\n devDependencies', results.devDependencies); // an array containing the unused devDependencies
          process.exit(1);
      });

    } else {
      console.log('No unused dependencies found!');
      if (fs.existsSync(resultsFile)) {
        fs.unlinkSync(resultsFile)
      }
      process.exit(0);
    }
});
