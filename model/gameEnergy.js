import kuroLogger from '../components/logger.js'
import { getToken } from './kuroBBSTokenHandler.js'
import kuroApi from './kuroApi.js'
import {
  sleepAsync,
  getRandomInt,
  formatTimestampInReadableFormat,
  sendMsgFriend,
} from '../model/utils.js'
import userConfig from './userConfig.js'

export default class gameEnergy {
  constructor(e) {
    this.e = e
  }

  async pnsEnergy(uin) {
    const tokenData = await getToken(uin)
    kuroLogger.debug('tokenData:', JSON.stringify(tokenData))

    if (tokenData && Object.keys(tokenData).length > 0) {
      const accNum = Object.keys(tokenData).length
      let startQueryMsg = await this.e.reply(
        `QQ ${uin} 绑定了 ${accNum} 个 token, 开始查询战双血清~`
      )
      let msg = '[库洛插件] 战双血清查询\n\n'
      for (const kuro_uid in tokenData) {
        if (Object.prototype.hasOwnProperty.call(tokenData, kuro_uid)) {
          msg += await doPnsEnergy(this.e.user_id, kuro_uid)
          msg += `\n`
        } else {
          msg += `账号 ${kuro_uid}: \ntoken 格式错误\n\n`
        }
        await sleepAsync(getRandomInt(300, 1200))
      }

      if (startQueryMsg) {
        try {
          if (this.e.group) this.e.group.recallMsg(startQueryMsg.message_id)
          if (this.e.private) this.e.private.recallMsg(startQueryMsg.message_id)
        } catch (error) {
          kuroLogger.warn(`撤回消息失败: ${JSON.stringify(error)}`)
        }
      }
      await this.e.reply(msg.trimEnd())
      return true
    } else {
      this.e.reply(`QQ ${uin} 暂未绑定 token, 请发送 #库洛在线登录 绑定 token `)
      return false
    }
  }

  async mcEnergy(uin) {
    const tokenData = await getToken(uin)
    kuroLogger.debug('tokenData:', JSON.stringify(tokenData))

    if (tokenData && Object.keys(tokenData).length > 0) {
      const accNum = Object.keys(tokenData).length
      let startQueryMsg = await this.e.reply(
        `QQ ${uin} 绑定了 ${accNum} 个 token, 开始查询鸣潮结晶波片~`
      )
      let msg = '[库洛插件] 鸣潮结晶波片查询\n\n'
      for (const kuro_uid in tokenData) {
        if (Object.prototype.hasOwnProperty.call(tokenData, kuro_uid)) {
          msg += await doMcEnergy(this.e.user_id, kuro_uid)
          msg += `\n`
        } else {
          msg += `账号 ${kuro_uid}: \ntoken 格式错误\n\n`
        }
        await sleepAsync(getRandomInt(300, 1200))
      }

      if (startQueryMsg) {
        try {
          if (this.e.group) this.e.group.recallMsg(startQueryMsg.message_id)
          if (this.e.private) this.e.private.recallMsg(startQueryMsg.message_id)
        } catch (error) {
          kuroLogger.warn(`撤回消息失败: ${JSON.stringify(error)}`)
        }
      }
      await this.e.reply(msg.trimEnd())
      return true
    } else {
      this.e.reply(`QQ ${uin} 暂未绑定 token, 请发送 #库洛在线登录 绑定 token `)
      return false
    }
  }
}

/**
 * 执行单个库洛账号的战双血清查询, 可以不经构造调用
 * @param {number} uin QQ
 * @param {number} kuro_uid 库洛 ID
 * @param {boolean} isPushTask 是否是体力推送任务, 自动任务推送用, 默认 false
 * @param {boolean} pushTaskNeedPush 是否需要推送, 自动任务保存需要推送的账号队列用, 默认 false
 * @returns {string} 可以直接发送的查询结果
 */
