import fs from 'node:fs'
import kuroApi from './kuroApi.js'
import kuroLogger from '../components/logger.js'
import { dataPath } from '../data/system/pluginConstants.js'
import { getToken } from './kuroBBSTokenHandler.js'

/**
 * 获取指定 QQ 目前使用的战双 uid 索引
 * @param {number} uin QQ
 * @returns {number} 索引, -1 为读取失败
 */
export async function getAccCurPnsUidIndex(qq) {
  kuroLogger.debug(`获取用户 ${qq} 使用的战双 uid 索引...`)
  let kuroapi = new kuroApi(qq)
  let { accCurPnsUid, accCurPnsUidInKuroUid } = await getAccCurPnsUidLocal(qq)
  if (!accCurPnsUid || !accCurPnsUidInKuroUid) {
    // 如果没找到使用的 uid, 就设置为第一个 uid
    kuroLogger.debug(`用户 ${qq} 未设置使用的战双 uid, 尝试获取第一个 uid...`)
    let tokenData = await getToken(qq)
    let kuroUidToFetch = 0
    let kuroUidIndex = 0
    let fetchedUid = 0
    do {
      kuroLogger.debug(`尝试获取第 ${kuroUidIndex + 1} 个库洛 id 下的 uid...`)
      kuroUidToFetch = Object.keys(tokenData)[kuroUidIndex++]
      let rsp_roleList = await kuroapi.roleList(kuroUidToFetch, { gameId: 2 })
      if (typeof rsp_roleList !== 'string') {
        if (rsp_roleList.data.length > 0) {
          kuroLogger.debug(
            `成功在第 ${kuroUidIndex} 个库洛 id 下找到 uid: ${rsp_roleList.data[0].roleId}`
          )
          fetchedUid = rsp_roleList.data[0].roleId
        }
      }
    } while (
      fetchedUid === 0 &&
      Object.keys(tokenData).length > 0 &&
      kuroUidIndex < Object.keys(tokenData).length
    )
    kuroLogger.debug(`获取到的 uid: ${fetchedUid}`)

    if (fetchedUid !== 0) {
      kuroLogger.debug(
        `将 ${qq} 使用的战双 uid 设置为 ${fetchedUid}, 库洛 uid 为 ${kuroUidToFetch}, 保存文件...`
      )
      saveAccCurPnsUid(qq, fetchedUid, kuroUidToFetch)
      return kuroUidIndex - 1
    }
    return -1
  }

  kuroLogger.debug(
    `用户 ${qq} 使用的战双 uid 为 ${accCurPnsUid}, 对应库洛帐号 uid 为 ${accCurPnsUidInKuroUid}, 尝试获取索引...`
  )
  // 如果本地获取到uid了, 就查找uid的索引
  let uidIndex = 0
  let succeed = false
  // 先用qq获取到用户绑定的库洛uid
  let tokenData = await getToken(qq)
  for (const kuro_uid in tokenData) {
    if (succeed) break
    kuroLogger.debug(
      `尝试从第 ${
        uidIndex + 1
      } 个库洛 id ${kuro_uid} 下查找 uid ${accCurPnsUid}...`
    )
    let rsp_roleList = await kuroapi.roleList(kuro_uid, { gameId: 2 })
    if (typeof rsp_roleList !== 'string') {
      if (rsp_roleList.data.length > 0) {
        kuroLogger.debug(
          `在第 ${uidIndex + 1} 个库洛 id ${kuro_uid} 下找到 ${
            rsp_roleList.data.length
          } 个 uid: ${rsp_roleList.data.map((role) => role.roleId).join(', ')}`
        )
        // 遍历data数组查找uid
        for (const role of rsp_roleList.data) {
          if (role.roleId === accCurPnsUid) {
            kuroLogger.debug(`找到 uid: ${accCurPnsUid}, 索引为 ${uidIndex}`)
            await saveAccCurPnsUid(qq, accCurPnsUid, kuro_uid)
            succeed = true
            break
          }
          uidIndex++
        }
      }
    } else continue // 如果获取数据失败就跳过吧
  }
  kuroLogger.debug(
    `用户 ${qq} 使用的战双 uid 索引 ${succeed ? '已' : '未'} 获取`
  )
  // TODO: 如果没有获取到, 应该再写入一下配置文件, 这里的代码以后再整理
  return succeed ? uidIndex : 0
}

