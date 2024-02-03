
import fs from 'node:fs'
import kuroLogger from './components/logger.js'
import { appsPath, pluginVer, pluginThemeColor } from './data/system/pluginConstants.js'
import { initAutoTask, checkUpdateTask } from './model/autoTask.js'

kuroLogger.info(pluginThemeColor('============(≧∇≦)ﾉ============'))
kuroLogger.info(pluginThemeColor(`库洛插件 V${pluginVer} 开始载入~`))

kuroLogger.info(pluginThemeColor(`-----------载入模块-----------`))

const files = fs.readdirSync(appsPath).filter((file) => file.endsWith('.js'))

let ret = []

files.forEach((file) => {
  ret.push(import(`./apps/${file}`))
})

ret = await Promise.allSettled(ret)

let apps = {}
for (let i in files) {
  let name = files[i].replace('.js', '')

  if (ret[i].status !== 'fulfilled') {
    kuroLogger.error(`载入模块错误：${name}`)
    kuroLogger.error(ret[i].reason)
    continue
  } else {
    kuroLogger.info(pluginThemeColor(`载入模块成功：${name}`))
  }
  apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}
kuroLogger.info(pluginThemeColor(`载入模块完成!`))
export { apps }

kuroLogger.info(pluginThemeColor(`---------载入定时任务---------`))
initAutoTask()

kuroLogger.info(pluginThemeColor(`载入定时任务完成啦!`))

kuroLogger.info(pluginThemeColor(`-----------检查更新-----------`))
// 起洞就检查一下更新
await checkUpdateTask()

kuroLogger.info(pluginThemeColor('插件载入完成, 欢迎使用~'))
kuroLogger.info(pluginThemeColor('=============================='))
