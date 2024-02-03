import chalk from 'chalk'
import fs from 'node:fs'
import schedule from 'node-schedule'
import { doBBSDailyTask } from './bbsTask.js'
import { doBbsActivityTask } from './bbsActivityTask.js'
import { doPnsSignIn } from './gameSignIn.js'
import {
  dataPath,
  pluginVer,
  _DataPath,
} from '../data/system/pluginConstants.js'
import { getRandomInt, sendMsgFriend, sleepAsync } from './utils.js'
import { getToken } from '../model/kuroBBSTokenHandler.js'
import cfg from '../../../lib/config/config.js'

export async function initAutoTask() {
  kuroLogger.info(
    chalk.rgb(134, 142, 204)(`载入定时任务 gameSignTask:pns`)
  )
  schedule.scheduleJob('0 2 0 * * ? ', function () {
    gameSignTask('pns')
  })
  kuroLogger.info(
    chalk.rgb(134, 142, 204)(`载入定时任务 gameSignTask:mc`)
  )
  schedule.scheduleJob('0 2 0 * * ? ', function () {
    gameSignTask('mc')
  })
  kuroLogger.info(chalk.rgb(134, 142, 204)(`载入定时任务 bbsDailyTask`))
  schedule.scheduleJob('0 2 0 * * ? ', function () {
    bbsDailyTask()
  })

  kuroLogger.info(
    chalk.rgb(134, 142, 204)(`载入定时任务 bbsActivityTask`)
  )
  schedule.scheduleJob('0 2 5 * * ? ', function () {
    bbsActivityTask()
  })

  kuroLogger.info(
    chalk.rgb(134, 142, 204)(`载入定时任务 checkUpdateTask`)
  )
  schedule.scheduleJob('0 0 6/12 * * ? ', function () {
    checkUpdateTask()
  })
}

