import kuroLogger from '../components/logger.js'
import { getToken } from './kuroBBSTokenHandler.js'
import { getRandomInt, sleepAsync, mGetDate } from './utils.js'
import kuroApi from './kuroApi.js'

export default class gameSignIn {
  constructor(e) {
    this.e = e
  }

  async pnsSignIn(uin) {
    const tokenData = await getToken(uin)
    kuroLogger.debug('tokenData:', JSON.stringify(tokenData))

    if (tokenData && Object.keys(tokenData).length > 0) {
      const accNum = Object.keys(tokenData).length
      await this.e.reply(
        `QQ ${uin} 绑定了 ${accNum} 个 token\n开始战双签到, 预计需要 ${
          accNum * 5
        }s~`
      )
      let startTime = Date.now()
      let msg = '[库洛插件] 游戏签到 - 战双\n\n'
      for (const kuro_uid in tokenData) {
        if (Object.prototype.hasOwnProperty.call(tokenData, kuro_uid)) {
          msg += await doPnsSignIn(this.e.user_id, kuro_uid)
          msg += `\n`
        } else {
          msg += `账号 ${kuro_uid}: \ntoken 格式错误\n\n`
        }
        await sleepAsync(getRandomInt(1000, 3000))
      }
      msg += `共用时 ${Math.floor((Date.now() - startTime) / 1000)}s\n`

      await this.e.reply(msg.trimEnd())
      return true
    } else {
      this.e.reply(`QQ ${uin} 暂未绑定 token, 请发送 #库洛在线登录 绑定 token `)
      return false
    }
  }

  async mcSignIn(uin) {
    const tokenData = await getToken(uin)
    kuroLogger.debug('tokenData:', JSON.stringify(tokenData))

    if (tokenData && Object.keys(tokenData).length > 0) {
      const accNum = Object.keys(tokenData).length
      await this.e.reply(
        `QQ ${uin} 绑定了 ${accNum} 个 token\n开始鸣潮签到, 预计需要 ${
          accNum * 5
        }s~`
      )
      let startTime = Date.now()
      let msg = '[库洛插件] 游戏签到 - 鸣潮\n\n'
      for (const kuro_uid in tokenData) {
        if (Object.prototype.hasOwnProperty.call(tokenData, kuro_uid)) {
          msg += await doMcSignIn(this.e.user_id, kuro_uid)
          msg += `\n`
        } else {
          msg += `账号 ${kuro_uid}: \ntoken 格式错误\n\n`
        }
        await sleepAsync(getRandomInt(1000, 3000))
      }
      msg += `共用时 ${Math.floor((Date.now() - startTime) / 1000)}s\n`

      await this.e.reply(msg.trimEnd())
      return true
    } else {
      this.e.reply(`QQ ${uin} 暂未绑定 token, 请发送 #库洛在线登录 绑定 token `)
      return false
    }
  }
}

/**
 * 执行单个库洛账号的战双签到, 可以不经构造调用
 * @param {number} uin QQ
 * @param {number} kuro_uid 库洛 ID
 * @returns {string} 可以直接发送的签到结果
 */
