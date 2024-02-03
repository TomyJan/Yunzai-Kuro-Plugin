import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { dataPath } from '../data/system/pluginConstants.js'
import config from './config.js'

class Logger {
  constructor(
    logLevel = config.getConfig().logger.logLevel || 'info',
    logDirectory = dataPath + '/logs'
  ) {
    this.logLevel = logLevel.toLowerCase()
    this.logDirectory = logDirectory
    this.maxLogFileSize = 20 * 1024 * 1024 // 20 MB
    this.currentLogFile = this.generateLogFileName(true)
    this.ensureLogDirectoryExists()
  }

  setLogLevel(logLevel) {
    this.logLevel = logLevel.toLowerCase()
    this.logMessage(`日志等级设置为 ${this.logLevel}`)
  }

  logMessage(message, logType = 'INFO ') {
    const baseLogContent = `[${logType} ] ${message}`
    const logToConsole = `[库洛插件]${baseLogContent}`

    if (logType === 'INFO ') logger.info(chalk.white(logToConsole))
    if (logType === 'DEBUG') logger.info(chalk.gray(logToConsole))
    if (logType === 'WARN ') logger.warn(chalk.yellow(logToConsole))
    if (logType === 'ERROR') logger.error(chalk.red(logToConsole))

    // 保存日志到文件
    if(config.getConfig().logger.saveToFile) {
      const timestamp = new Date().toISOString()
      const logToFile = `[${timestamp}] ${baseLogContent}`
      const currentLogFilePath = path.join(this.logDirectory, this.currentLogFile)

      if (fs.existsSync(currentLogFilePath)) {
        const stats = fs.statSync(currentLogFilePath)
        if (stats.size >= this.maxLogFileSize) {
          this.currentLogFile = this.generateLogFileName()
        }
      }
  
      fs.appendFile(currentLogFilePath, logToFile + '\n', (err) => {
        if (err) {
          logger.info(
            chalk.yellow(`[库洛插件][WARN  ] 写入日志文件时发生错误：${err.message}`)
          )
        }
      })
    }
  }

  debug(...args) {
    if (this.isLogLevelEnabled('debug')) {
      this.logMessage(args.join(' '), 'DEBUG')
    }
  }

  info(...args) {
    if (this.isLogLevelEnabled('info')) {
      this.logMessage(args.join(' '), 'INFO ')
    }
  }

  warn(...args) {
    if (this.isLogLevelEnabled('warn')) {
      this.logMessage(args.join(' '), 'WARN ')
    }
  }

  error(...args) {
    if (this.isLogLevelEnabled('error')) {
      this.logMessage(args.join(' '), 'ERROR')
    }
  }

  isLogLevelEnabled(level) {
    const logLevels = ['debug', 'info', 'warn', 'error']
    const currentLogLevelIndex = logLevels.indexOf(this.logLevel)
    const messageLogLevelIndex = logLevels.indexOf(level)
    return (
      messageLogLevelIndex >= 0 && messageLogLevelIndex >= currentLogLevelIndex
    )
  }

  generateLogFileName(onStart = false) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    return onStart ? `${timestamp}-start.log` : `${timestamp}.log`
  }

  ensureLogDirectoryExists() {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true })
    }
  }
}

// 初始化全局日志记录器实例
const kuroLogger = new Logger(config.getConfig().logger.logLevel || 'info')
logger.info(chalk.gray(`[库洛插件][LOGGER] Logger initialized!`))

export default kuroLogger
