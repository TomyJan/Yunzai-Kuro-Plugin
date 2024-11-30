import fs from 'node:fs'
import YAML from 'yaml'
import chokidar from 'chokidar'
import kuroLogger from '../components/logger.js'
import { dataPath } from '../data/system/pluginConstants.js'

class dataHandler {
  constructor() {
    // 配置文件
    this.dataPath = dataPath + '/system/yaml/'
    this.data = {}

    this.watcher = { data: {} }
  }

  getData(name) {
    let ignore = []

    if (ignore.includes(`${name}`)) {
      return this.getYaml(name)
    }

    return this.getYaml(name)
  }

  getYaml(name) {
    // 获取文件路径
    let file = this.getFilePath(name)
    // 解析xml
    const yaml = YAML.parse(fs.readFileSync(file, 'utf8'))
    // 监听文件
    this.watch(file, name)
    return yaml
  }

  getFilePath(name) {
    return `${this.dataPath}${name}.yaml`
  }

  watch(file, name) {
    const watcher = chokidar.watch(file)

    watcher.on('change', () => {
      delete kuroLogger.info(`修改配置文件 ${name} , 已重载`)
    })
  }
}

export default new dataHandler()