export async function doPnsSignIn(uin, kuro_uid) {
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

    let rsp_initSignInV2 = await kuroapi.initSignInV2(kuro_uid, {
      gameId: 2,
      serverId: data.serverId,
      roleId: data.roleId,
    })
    kuroLogger.debug('rsp_initSignInV2:', JSON.stringify(rsp_initSignInV2))
    if (typeof rsp_initSignInV2 == 'string') {
      // 不是 json, 即返回报错
      doPnsSignInRet += `      ${rsp_initSignInV2}\n`
      continue
    }
    if (rsp_initSignInV2.data.isSigIn) {
      // 如果今天已经签到
      doPnsSignInRet += `      今日已签`
    } else {
      // 签到
      let rsp_gameSignInV2 = await kuroapi.gameSignInV2(kuro_uid, {
        gameId: 2,
        serverId: data.serverId,
        roleId: data.roleId,
      })
      kuroLogger.debug('rsp_gameSignInV2:', JSON.stringify(rsp_gameSignInV2))
      let tmp = ''
      if (typeof rsp_gameSignInV2 !== 'string') {
        // 是 json
        tmp = '签到成功'
        rsp_initSignInV2.data.sigInNum++
      } else {
        tmp = rsp_gameSignInV2
      }
      doPnsSignInRet += `      ${tmp}`
    }

    doPnsSignInRet +=
      rsp_initSignInV2.data.sigInNum === (await mGetDate())
        ? `, 本月全勤达成!\n`
        : `, 本月签${rsp_initSignInV2.data.sigInNum}天` +
          (rsp_initSignInV2.data.omissionNnm !== 0
            ? `, 漏${rsp_initSignInV2.data.omissionNnm}天\n`
            : `\n`)

    // 签到获得的物品
    let rsp_queryGameSignInRecordV2 = await kuroapi.queryGameSignInRecordV2(
      kuro_uid,
      {
        gameId: 2,
        serverId: data.serverId,
        roleId: data.roleId,
      }
    )
    kuroLogger.debug(
      'rsp_queryGameSignInRecordV2:',
      JSON.stringify(rsp_queryGameSignInRecordV2)
    )
    if (typeof rsp_queryGameSignInRecordV2 == 'string') {
      // 不是 json, 即返回报错
      doPnsSignInRet += `      获取签到奖励失败: ${rsp_queryGameSignInRecordV2}\n`
    } else {
      if (rsp_queryGameSignInRecordV2.data.length > 0) {
        // 按照 type 排序, 让日签排在特殊的前面
        rsp_queryGameSignInRecordV2.data.sort((a, b) => a.type - b.type)
        let hasTodayGoods = false // 变量记录是否获取到了今天的物品
        for (const item of rsp_queryGameSignInRecordV2.data) {
          let today = new Date()
          let todayStr = `${today.getFullYear()}-${(
            '0' +
            (today.getMonth() + 1)
          ).slice(-2)}-${('0' + today.getDate()).slice(-2)}`
          // 鸣潮返回的日期是 2024-06-04 00:02:22 , 先格式化成 2024-06-04
          if (item.sigInDate.includes(' ')) {
            // kuroLogger.debug(`item.sigInDate ${item.sigInDate} 包含时间, 进行截断`)
            item.sigInDate = item.sigInDate.split(' ')[0]
            // kuroLogger.debug(`item.sigInDate 截断后: ${item.sigInDate}`)
          }
          if (item.sigInDate === todayStr) {
            kuroLogger.debug(
              `取到 ${data.roleId} 今日签到奖励: 类型: ${item.type} ${item.goodsName}x${item.goodsNum}`
            )
            // 只输出今天获得的物品
            hasTodayGoods = true
            if (item.type === 0) {
              doPnsSignInRet += `      签到获得${item.goodsName}x${item.goodsNum}\n`
            } else if (item.type === 2) {
              doPnsSignInRet += `      新手签到获得${item.goodsName}x${item.goodsNum}\n`
            } else if (item.type === 3) {
              doPnsSignInRet += `      限时签到获得${item.goodsName}x${item.goodsNum}\n`
            } else {
              doPnsSignInRet += `      特殊签到${item.type}获得${item.goodsName}x${item.goodsNum}\n`
            }
          }
        }
        if (!hasTodayGoods) {
          doPnsSignInRet += `      未获取到今日签到奖励\n`
        }
      } else {
        doPnsSignInRet += `      未获取到签到奖励\n`
      }
    }

    await sleepAsync(getRandomInt(1000, 3000))
  }

  return doPnsSignInRet
}

/**
 * 执行单个库洛账号的鸣潮签到, 可以不经构造调用
 * @param {number} uin QQ
 * @param {number} kuro_uid 库洛 ID
 * @returns {string} 可以直接发送的签到结果
 */
