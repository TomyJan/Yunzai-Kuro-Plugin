import fs from 'node:fs'
import kuroLogger from './components/logger.js'
import {
  appsPath,
  pluginVer,
  pluginThemeColor,
} from './data/system/pluginConstants.js'
import { initAutoTask, checkUpdateTask } from './model/autoTask.js'

await kuroLogger.info(pluginThemeColor('============(≧∇≦)ﾉ============'))
await kuroLogger.info(pluginThemeColor(`库洛插件 V${pluginVer} 开始载入~`))

await kuroLogger.info(pluginThemeColor(`-----------载入模块-----------`))

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
    await kuroLogger.error(`载入模块错误：${name}: ${ret[i].reason}`)
    continue
  } else {
    await kuroLogger.info(pluginThemeColor(`载入模块成功：${name}`))
  }
  apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}
await kuroLogger.info(pluginThemeColor(`载入模块完成!`))
export { apps }

await kuroLogger.info(pluginThemeColor(`---------载入定时任务---------`))
await initAutoTask()

await kuroLogger.info(pluginThemeColor(`载入定时任务完成啦!`))

await kuroLogger.info(pluginThemeColor('插件载入完成, 欢迎使用~'))
await kuroLogger.info(pluginThemeColor('=============================='))

// 起洞就检查一下更新
// 延迟5s再开始以防止第三方适配器没连接上
setTimeout(() => {
  checkUpdateTask()
}, 5000)
