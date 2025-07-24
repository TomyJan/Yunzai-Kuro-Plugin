import chalk from 'chalk'
import fs from 'fs'
import { _CfgPath, _DataPath } from '../data/system/pluginConstants.js'
import kuroLogger from './logger.js'

class ConfigReader {
  constructor() {
    this.filePath = _CfgPath + '/config.json'
    this.configObject = this.readConfig() // 初始读取配置文件
    this.watchConfig() // 监听配置文件变化
  }

  readConfig() {
    try {
      if (!fs.existsSync(this.filePath)) {
        const defaultConfigPath = _DataPath + '/system/default_config.json'
        fs.writeFileSync(
          this.filePath,
          fs.readFileSync(defaultConfigPath),
          'utf8',
        )
      }
      const data = fs.readFileSync(this.filePath, 'utf8')
      const configObject = JSON.parse(data)
      return configObject
    } catch (error) {
      // eslint-disable-next-line no-undef
      logger.error(
        chalk.red(`[库洛插件][WARN  ] 读取配置文件失败: ${error.message}`),
      )
      return {}
    }
  }

  watchConfig() {
    fs.watchFile(this.filePath, (curr, prev) => {
      if (curr.mtime > prev.mtime) {
        this.configObject = this.readConfig()
        kuroLogger.info('配置文件已更新')
        kuroLogger.setLogLevel(this.configObject.logger.logLevel)
      }
    })
  }

  getConfig() {
    return this.configObject
  }
}

export default new ConfigReader()