export async function doPnsEnergy(
  uin,
  kuro_uid,
  isPushTask = false,
  pushTaskNeedPush = false
) {
  let kuroapi = new kuroApi(uin)
  // 获取昵称
  let rsp_mineV2 = await kuroapi.mineV2(kuro_uid)
  if (rsp_mineV2 == `token 失效`) return `账号 ${kuro_uid}: \ntoken 失效\n`
  let doPnsEnergyRet = ''
  doPnsEnergyRet += `账号 ${
    rsp_mineV2.data.mine.userName || '未知昵称'
  }(${kuro_uid}): \n`
  // 获取绑定的游戏 id 列表有俩接口, emmm 迷惑
  let rsp_findRoleList = await kuroapi.findRoleList(kuro_uid, { gameId: 2 })
  kuroLogger.debug('rsp_findRoleList:', JSON.stringify(rsp_findRoleList))
  if (typeof rsp_findRoleList == 'string') {
    // 不是 json, 即返回报错
    doPnsEnergyRet += `${rsp_findRoleList}\n`
    return doPnsEnergyRet
  }
  if (rsp_findRoleList.data.length === 0) {
    // 没绑定游戏账号
    doPnsEnergyRet += '未绑定游戏账号\n'
    return doPnsEnergyRet
  }
  for (const data of rsp_findRoleList.data) {
    doPnsEnergyRet += `${data.serverName}-${data.roleName}(${data.roleId}): \n`
    // 执行签到查询后执行签到

    let rsp_getPnsWidgetData = await kuroapi.getPnsWidgetData(kuro_uid, {
      serverId: data.serverId,
      roleId: data.roleId,
    })
    kuroLogger.debug(
      'rsp_getPnsWidgetData:',
      JSON.stringify(rsp_getPnsWidgetData)
    )
    if (typeof rsp_getPnsWidgetData == 'string') {
      // 不是 json, 即返回报错
      doPnsEnergyRet += `      ${rsp_getPnsWidgetData}\n`
      continue
    }
    // 傻逼库洛服务器时间有时候不对, 需要检查并纠正一下
    let localTimeStamp = Math.floor(Date.now() / 1000)
    let diff = localTimeStamp - rsp_getPnsWidgetData.data.serverTime
    kuroLogger.debug(`服务器与本地时间差: ${diff}`)
    // 如果时间差大于 10 分钟, 则认为服务器时间不准确, 使用本地时间纠正服务器时间
    if (diff >= 600 || diff <= -600) {
      rsp_getPnsWidgetData.data.serverTime = localTimeStamp
      rsp_getPnsWidgetData.data.actionData.refreshTimeStamp = rsp_getPnsWidgetData.data.actionData.refreshTimeStamp + diff
      kuroLogger.debug(`服务器时间误差过大, 纠正后: ${JSON.stringify(rsp_getPnsWidgetData)}`)
    }
    doPnsEnergyRet += `      ${formatTimestampInReadableFormat(
      rsp_getPnsWidgetData.data.actionData.refreshTimeStamp
    )}回满 (${rsp_getPnsWidgetData.data.actionData.value})\n`

    // 延迟到回满时间后执行推送, 如果回满时间在两小时内
    kuroLogger.debug(
      `QQ ${uin} 的战双 UID ${data.roleId} 的体力推送任务, 刷新时间: ${
        rsp_getPnsWidgetData.data.actionData.refreshTimeStamp
      }, 服务器时间: ${rsp_getPnsWidgetData.data.serverTime}, 距离刷新时间: ${
        rsp_getPnsWidgetData.data.actionData.refreshTimeStamp -
        rsp_getPnsWidgetData.data.serverTime
      }`
    )
    if (
      isPushTask &&
      rsp_getPnsWidgetData.data.actionData.refreshTimeStamp > 0 &&
      rsp_getPnsWidgetData.data.actionData.refreshTimeStamp -
        rsp_getPnsWidgetData.data.serverTime <=
        3600
    ) {
      let delay =
        rsp_getPnsWidgetData.data.actionData.refreshTimeStamp -
        rsp_getPnsWidgetData.data.serverTime
      if (delay < 0) {
        kuroLogger.error(
          `QQ ${uin} 的战双 UID ${data.roleId} 的体力推送任务, 刷新时间小于当前时间, 跳过`
        )
        continue
      }
      delay *= 1000
      pushTaskNeedPush = true
      kuroLogger.debug(
        `QQ ${uin} 的战双 UID ${data.roleId} 的体力推送任务, 延迟 ${delay} 毫秒后执行, pushTaskNeedPush=${pushTaskNeedPush}`
      )
      setTimeout(async () => {
        kuroLogger.debug(
          `准备执行账号 ${kuro_uid} 的战双 UID ${data.roleId} 的体力推送任务`
        )
        doEnergyPush(uin, kuro_uid, 2, data.roleId, data.serverId)
      }, delay)
    }

    await sleepAsync(getRandomInt(100, 600))
  }

  return doPnsEnergyRet
}

/**
 * 执行单个库洛账号的鸣潮结晶波片查询, 可以不经构造调用
 * @param {number} uin QQ
 * @param {number} kuro_uid 库洛 ID
 * @param {boolean} isPushTask 是否是体力推送任务, 自动任务推送用, 默认 false
 * @param {boolean} pushTaskNeedPush 是否需要推送, 自动任务保存需要推送的账号队列用, 默认 false
 * @returns {string} 可以直接发送的查询结果
 */
