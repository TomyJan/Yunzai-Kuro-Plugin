import {dataPath} from '../data/PluginConstants.js'
import fs from 'node:fs'
import _ from 'lodash'
import YAML from 'yaml'
import chokidar from 'chokidar'

class dataHandler {
  constructor () {
    // 配置文件
    this.configPath = dataPath
    this.config = {}

    this.watcher = { config: {} }
  }

  getConfig (name) {
    let ignore = []

    if (ignore.includes(`${name}`)) {
      return this.getYaml(name)
    }

    return this.getYaml(name)
  }

  getYaml (name) {
    // 获取文件路径
    let file = this.getFilePath(name)
    // 解析xml
    const yaml = YAML.parse(fs.readFileSync(file, 'utf8'))
    // 监听文件
    this.watch(file, name)
    return yaml
  }

  getFilePath (name) {
    return `${this.configPath}/${name}.yaml`
  }

  watch (file, name) {
    const watcher = chokidar.watch(file)

    watcher.on('change', (path) => {
      delete
      logger.mark(`[修改配置文件][${name}]`)
    })
  }
}

export default new dataHandler()