/**
 * 从本地获取指定 QQ 目前使用的战双 uid
 * @param {number} uin QQ
 * @returns {object} 战双 uid 和所在的库洛 uid { accCurPnsUid: 0, accCurPnsUidInKuroUid: 0}
 */
export async function getAccCurPnsUidLocal(qq) {
  // 从 dataPath/userSetting/qq.json 中读取
  let qqData = {}
  try {
    const fileData = await fs.promises.readFile(
      dataPath + `/userSetting/${qq}.json`,
      'utf-8'
    )
    qqData = JSON.parse(fileData)
    kuroLogger.debug(`用户设置文件已读取: ${JSON.stringify(qqData)}`)
    return {
      accCurPnsUid: qqData.accCurPnsUid || 0,
      accCurPnsUidInKuroUid: qqData.accCurPnsUidInKuroUid || 0,
    }
  } catch (error) {
    kuroLogger.error(`读取用户设置文件时出错: ${error.message}`)
    return { accCurPnsUid: 0, accCurPnsUidInKuroUid: 0 }
  }
}

/**
 * 保存指定 QQ 目前使用的战双 uid 和所在的库洛 uid
 * @param {number} uin QQ
 * @param {number} uid uid
 * @param {number} kuro_uid 库洛 uid
 * @returns {boolean} 是否成功
 */
export async function saveAccCurPnsUid(qq, uid, kuro_uid) {
  kuroLogger.debug(
    `保存用户 ${qq} 使用的战双 uid ${uid} 和所在库洛 uid ${kuro_uid}...`
  )
  try {
    const qqData = { accCurPnsUid: uid, accCurPnsUidInKuroUid: kuro_uid }
    const filePath = dataPath + `/userSetting/${qq}.json`
    const jsonData = JSON.stringify(qqData)

    await fs.promises.mkdir(dataPath + '/userSetting', { recursive: true })

    let existingData = {}
    try {
      const fileData = await fs.promises.readFile(filePath, 'utf-8')
      existingData = JSON.parse(fileData)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        kuroLogger.error(`读取用户设置文件时出错: ${error.message}`)
      }
    }

    const newData = { ...existingData, ...qqData }
    const newJsonData = JSON.stringify(newData)

    await fs.promises.writeFile(filePath, newJsonData)
    kuroLogger.debug(`用户设置已保存至文件: ${filePath}`)
    return true
  } catch (error) {
    kuroLogger.warn(`保存用户设置时出错: ${error.message}`)
    return false
  }
}

/**
 * 通过 uid 索引来保存指定 QQ 目前使用的战双 uid
 * @param {number} uin QQ
 * @param {number} uidIndex uid 索引
 * @returns {boolean} 是否成功
 */
export async function saveAccCurPnsUidIndex(qq, uidIndex) {
  kuroLogger.debug(`保存用户 ${qq} 使用的战双 uid 索引 ${uidIndex}...`)
  let tokenData = await getToken(qq)
  let kuroUidIndex = 0
  let kuroUidToFetch = Object.keys(tokenData)[kuroUidIndex]
  let kuroapi = new kuroApi(qq)
  do {
    let rsp_roleList = await kuroapi.roleList(kuroUidToFetch, { gameId: 2 })
    if (typeof rsp_roleList !== 'string') {
      if (rsp_roleList.data.length > 0) {
        for (const role of rsp_roleList.data) {
          if (uidIndex-- === 0) {
            await saveAccCurPnsUid(qq, role.roleId, kuroUidToFetch)
            return true
          }
        }
      }
    }
    kuroUidToFetch = Object.keys(tokenData)[++kuroUidIndex]
  } while (kuroUidIndex < Object.keys(tokenData).length)

  kuroLogger.warn(`保存用户 ${qq} 使用的战双 uid 索引 ${uidIndex} 失败`)

  return false
}