export async function doMcSignIn(uin, kuro_uid) {
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
    //执行签到查询后执行签到

    let rsp_initSignInV2 = await kuroapi.initSignInV2(kuro_uid, {
      gameId: 3,
      serverId: data.serverId,
      roleId: data.roleId,
    })
    kuroLogger.debug('rsp_initSignInV2:', JSON.stringify(rsp_initSignInV2))
    if (typeof rsp_initSignInV2 == 'string') {
      // 不是 json, 即返回报错
      doMcSignInRet += `      ${rsp_initSignInV2}\n`
      continue
    }
    if (rsp_initSignInV2.data.isSigIn) {
      //如果今天已经签到
      doMcSignInRet += `      今日已签`
    } else {
      // 签到
      let rsp_gameSignInV2 = await kuroapi.gameSignInV2(kuro_uid, {
        gameId: 3,
        serverId: data.serverId,
        roleId: data.roleId,
      })
      kuroLogger.debug('rsp_gameSignInV2:', JSON.stringify(rsp_gameSignInV2))
      let tmp = ''
      if (typeof rsp_gameSignInV2 !== 'string') {
        // 是 json
        tmp = '签到成功'
        rsp_initSignInV2.data.sigInNum++
      } else {
        tmp = rsp_gameSignInV2
      }
      doMcSignInRet += `      ${tmp}`
    }

    doMcSignInRet +=
      rsp_initSignInV2.data.sigInNum === (await mGetDate())
        ? `, 本月全勤达成!\n`
        : `, 本月签${rsp_initSignInV2.data.sigInNum}天` +
          (rsp_initSignInV2.data.omissionNnm !== 0
            ? `, 漏${rsp_initSignInV2.data.omissionNnm}天\n`
            : `\n`)

    // 签到获得的物品
    let rsp_queryGameSignInRecordV2 = await kuroapi.queryGameSignInRecordV2(
      kuro_uid,
      {
        gameId: 3,
        serverId: data.serverId,
        roleId: data.roleId,
      }
    )
    kuroLogger.debug(
      'rsp_queryGameSignInRecordV2:',
      JSON.stringify(rsp_queryGameSignInRecordV2)
    )
    if (typeof rsp_queryGameSignInRecordV2 == 'string') {
      // 不是 json, 即返回报错
      doMcSignInRet += `      获取签到奖励失败: ${rsp_queryGameSignInRecordV2}\n`
    } else {
      if (rsp_queryGameSignInRecordV2.data.length > 0) {
        // 按照 type 排序, 让日签排在特殊的前面
        rsp_queryGameSignInRecordV2.data.sort((a, b) => a.type - b.type)
        let hasTodayGoods = false // 变量记录是否获取到了今天的物品
        for (const item of rsp_queryGameSignInRecordV2.data) {
          let today = new Date()
          let todayStr = `${today.getFullYear()}-${(
            '0' +
            (today.getMonth() + 1)
          ).slice(-2)}-${('0' + today.getDate()).slice(-2)}`
          // 鸣潮返回的日期是 2024-06-04 00:02:22 , 先格式化成 2024-06-04
          if (item.sigInDate.includes(' ')) {
            // kuroLogger.debug(`item.sigInDate ${item.sigInDate} 包含时间, 进行截断`)
            item.sigInDate = item.sigInDate.split(' ')[0]
            // kuroLogger.debug(`item.sigInDate 截断后: ${item.sigInDate}`)
          }
          if (item.sigInDate === todayStr) {
            kuroLogger.debug(
              `取到 ${data.roleId} 今日签到奖励: 类型: ${item.type} ${item.goodsName}x${item.goodsNum}`
            )
            // 只输出今天获得的物品
            hasTodayGoods = true
            if (item.type === 0) {
              doMcSignInRet += `      签到获得${item.goodsName}x${item.goodsNum}\n`
            } else if (item.type === 2) {
              doMcSignInRet += `      新手签到获得${item.goodsName}x${item.goodsNum}\n`
            } else if (item.type === 3) {
              doMcSignInRet += `      限时签到获得${item.goodsName}x${item.goodsNum}\n`
            } else {
              doMcSignInRet += `      特殊签到${item.type}获得${item.goodsName}x${item.goodsNum}\n`
            }
          }
        }
        if (!hasTodayGoods) {
          doMcSignInRet += `      未获取到今日签到奖励\n`
        }
      } else {
        doMcSignInRet += `      未获取到签到奖励\n`
      }
    }

    await sleepAsync(getRandomInt(1000, 3000))
  }

  return doMcSignInRet
}
