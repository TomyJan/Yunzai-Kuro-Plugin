import chalk from 'chalk'
import fs from 'node:fs'
import schedule from 'node-schedule'
import { doBBSDailyTask } from './bbsTask.js'
import { doPnsSignIn } from './gameSignIn.js'
import { dataPath, pluginVer } from '../data/system/pluginConstants.js'
import { getRandomInt, sendMsgFriend, sleepAsync } from './utils.js'
import { getToken } from '../model/kuroBBSTokenHandler.js'
import cfg from '../../../lib/config/config.js'

export default async function initAutoTask() {
  logger.info(
    chalk.rgb(134, 142, 204)(`[库洛插件] 载入定时任务 gameSignTask:pns`)
  )
  schedule.scheduleJob('0 2 0 * * ? ', function () {
    gameSignTask('pns')
  })
  logger.info(
    chalk.rgb(134, 142, 204)(`[库洛插件] 载入定时任务 gameSignTask:mc`)
  )
  schedule.scheduleJob('0 2 0 * * ? ', function () {
    gameSignTask('mc')
  })
  logger.info(chalk.rgb(134, 142, 204)(`[库洛插件] 载入定时任务 bbsDailyTask`))
  schedule.scheduleJob('0 2 0 * * ? ', function () {
    bbsDailyTask()
  })

  logger.info(chalk.rgb(134, 142, 204)(`[库洛插件] 载入定时任务 checkUpdateTask`))
  schedule.scheduleJob('0 0 6/12 * * ? ', function () {
    checkUpdateTask()
  })
}

async function gameSignTask(gameName) {
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
      let msg = '[库洛插件]自动游戏签到\n\n'
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

async function bbsDailyTask() {
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
    let msg = '[库洛插件]自动社区签到\n\n'
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

async function checkUpdateTask() {
  logger.info(`[库洛插件] 检查更新任务开始...`)
  let remoteVersion = await getRemoteVersion('GitHub')
  if (!remoteVersion) {
    remoteVersion = await getRemoteVersion('GHProxy')
    if (!remoteVersion) {
      logger.warn(`[库洛插件] 检查更新任务失败`)
      await sendMsgFriend(cfg.masterQQ[0], `[库洛插件]自动检查更新失败!`)
      return false
    }
  }
  logger.info(`[库洛插件] 检查更新任务: 获取到最新版本 ${remoteVersion}, 本地版本 ${pluginVer}`)
  if (remoteVersion != pluginVer) {
    // 推送并缓存
    const cacheFilePath = '../data/system/versionCache.json'
    let versionCache = ''
    fs.readFile(cacheFilePath, 'utf8', (err, data) => {
      if (err) {
        logger.error('读取 versionCache.json 时出现错误：', err.message);
      } else {
        versionCache = data;
        logger.mark('versionCache: ', versionCache);
      }
    });
    if (versionCache?.remoteVersion == remoteVersion) {
      // 已经推送过了
      return false
    }
    versionCache = {remoteVersion: remoteVersion}
    let isCacheSucceed = false

    fs.writeFile(cacheFilePath, versionCache, (err) => {
      if (err) {
        logger.error('写入versionCache.json 时出现错误: ', err.message);
      } else {
        logger.mark('缓存远程版本成功!');
        isCacheSucceed = true
      }
    });
    await sendMsgFriend(cfg.masterQQ[0], `[库洛插件]自动检查更新\n发现新版本: ${remoteVersion}, 本地版本 ${pluginVer}` + (isCacheSucceed ? '' : '\n缓存版本信息失败, 该信息可能会重复推送'))

  }

  async function getRemoteVersion(type) {
    let checkUrl = 'https://github.com/TomyJan/Yunzai-Kuro-Plugin/raw/master/CHANGELOG.md'
    if (type == 'GHProxy') checkUrl = 'https://ghproxy.com/' + checkUrl
    try {
      let rsp = await fetch(checkUrl)
      if (!rsp.ok) {
        logger.warn(`[库洛插件] 从 ${type} 检查更新失败: ${rsp.status} ${rsp.statusText}`)
        return false
      }
      return await rsp.text()
    } catch (error) {
      logger.warn(`[库洛插件] 从 ${type} 检查更新失败: ${error.message}`)
      return false
    }
  }
  
}
