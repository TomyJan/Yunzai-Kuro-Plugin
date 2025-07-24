import fs from 'node:fs'
import kuroApi from './kuroApi.js'
import kuroLogger from '../components/logger.js'
import { dataPath } from '../data/system/pluginConstants.js'
import { getToken } from './kuroBBSTokenHandler.js'

export default class userConfig {
  /**
   * 获取指定 QQ 目前使用的游戏 uid 索引
   * @param {number} uin QQ
   * @param {number} gameId 游戏 id, 战双=2, 鸣潮=3
   * @returns {number} 索引, -1 为读取失败
   */
  async getCurGameUidIndex(qq, gameId) {
    kuroLogger.debug(`获取用户 ${qq} 使用的游戏 ${gameId} 的 uid 索引...`)
    let kuroapi = new kuroApi(qq)
    let { gameUid, inKuroUid } = await this.getCurGameUidLocal(qq, gameId)
    if (!gameUid || !inKuroUid) {
      // 如果没找到使用的 uid, 就设置为第一个 uid
      kuroLogger.debug(
        `用户 ${qq} 未设置使用的游戏 ${gameId} 的 uid, 尝试获取第一个 uid...`,
      )
      let tokenData = await getToken(qq)
      let kuroUidToFetch = 0
      let kuroUidIndex = 0
      let fetchedUid = 0
      do {
        kuroLogger.debug(`尝试获取第 ${kuroUidIndex + 1} 个库洛 id 下的 uid...`)
        kuroUidToFetch = Object.keys(tokenData)[kuroUidIndex++]
        let rsp_roleList = await kuroapi.roleList(kuroUidToFetch, { gameId })
        if (typeof rsp_roleList !== 'string') {
          if (rsp_roleList.data.length > 0) {
            kuroLogger.debug(
              `成功在第 ${kuroUidIndex} 个库洛 id 下找到 uid: ${rsp_roleList.data[0].roleId}`,
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
          `将 ${qq} 使用的游戏 ${gameId} 的 uid 设置为 ${fetchedUid}, 库洛 uid 为 ${kuroUidToFetch}, 保存文件...`,
        )
        this.saveCurGameUid(qq, fetchedUid, kuroUidToFetch, gameId)
        return kuroUidIndex - 1
      }
      return -1
    }

    kuroLogger.debug(
      `用户 ${qq} 使用的游戏 ${gameId} 的 uid 为 ${gameUid}, 对应库洛帐号 uid 为 ${inKuroUid}, 尝试获取索引...`,
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
        } 个库洛 id ${kuro_uid} 下查找 uid ${gameUid}...`,
      )
      let rsp_roleList = await kuroapi.roleList(kuro_uid, { gameId })
      if (typeof rsp_roleList !== 'string') {
        if (rsp_roleList.data.length > 0) {
          kuroLogger.debug(
            `在第 ${uidIndex + 1} 个库洛 id ${kuro_uid} 下找到 ${
              rsp_roleList.data.length
            } 个 uid: ${rsp_roleList.data
              .map((role) => role.roleId)
              .join(', ')}`,
          )
          // 遍历data数组查找uid
          for (const role of rsp_roleList.data) {
            if (role.roleId === gameUid) {
              kuroLogger.debug(`找到 uid: ${gameUid}, 索引为 ${uidIndex}`)
              await this.saveCurGameUid(qq, gameUid, kuro_uid, gameId)
              succeed = true
              break
            }
            uidIndex++
          }
        }
      } else continue // 如果获取数据失败就跳过吧
    }
    kuroLogger.debug(
      `用户 ${qq} 使用的游戏 ${gameId} 的 uid 索引 ${
        succeed ? '已' : '未'
      } 获取`,
    )
    // TODO: 如果没有获取到, 应该再写入一下配置文件, 这里的代码以后再整理
    return succeed ? uidIndex : 0
  }

  /**
   * 从本地获取指定 QQ 目前使用的游戏 uid 和所在的库洛 uid, 如果不存在则返回 0
   * @param {number} uin QQ
   * @param {number} gameId 游戏 id, 战双=2, 鸣潮=3
   * @returns {object} 游戏 uid 和所在的库洛 uid { gameUid: 0, inKuroUid: 0}
   */
  async getCurGameUidLocal(qq, gameId) {
    // 从 dataPath/userSetting/qq.json 中读取
    let qqData = {}
    try {
      const fileData = await fs.promises.readFile(
        dataPath + `/userSetting/${qq}.json`,
        'utf-8',
      )
      qqData = JSON.parse(fileData)?.curGameUid?.[gameId] || {}
      kuroLogger.debug(
        `获取用户当前游戏 uid: 用户设置文件已读取: ${JSON.stringify(qqData)}`,
      )
      return {
        gameUid: qqData.gameUid || 0,
        inKuroUid: qqData.inKuroUid || 0,
      }
    } catch (error) {
      kuroLogger.error(`读取用户设置文件时出错: ${error.message}`)
      return { gameUid: 0, inKuroUid: 0 }
    }
  }

  /**
   * 保存指定 QQ 目前使用的游戏 uid 和所在的库洛 uid
   * @param {number} uin QQ
   * @param {number} uid uid
   * @param {number} kuro_uid 库洛 uid
   * @param {number} gameId 游戏 id, 战双=2, 鸣潮=3
   * @returns {boolean} 是否成功
   */
  async saveCurGameUid(qq, uid, kuro_uid, gameId) {
    kuroLogger.debug(
      `保存用户 ${qq} 使用的游戏 ${gameId} 的 uid ${uid} 和所在库洛 uid ${kuro_uid}...`,
    )
    // 如果 kuro_uid 为 0, 则通过 api 遍历找出 uid
    if (kuro_uid === 0) {
      kuroLogger.debug(`库洛 uid 为 0, 尝试通过 api 遍历找出 uid...`)
      let tokenData = await getToken(qq)
      let kuroUidIndex = 0
      if (tokenData) {
        let kuroUidToFetch = Object.keys(tokenData)[kuroUidIndex]
        let kuroapi = new kuroApi(qq)
        do {
          if (!kuroUidToFetch) {
            kuroLogger.warn(
              `用户 ${qq} 没有绑定 token, 无法通过 api 遍历找出 uid`,
            )
            break
          }
          let rsp_roleList = await kuroapi.roleList(kuroUidToFetch, { gameId })
          if (typeof rsp_roleList !== 'string') {
            if (rsp_roleList.data.length > 0) {
              for (const role of rsp_roleList.data) {
                if (role.roleId === uid) {
                  kuro_uid = kuroUidToFetch
                  kuroLogger.debug(
                    `找到 uid: ${uid} 所在的库洛 uid: ${kuro_uid}`,
                  )
                  break
                }
              }
            }
          }
          kuroUidToFetch = Object.keys(tokenData)[++kuroUidIndex]
        } while (kuroUidIndex < Object.keys(tokenData).length)
      } else {
        kuroLogger.info(`用户 ${qq} 没有绑定 token, 无法通过 api 遍历找出 uid`)
      }
    }
    try {
      const qqData = { gameUid: uid, inKuroUid: kuro_uid }
      const filePath = dataPath + `/userSetting/${qq}.json`

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

      // 确保 curGameUid 对象存在
      if (!existingData.curGameUid) {
        existingData.curGameUid = {}
      }

      // 将数据存入 curGameUid.gameId 对象
      existingData.curGameUid[gameId] = {
        ...existingData.curGameUid[gameId],
        ...qqData,
      }
      const newJsonData = JSON.stringify(existingData)

      await fs.promises.writeFile(filePath, newJsonData)
      kuroLogger.debug(
        `保存用户 ${qq} 使用的游戏 ${gameId} 的 uid ${uid} 和所在库洛 uid ${kuro_uid} 到文件: ${filePath}, 内容: ${newJsonData}`,
      )
      return true
    } catch (error) {
      kuroLogger.warn(`保存用户设置时出错: ${error.message}`)
      return false
    }
  }

  /**
   * 通过 uid 索引来保存指定 QQ 目前使用的游戏 uid
   * @param {number} uin QQ
   * @param {number} uidIndex uid 索引
   * @param {number} gameId 游戏 id, 战双=2, 鸣潮=3
   * @returns {boolean} 是否成功, 失败一般原因是索引不存在
   */
  async saveCurGameUidByIndex(qq, uidIndex, gameId) {
    kuroLogger.debug(
      `保存用户 ${qq} 使用的游戏 ${gameId} 的 uid 索引 ${uidIndex}...`,
    )
    let tokenData = await getToken(qq)
    let kuroUidIndex = 0
    let kuroUidToFetch = Object.keys(tokenData)[kuroUidIndex]
    let kuroapi = new kuroApi(qq)
    do {
      if (!kuroUidToFetch) {
        kuroLogger.warn(`用户 ${qq} 没有绑定 token, 无法通过 api 遍历找出 uid`)
        break
      }
      let rsp_roleList = await kuroapi.roleList(kuroUidToFetch, { gameId })
      if (typeof rsp_roleList !== 'string') {
        if (rsp_roleList.data.length > 0) {
          for (const role of rsp_roleList.data) {
            if (uidIndex-- === 0) {
              await this.saveCurGameUid(qq, role.roleId, kuroUidToFetch, gameId)
              return true
            }
          }
        }
      }
      kuroUidToFetch = Object.keys(tokenData)[++kuroUidIndex]
    } while (kuroUidIndex < Object.keys(tokenData).length)

    kuroLogger.warn(
      `保存用户 ${qq} 使用的游戏 ${gameId} 的 uid 索引 ${uidIndex} 失败: 未找到 uid`,
    )

    return false
  }

  /**
   * 通过 QQ 和 uid 获取用户提交的鸣潮抽卡记录链接
   * @param {number} qq QQ
   * @param {number} gameUid 鸣潮 uid, 如果传递 0 则返回第一个 uid 的链接
   * @returns {string|null} 抽卡数据链接, 不存在则返回 null
   */
  async getMcGachaDataLink(qq, gameUid) {
    kuroLogger.debug(
      `获取用户 ${qq} 的鸣潮 uid ${gameUid} 提交的鸣潮抽卡记录链接...`,
    )
    let qqData = {}
    try {
      const fileData = await fs.promises.readFile(
        dataPath + `/userSetting/${qq}.json`,
        'utf-8',
      )
      qqData = JSON.parse(fileData)?.mcGachaDataLink || {}
      kuroLogger.debug(
        `获取鸣潮抽卡记录链接: 用户设置文件已读取: ${JSON.stringify(qqData)}`,
      )
      // 如果 gameUid 为 0, 则返回第一个 uid 的链接
      if (gameUid === 0) {
        gameUid = Object.keys(qqData)[0]
      }
      return qqData[gameUid] || null
    } catch (error) {
      kuroLogger.error(`读取用户设置文件时出错: ${error.message}`)
      return null
    }
  }

  /**
   * 保存用户提交的鸣潮抽卡记录链接
   * @param {number} qq QQ
   * @param {number} gameUid 鸣潮 uid
   * @param {string} link 抽卡数据链接
   * @returns {boolean} 是否成功
   */
  async saveMcGachaDataLink(qq, gameUid, link) {
    kuroLogger.debug(
      `保存用户 ${qq} 的鸣潮 uid ${gameUid} 提交的鸣潮抽卡记录链接 ${link} ...`,
    )
    try {
      const filePath = dataPath + `/userSetting/${qq}.json`

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

      // 确保 mcGachaDataLink 对象存在
      if (!existingData.mcGachaDataLink) {
        existingData.mcGachaDataLink = {}
      }

      // 将数据存入 mcGachaDataLink.gameUid 对象
      existingData.mcGachaDataLink[gameUid] = link
      const newJsonData = JSON.stringify(existingData)

      await fs.promises.writeFile(filePath, newJsonData)
      kuroLogger.debug(
        `保存用户 ${qq} 的鸣潮 uid ${gameUid} 提交的抽卡记录链接 ${link} 到文件: ${filePath}, 内容: ${newJsonData}`,
      )
      return true
    } catch (error) {
      kuroLogger.warn(`保存用户设置时出错: ${error.message}`)
      return false
    }
  }

  /**
   * 获取游戏账号体力的最后推送时间
   * @param {number} qq QQ
   * @param {number} gameId 游戏 id, 战双=2, 鸣潮=3
   * @param {number} gameUid 游戏 uid
   * @returns {number} 最后推送时间戳, 不存在数据则返回 0, 出错则返回 -1
   */
  async getEnergyLastPushTime(qq, gameId, gameUid) {
    kuroLogger.debug(
      `获取用户 ${qq} 的游戏 ${gameId} 的 uid ${gameUid} 的体力最后推送时间`,
    )
    let qqData = {}
    try {
      // 如果文件不存在, 创建
      if (!fs.existsSync(dataPath + `/userSetting/${qq}.json`)) {
        kuroLogger.debug(`用户设置文件不存在, 创建并返回 0`)
        await fs.promises.mkdir(dataPath + '/userSetting', { recursive: true })
        await fs.promises.writeFile(dataPath + `/userSetting/${qq}.json`, '{}')
        return 0
      }
      const fileData = await fs.promises.readFile(
        dataPath + `/userSetting/${qq}.json`,
        'utf-8',
      )
      qqData = JSON.parse(fileData)?.energy?.[gameId]?.lastPushTime || 0
      kuroLogger.debug(
        `获取体力最后推送时间: 用户设置文件已读取: ${JSON.stringify(qqData)}`,
      )
      return qqData || 0
    } catch (error) {
      kuroLogger.error(`读取用户设置文件时出错: ${error.message}`)
      return -1
    }
  }

  /**
   * 保存游戏账号体力的最后推送时间
   * @param {number} qq QQ
   * @param {number} gameId 游戏 id, 战双=2, 鸣潮=3
   * @param {number} gameUid 游戏 uid
   * @param {number} lastPushTime 最后推送时间戳
   * @returns {boolean} 是否成功
   */
  async saveEnergyLastPushTime(qq, gameId, gameUid, lastPushTime) {
    kuroLogger.debug(
      `保存用户 ${qq} 的游戏 ${gameId} 的 uid ${gameUid} 的体力最后推送时间 ${lastPushTime}`,
    )
    try {
      const filePath = dataPath + `/userSetting/${qq}.json`

      await fs.promises.mkdir(dataPath + '/userSetting', { recursive: true })

      let existingData = {}
      try {
        const fileData = await fs.promises.readFile(filePath, 'utf-8')
        existingData = JSON.parse(fileData)
      } catch (error) {
        kuroLogger.error(`读取用户设置文件时出错: ${error.message}`)
        return false
      }

      // 确保 energy 对象存在
      if (!existingData.energy) {
        existingData.energy = {}
      }

      // 确保 energy.gameId 对象存在
      if (!existingData.energy[gameId]) {
        existingData.energy[gameId] = {}
      }

      // 将数据存入 energy.gameId.gameUid 对象
      existingData.energy[gameId][gameUid] = { lastPushTime }
      const newJsonData = JSON.stringify(existingData)

      await fs.promises.writeFile(filePath, newJsonData)
      kuroLogger.debug(
        `保存用户 ${qq} 的游戏 ${gameId} 的 uid ${gameUid} 的体力最后推送时间 ${lastPushTime} 到文件: ${filePath}, 内容: ${newJsonData}`,
      )
      return true
    } catch (error) {
      kuroLogger.warn(`保存用户设置时出错: ${error.message}`)
      return false
    }
  }
}
