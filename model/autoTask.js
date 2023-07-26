import fs from 'node:fs'
import { doBBSDailyTask } from './bbsTask.js'
import { dataPath } from '../data/system/pluginConstants.js'
import { getRandomInt, sendMsgFriend, sleepAsync } from './utils.js'
import { getToken } from '../model/kuroBBSTokenHandler.js'

export async function gameSignTask(gameName) {
  if (!gameName || (gameName !== 'pns' && gameName !== 'mc')) {
    logger.error(`[库洛插件] 自动游戏签到: 游戏 ${gameName} 未定义!`)
    return false
  }
  if (gameName == 'mc') {
    logger.info(`[库洛插件] 自动游戏签到: 鸣潮签到测试结束`)
    return true
  }
  if (gameName == 'pns') {
    logger.info(`[库洛插件] 自动游戏签到: 战双签到开始...`)

    const gameSignUins = fs
      .readdirSync(dataPath + '/token')
      .filter((file) => file.endsWith('.json'))

    for (let i in gameSignUins) {
      let gameSignUin = gameSignUins[i].replace('.json', '')
      logger.info(`[库洛插件] 自动游戏签到: 开始为 ${gameSignUin} 战双签到`)
      let startTime = Date.now()
      const tokenData = await getToken(gameSignUin)
      const accNum = Object.keys(tokenData).length
      let msg = '[库洛插件] 自动游戏签到任务结果推送\n'
      for (const kuro_uid in tokenData) {
        if (tokenData.hasOwnProperty(kuro_uid)) {
          msg += await doPnsSignIn(gameSignUin, kuro_uid)
          msg += '\n'
        } else {
          msg += `账号 ${kuro_uid}: \ntoken 格式错误\n\n`
        }
        await sleepAsync(getRandomInt(1000, 3000))
      }
      msg += `共用时 ${Math.floor((Date.now() - startTime) / 1000)}s\n`
      await sendMsgFriend(gameSignUin, msg.trimEnd())
    }
    logger.info(`[库洛插件] 自动游戏签到: 战双签到完成`)
    return true
  }
}

export async function bbsDailyTask() {
  logger.info(`[库洛插件] 自动社区游戏签到开始...`)

  const gameSignUins = fs
    .readdirSync(dataPath + '/token')
    .filter((file) => file.endsWith('.json'))

  for (let i in gameSignUins) {
    let gameSignUin = gameSignUins[i].replace('.json', '')
    logger.info(`[库洛插件] 自动社区签到: 开始为 ${gameSignUin} 签到`)
    let startTime = Date.now()
    const tokenData = await getToken(gameSignUin)
    const accNum = Object.keys(tokenData).length
    let msg = '[库洛插件] 自动社区签到任务结果推送\n'
    for (const kuro_uid in tokenData) {
      if (tokenData.hasOwnProperty(kuro_uid)) {
        msg += await doBBSDailyTask(gameSignUin, kuro_uid)
        msg += '\n'
      } else {
        msg += `账号 ${kuro_uid}: \ntoken 格式错误\n\n`
      }
      await sleepAsync(getRandomInt(1000, 3000))
    }
    msg += `共用时 ${Math.floor((Date.now() - startTime) / 1000)}s\n`
    await sendMsgFriend(gameSignUin, msg.trimEnd())
  }
  logger.info(`[库洛插件] 自动社区签到: 任务完成`)
  return true
}
