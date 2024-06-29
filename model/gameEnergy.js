import kuroLogger from '../components/logger.js'
import { getToken } from './kuroBBSTokenHandler.js'
import kuroApi from './kuroApi.js'
import {
  sleepAsync,
  getRandomInt,
  formatTimestampInReadableFormat,
} from '../model/utils.js'

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
        if (tokenData.hasOwnProperty(kuro_uid)) {
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
        if (tokenData.hasOwnProperty(kuro_uid)) {
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
 * @returns {string} 可以直接发送的查询结果
 */
export async function doPnsEnergy(uin, kuro_uid) {
  let kuroapi = new kuroApi(uin)
  // 获取昵称
  let rsp_mineV2 = await kuroapi.mineV2(kuro_uid)
  if (rsp_mineV2 == `token 失效`) return `账号 ${kuro_uid}: \ntoken 失效\n`
  let doPnsSignInRet = ''
  doPnsSignInRet += `账号 ${
    rsp_mineV2.data.mine.userName || '未知昵称'
  }(${kuro_uid}): \n`
  // 获取绑定的游戏 id 列表有俩接口, emmm 迷惑
  let rsp_findRoleList = await kuroapi.findRoleList(kuro_uid, { gameId: 2 })
  kuroLogger.debug('rsp_findRoleList:', JSON.stringify(rsp_findRoleList))
  if (typeof rsp_findRoleList == 'string') {
    // 不是 json, 即返回报错
    doPnsSignInRet += `${rsp_findRoleList}\n`
    return doPnsSignInRet
  }
  if (rsp_findRoleList.data.length === 0) {
    // 没绑定游戏账号
    doPnsSignInRet += '未绑定游戏账号\n'
    return doPnsSignInRet
  }
  for (const data of rsp_findRoleList.data) {
    doPnsSignInRet += `${data.serverName}-${data.roleName}(${data.roleId}): \n`
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
      doPnsSignInRet += `      ${rsp_getPnsWidgetData}\n`
      continue
    }
    doPnsSignInRet += `      ${formatTimestampInReadableFormat(
      rsp_getPnsWidgetData.data.actionData.refreshTimeStamp
    )}回满 (${rsp_getPnsWidgetData.data.actionData.value})\n`

    await sleepAsync(getRandomInt(100, 600))
  }

  return doPnsSignInRet
}

/**
 * 执行单个库洛账号的鸣潮结晶波片查询, 可以不经构造调用
 * @param {number} uin QQ
 * @param {number} kuro_uid 库洛 ID
 * @returns {string} 可以直接发送的查询结果
 */
export async function doMcEnergy(uin, kuro_uid) {
  let kuroapi = new kuroApi(uin)
  // 获取昵称
  let rsp_mineV2 = await kuroapi.mineV2(kuro_uid)
  if (rsp_mineV2 == `token 失效`) return `账号 ${kuro_uid}: \ntoken 失效\n`
  let doMcSignInRet = ''
  doMcSignInRet += `账号 ${
    rsp_mineV2.data.mine.userName || '未知昵称'
  }(${kuro_uid}): \n`
  // 获取绑定的游戏 id 列表有俩接口, emmm 迷惑
  let rsp_findRoleList = await kuroapi.findRoleList(kuro_uid, { gameId: 3 })
  kuroLogger.debug('rsp_findRoleList:', JSON.stringify(rsp_findRoleList))
  if (typeof rsp_findRoleList == 'string') {
    // 不是 json, 即返回报错
    doMcSignInRet += `${rsp_findRoleList}\n`
    return doMcSignInRet
  }
  if (rsp_findRoleList.data.length === 0) {
    // 没绑定游戏账号
    doMcSignInRet += '未绑定游戏账号\n'
    return doMcSignInRet
  }
  for (const data of rsp_findRoleList.data) {
    doMcSignInRet += `${data.serverName}-${data.roleName}(${data.roleId}): \n`
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
      doMcSignInRet += `      ${rsp_getMcWidgetData}\n`
      continue
    }
    doMcSignInRet += `      ${formatTimestampInReadableFormat(
      rsp_getMcWidgetData.data.energyData.refreshTimeStamp
    )}回满 (${rsp_getMcWidgetData.data.energyData.cur}/${rsp_getMcWidgetData.data.energyData.total})\n`

    await sleepAsync(getRandomInt(100, 600))
  }

  return doMcSignInRet
}