export async function doMcEnergy(
  uin,
  kuro_uid,
  isPushTask = false,
  pushTaskNeedPush = false
) {
  let kuroapi = new kuroApi(uin)
  // 获取昵称
  let rsp_mineV2 = await kuroapi.mineV2(kuro_uid)
  if (rsp_mineV2 == `token 失效`) return `账号 ${kuro_uid}: \ntoken 失效\n`
  let doMcEnergyRet = ''
  doMcEnergyRet += `账号 ${
    rsp_mineV2.data.mine.userName || '未知昵称'
  }(${kuro_uid}): \n`
  // 获取绑定的游戏 id 列表有俩接口, emmm 迷惑
  let rsp_findRoleList = await kuroapi.findRoleList(kuro_uid, { gameId: 3 })
  kuroLogger.debug('rsp_findRoleList:', JSON.stringify(rsp_findRoleList))
  if (typeof rsp_findRoleList == 'string') {
    // 不是 json, 即返回报错
    doMcEnergyRet += `${rsp_findRoleList}\n`
    return doMcEnergyRet
  }
  if (rsp_findRoleList.data.length === 0) {
    // 没绑定游戏账号
    doMcEnergyRet += '未绑定游戏账号\n'
    return doMcEnergyRet
  }
  for (const data of rsp_findRoleList.data) {
    doMcEnergyRet += `${data.serverName}-${data.roleName}(${data.roleId}): \n`
    // 执行签到查询后执行签到

    let rsp_getMcWidgetData = await kuroapi.getMcWidgetData(kuro_uid, {
      serverId: data.serverId,
      roleId: data.roleId,
    })
    kuroLogger.debug(
      'rsp_getMcWidgetData:',
      JSON.stringify(rsp_getMcWidgetData)
    )
    if (typeof rsp_getMcWidgetData == 'string') {
      // 不是 json, 即返回报错
      doMcEnergyRet += `      ${rsp_getMcWidgetData}\n`
      continue
    }
    // 傻逼库洛服务器时间有时候不对, 需要检查并纠正一下
    let localTimeStamp = Math.floor(Date.now() / 1000)
    let diff = localTimeStamp - rsp_getMcWidgetData.data.serverTime
    kuroLogger.debug(`服务器与本地时间差: ${diff}`)
    // 如果时间差大于 10 分钟, 则认为服务器时间不准确, 使用本地时间纠正服务器时间
    if (diff >= 600 || diff <= -600) {
      rsp_getMcWidgetData.data.serverTime = localTimeStamp
      rsp_getMcWidgetData.data.energyData.refreshTimeStamp = rsp_getMcWidgetData.data.energyData.refreshTimeStamp + diff
      kuroLogger.debug(`服务器时间误差过大, 纠正后: ${JSON.stringify(rsp_getMcWidgetData)}`)
    }

    doMcEnergyRet += `      ${formatTimestampInReadableFormat(
      rsp_getMcWidgetData.data.energyData.refreshTimeStamp
    )}回满 (${rsp_getMcWidgetData.data.energyData.cur}/${
      rsp_getMcWidgetData.data.energyData.total
    })\n`

    // 延迟到回满时间后执行推送, 如果还未回满且回满时间在一小时内
    kuroLogger.debug(
      `QQ ${uin} 的鸣潮 UID ${data.roleId} 的体力推送任务, 刷新时间: ${
        rsp_getMcWidgetData.data.energyData.refreshTimeStamp
      }, 服务器时间: ${rsp_getMcWidgetData.data.serverTime}, 距离刷新时间: ${
        rsp_getMcWidgetData.data.energyData.refreshTimeStamp -
        rsp_getMcWidgetData.data.serverTime
      }`
    )
    if (
      isPushTask &&
      rsp_getMcWidgetData.data.energyData.refreshTimeStamp > 0 &&
      rsp_getMcWidgetData.data.energyData.refreshTimeStamp -
        rsp_getMcWidgetData.data.serverTime <=
        3600
    ) {
      let delay =
        rsp_getMcWidgetData.data.energyData.refreshTimeStamp -
        rsp_getMcWidgetData.data.serverTime
      if (delay < 0) {
        kuroLogger.error(
          `QQ ${uin} 的鸣潮 UID ${data.roleId} 的体力推送任务, 刷新时间小于当前时间, 跳过`
        )
        continue
      }
      delay *= 1000
      pushTaskNeedPush = true
      kuroLogger.debug(
        `QQ ${uin} 的鸣潮 UID ${data.roleId} 的体力推送任务, 延迟 ${delay} 毫秒后执行, pushTaskNeedPush=${pushTaskNeedPush}`
      )
      setTimeout(async () => {
        kuroLogger.debug(
          `准备执行账号 ${kuro_uid} 的鸣潮 UID ${data.roleId} 的体力推送任务`
        )
        doEnergyPush(uin, kuro_uid, 3, data.roleId, data.serverId)
      }, delay)
    }

    await sleepAsync(getRandomInt(100, 600))
  }

  return doMcEnergyRet
}