async function gameSignTask(gameName) {
  if (!gameName || (gameName !== 'pns' && gameName !== 'mc')) {
    kuroLogger.error(`自动游戏签到: 游戏 ${gameName} 未定义!`)
    return false
  }
  if (gameName == 'mc') {
    kuroLogger.info(`自动游戏签到: 鸣潮签到测试结束`)
    return true
  }
  if (gameName == 'pns') {
    kuroLogger.info(`自动游戏签到: 战双签到开始...`)

    const gameSignUins = fs
      .readdirSync(dataPath + '/token')
      .filter((file) => file.endsWith('.json'))

    for (let i in gameSignUins) {
      let gameSignUin = gameSignUins[i].replace('.json', '')
      kuroLogger.info(`自动游戏签到: 开始为 ${gameSignUin} 战双签到`)
      let startTime = Date.now()
      const tokenData = await getToken(gameSignUin)
      const accNum = Object.keys(tokenData).length
      let msg = '[库洛插件] 自动游戏签到\n\n'
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
    kuroLogger.info(`自动游戏签到: 战双签到完成`)
    return true
  }
}

async function bbsDailyTask() {
  kuroLogger.info(`自动社区游戏签到开始...`)

  const gameSignUins = fs
    .readdirSync(dataPath + '/token')
    .filter((file) => file.endsWith('.json'))

  for (let i in gameSignUins) {
    let gameSignUin = gameSignUins[i].replace('.json', '')
    kuroLogger.info(`自动社区签到: 开始为 ${gameSignUin} 签到`)
    let startTime = Date.now()
    const tokenData = await getToken(gameSignUin)
    const accNum = Object.keys(tokenData).length
    let msg = '[库洛插件] 自动社区签到\n\n'
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
  kuroLogger.info(`自动社区签到: 任务完成`)
  return true
}

async function bbsActivityTask() {
  kuroLogger.info(`自动活动任务开始...`)

  const gameSignUins = fs
    .readdirSync(dataPath + '/token')
    .filter((file) => file.endsWith('.json'))

  for (let i in gameSignUins) {
    let gameSignUin = gameSignUins[i].replace('.json', '')
    kuroLogger.info(`自动活动任务: 开始为 ${gameSignUin} 执行`)
    let startTime = Date.now()
    const tokenData = await getToken(gameSignUin)
    const accNum = Object.keys(tokenData).length
    let msg = '[库洛插件] 自动活动任务\n\n'
    for (const kuro_uid in tokenData) {
      if (tokenData.hasOwnProperty(kuro_uid)) {
        msg += await doBbsActivityTask(gameSignUin, kuro_uid)
        if (/活动已结束/.test(msg)) return false
        msg += '\n'
      } else {
        msg += `账号 ${kuro_uid}: \ntoken 格式错误\n\n`
      }
      await sleepAsync(getRandomInt(1000, 3000))
    }
    msg += `共用时 ${Math.floor((Date.now() - startTime) / 1000)}s\n`
    await sendMsgFriend(gameSignUin, msg.trimEnd())
  }
  kuroLogger.info(`自动活动任务: 任务完成`)
  return true
}

export async function checkUpdateTask() {
  kuroLogger.info(`检查更新任务开始...`)
  let remoteVersion = await getRemoteVersion('GitHub')
  if (!remoteVersion) {
    remoteVersion = await getRemoteVersion('GHProxy')
    if (!remoteVersion) {
      remoteVersion = await getRemoteVersion('TomyJan')
      if (!remoteVersion) {
        kuroLogger.warn(`检查更新任务失败`)
        await sendMsgFriend(cfg.masterQQ[0], `[库洛插件] 自动检查更新失败!`)
        return false
      }
    }
  }
  remoteVersion = remoteVersion.match(/\[(.*?)\]\(.*?\)/)[1] || false

  if (!remoteVersion) {
    kuroLogger.info(`检查更新任务: 解析版本信息失败`)
    await sendMsgFriend(
      cfg.masterQQ[0],
      `[库洛插件] 自动检查更新\n解析版本信息失败\n请检查网络或前往项目地址检查版本信息\nhttps://github.com/TomyJan/Yunzai-Kuro-Plugin`
    )
    return false
  }

  kuroLogger.info(
    `检查更新任务: 获取到最新版本 ${remoteVersion}, 本地版本 ${pluginVer}`
  )
  if (remoteVersion != pluginVer) {
    // 推送并缓存
    const cacheFilePath = _DataPath + '/system/versionCache.json'
    let versionCache = ''

    try {
      versionCache = fs.readFileSync(cacheFilePath, 'utf8')
      kuroLogger.debug(
        '读取 versionCache:',
        versionCache,
        ', 解析到缓存的版本:',
        JSON.parse(versionCache)?.remoteVersion
      )
    } catch (err) {
      kuroLogger.error('读取 versionCache.json 时出现错误:', err.message)
    }

    if (JSON.parse(versionCache)?.remoteVersion == remoteVersion) {
      kuroLogger.warn('该新版本已经推送过, 不再重复推送, 请及时更新!')
      return false
    }
    versionCache = JSON.stringify({ remoteVersion: remoteVersion })
    let isCacheSucceed = false

    try {
      fs.writeFileSync(cacheFilePath, versionCache)
      kuroLogger.debug('缓存远程版本成功!')
      isCacheSucceed = true
    } catch (err) {
      kuroLogger.error('写入versionCache.json 时出现错误:', err.message)
    }

    await sendMsgFriend(
      cfg.masterQQ[0],
      `[库洛插件] 自动检查更新\n发现新版: ${remoteVersion}\n本地版本: ${pluginVer}\n更新日志: https://github.com/TomyJan/Yunzai-Kuro-Plugin/blob/master/CHANGELOG.md\n建议尽快更新~` +
        (isCacheSucceed ? '' : '\n缓存新版本信息失败, 该信息可能会重复推送')
    )
  }

  async function getRemoteVersion(type) {
    kuroLogger.debug(`尝试从 ${type} 检查更新...`)
    let checkUrl =
      'https://raw.githubusercontent.com/TomyJan/Yunzai-Kuro-Plugin/master/CHANGELOG.md'
    if (type == 'GHProxy') checkUrl = 'https://mirror.ghproxy.com/' + checkUrl
    if (type == 'TomyJan')
      checkUrl =
        'https://proxy.vov.moe/https/raw.githubusercontent.com/TomyJan/Yunzai-Kuro-Plugin/master/CHANGELOG.md'
    try {
      let rsp = await fetch(checkUrl)
      if (!rsp.ok) {
        kuroLogger.warn(
          `从 ${type} 获取更新信息失败: ${rsp.status} ${rsp.statusText}`
        )
        return false
      }
      kuroLogger.info(`从 ${type} 获取更新信息成功, 尝试解析信息...`)
      return await rsp.text()
    } catch (error) {
      kuroLogger.warn(`从 ${type} 获取更新信息失败: ${error.message}`)
      return false
    }
  }
}
