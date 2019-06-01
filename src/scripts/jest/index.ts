import path from "path";
import { GenerateCommand } from "../../types";
import { initializeScript, setOriginDir, setArgsObject, setDefaultConfigPath, setUserConfigPath, calcConfigPath, getConfigObject, removeOptionsFromArgsObj, setArgsArr, modifyRelativePathsInConfigObject, addFieldsToConfigObject, writeConfigObjectToPath, executeCommand } from "../../executors";
import { logging } from "../../middleware";

const generateJestCommand = (({ tempConfigFilePath, configObj, argsArr, ...input }) => {
  const commandArgs = argsArr.concat(`--config ${tempConfigFilePath}`);

  const binLocation = path.resolve(
    __dirname,
    "../../../",
    "node_modules/.bin/jest"
  );

  const command = `${binLocation} ${commandArgs.join(" ")}`;
  return { ...input, configObj, argsArr, tempConfigFilePath, command }
}) as GenerateCommand

const executors = [
  initializeScript,
  setOriginDir,
  setArgsObject,
  setDefaultConfigPath({ defaultPath: 'config.js' }),
  setUserConfigPath({ optionNames: ['config', 'c']}),
  calcConfigPath,
  getConfigObject,
  removeOptionsFromArgsObj({ optionNames: ['config', 'c']}),
  setArgsArr,
  modifyRelativePathsInConfigObject({
    shouldModifyPath: (path: string) => !path.includes("<rootDir>"),
    fieldsWithModifiablePaths: [
      "cacheDirectory",
      "coverageDirectory",
      "moduleDirectories",
      "modulePaths",
      "prettierPath",
      "rootDir",
      "setupFiles",
      "setupFilesAfterEnv",
      "snapshotResolver",
      "snapshotSerializers"
    ]
  }),
  addFieldsToConfigObject({
    fieldsUpdater: ({ originDir }) => ({
      'rootDir': originDir
    })
  }),
  writeConfigObjectToPath({ tempConfigFilePath: './generatedConfig.js'}),
  generateJestCommand,
  executeCommand,
]

const middleware = [
  logging
]

export {
  executors,
  middleware
}