/**
 * 执行单个账号的游戏体力查询和推送
 * @param {number} uin 对方 QQ
 * @param {number} kuroUid 游戏 UID 所在库洛 ID
 * @param {number} gameId 游戏 ID, 2 战双血清, 3 鸣潮结晶波片
 * @param {number} gameUid 游戏 UID
 * @param {number} gameServerId 游戏服务器 ID
 * @returns {boolean} 是否成功
 */
export async function doEnergyPush(
  uin,
  kuroUid,
  gameId,
  gameUid,
  gameServerId
) {
  if (gameId !== 2 && gameId !== 3) {
    kuroLogger.error(`未知的游戏 ID: ${gameId}`)
    return false
  }
  kuroLogger.debug(
    `准备执行 QQ ${uin} 的账号 ${kuroUid} 的游戏 ${gameId} 在服务器 ${gameServerId} 的 UID ${gameUid} 的体力推送任务`
  )
  // 先判断推送时间是否是十分钟之内, 避免重复推送
  let user = new userConfig()
  let lastPushTime = await user.getEnergyLastPushTime(uin, gameId, gameUid)
  if (lastPushTime !== -1 && Date.now() - lastPushTime < 600000) {
    kuroLogger.debug(
      `账号 ${kuroUid} 的游戏 ${gameId} 在服务器 ${gameServerId} 的 UID ${gameUid} 的体力推送任务已在十分钟之内执行过, 跳过`
    )
    return false
  }

  // 然后执行体力查询
  let kuroapi = new kuroApi(uin)
  let rsp = null
  if (gameId === 2) {
    rsp = await kuroapi.getPnsWidgetData(kuroUid, {
      serverId: gameServerId,
      roleId: gameUid,
    })
  } else if (gameId === 3) {
    rsp = await kuroapi.getMcWidgetData(kuroUid, {
      serverId: gameServerId,
      roleId: gameUid,
    })
  }
  kuroLogger.debug(`查询结果: ${JSON.stringify(rsp)}`)
  if (typeof rsp === 'string') {
    kuroLogger.error(`查询体力失败: ${rsp}`)
    return false
  }
  let energy = 0
  let energyMax = 0
  if (gameId === 2) {
    energy = rsp.data.actionData.cur
    energyMax = rsp.data.actionData.total
  } else if (gameId === 3) {
    energy = rsp.data.energyData.cur
    energyMax = rsp.data.energyData.total
  }
  kuroLogger.info(
    `准备执行 QQ ${uin} 的账号 ${kuroUid} 的游戏 ${gameId} 体力: ${energy}/${energyMax}`
  )

  let apiDataIsFull = true
  // 因为库洛接口有缓存, 观察发现缓存时间一般不超过 2 体力, 所以这里判断体力是否恢复
  let apiDataWillFull = false
  if (energy < energyMax) {
    apiDataIsFull = false
    if (energyMax - energy <= 2) {
      apiDataWillFull = true
    }
  }

  // 推送, 推送前再次判断是否十分钟之前, 防止重复
  lastPushTime = await user.getEnergyLastPushTime(uin, gameId, gameUid)
  if (lastPushTime !== -1 && Date.now() - lastPushTime < 600000) {
    kuroLogger.debug(
      `账号 ${kuroUid} 的游戏 ${gameId} 在服务器 ${gameServerId} 的 UID ${gameUid} 的体力推送任务已在十分钟之内执行过, 跳过`
    )
    return false
  }
  user.saveEnergyLastPushTime(uin, gameId, gameUid, Date.now())

  let pushMsg = apiDataIsFull
    ? `未知的游戏 ${gameId} UID ${gameUid} 的体力恢复啦 (${energy}/${energyMax}) ~`
    : apiDataWillFull
      ? `未知的游戏 ${gameId} UID ${gameUid} 的体力此时应已恢复 (${energy}/${energyMax}) ~`
      : ``
  if (gameId === 2)
    pushMsg = apiDataIsFull
      ? `你的战双 UID ${gameUid} 的血清恢复啦 (${energy}/${energyMax}) ~`
      : apiDataWillFull
        ? `你的战双 UID ${gameUid} 的血清此时应已恢复 (${energy}/${energyMax}) ~`
        : ``
  if (gameId === 3)
    pushMsg = apiDataIsFull
      ? `你的鸣潮 UID ${gameUid} 的结晶波片恢复啦 (${energy}/${energyMax}) ~`
      : apiDataWillFull
        ? `你的鸣潮 UID ${gameUid} 的结晶波片此时应已恢复 (${energy}/${energyMax}) ~`
        : ``

  if (pushMsg) {
    await sendMsgFriend(uin, pushMsg)
  } else {
    kuroLogger.warn(`QQ ${uin} 的 UID ${gameUid} 推送消息为空, 体力未恢复, 取消推送`)
  }

  return true
}
