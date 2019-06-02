import chalk from 'chalk'

export enum LOG_LEVEL {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error"
}
export const logger = (level: LOG_LEVEL, message: string, data?: any) => {
  const levelColorized = ({
    [LOG_LEVEL.DEBUG]: chalk.blue('debug'),
    [LOG_LEVEL.INFO]: chalk.green('debug'),
    [LOG_LEVEL.WARN]: chalk.redBright('debug'),
    [LOG_LEVEL.ERROR]: chalk.red('debug')
  } as { [level: string]: string })[level]

  const messageColorized = chalk.blueBright(message)
  data ? console.log(levelColorized, messageColorized, data) : console.log(levelColorized, messageColorized);
};

