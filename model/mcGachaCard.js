import kuroLogger from '../components/logger.js'
import {
  mcGachaDataPath,
  pluginName,
  pluginVer,
  resPath,
  _ResPath,
  mcGachaUpPools,
} from '../data/system/pluginConstants.js'
import mcGachaData from './mcGachaData.js'
import userConfig from './userConfig.js'
import kuroApi from './kuroApi.js'

export default class mcGachaCard {
  constructor(e, gachaType) {
    this.e = e
  }

  /** 获取抽卡记录卡片数据
   * @param {object} e - 消息对象
   * @param {number} gachaType - 抽卡类型
   * @param {string} cardPoolName - 卡池名称
   * @returns {object|string} - 抽卡记录卡片数据 json, 失败返回错误信息 str
   */
  static async get(e, gachaType, cardPoolName) {
    if (typeof gachaType !== 'number' || gachaType > 6 || gachaType < 1)
      return '抽卡类型错误'
    let gacha = new mcGachaData(e)
    let user = new userConfig()
    let OriginGachaRecord = await gacha.getUigfRecord(
      e.user_id,
      (
        await user.getCurGameUidLocal(e.user_id, 3)
      )?.gameUid
    )
    if (
      typeof OriginGachaRecord !== 'object' ||
      OriginGachaRecord.length === 0
    ) {
      kuroLogger.warn(`抽卡记录卡片数据获取失败: ${OriginGachaRecord}`)
      await e.reply(`抽卡记录卡片数据获取失败: ${OriginGachaRecord}`)
      return `抽卡记录卡片数据获取失败: ${OriginGachaRecord}`
    }

    // 提取符合 gachaType 的记录, 顺便记录紫卡数量
    let fourStarItemCount = 0
    let gachaRecord = []
    for (let i = 0; i < OriginGachaRecord.list.length; i++) {
      if (OriginGachaRecord.list[i].rank_type == '4') {
        fourStarItemCount++
      }
      if (OriginGachaRecord.list[i].gacha_type == gachaType.toString()) {
        gachaRecord.push(OriginGachaRecord.list[i])
      }
    }
    // 将 gachaRecord 倒序, 以便分析金卡所需抽数
    gachaRecord.reverse()

    // 分析每次出金卡所需抽数
    let goldCardRecord = []
    let lastGoldIndex = -1
    for (let i = 0; i < gachaRecord.length; i++) {
      if (gachaRecord[i].rank_type === '5') {
        goldCardRecord.push({
          id: gachaRecord[i].id,
          gachaType: gachaRecord[i].gacha_type,
          itemId: gachaRecord[i].item_id,
          itemCount: gachaRecord[i].count,
          itemName: gachaRecord[i].name,
          itemType: gachaRecord[i].item_type,
          itemRank: gachaRecord[i].rank_type,
          time: gachaRecord[i].time,
          totalGachaTimes: i + 1,
          thisCardCost: i - lastGoldIndex,
          isUpItem: false,
        })
        lastGoldIndex = i
      }

      if (i === gachaRecord.length - 1 && i !== lastGoldIndex) {
        // 最后一次未出金卡的抽数统计
        goldCardRecord.push({
          id: gachaRecord[i].id,
          gachaType: gachaRecord[i].gacha_type,
          itemId: '-1',
          itemCount: '-1',
          itemName: '?',
          itemType: '-1',
          itemRank: '-1',
          time: gachaRecord[i].time,
          totalGachaTimes: i + 1,
          thisCardCost: i - lastGoldIndex,
          isUpItem: false,
        })
      }
    }

    // 遍历所有五星, 判断是否为 up 物品
    for (let i = 0; i < goldCardRecord.length; i++) {
      if (goldCardRecord[i].itemId === '-1') continue
      for (let j = 0; j < mcGachaUpPools.length; j++) {
        if (
          // 注意时间需要转换为时间戳
          goldCardRecord[i].itemId === mcGachaUpPools[j].itemId &&
          new Date(goldCardRecord[i].time).getTime() >=
            mcGachaUpPools[j].startTime * 1000 &&
          new Date(goldCardRecord[i].time).getTime() <=
            mcGachaUpPools[j].endTime * 1000
        ) {
          goldCardRecord[i].isUpItem = true
          break
        }
      }
    }

    // 再次倒序, 把新的记录放在最前面
    goldCardRecord.reverse()

    kuroLogger.debug('分析后的抽卡记录:', JSON.stringify(goldCardRecord))

    // 生成用户基本信息
    // 计算每张金卡平均抽数
    let everyGoldCost = 0
    let goldCount = 0
    if (goldCardRecord.length !== 0) {
      let hasNoGold = false
      for (let i = 0; i < goldCardRecord.length; i++) {
        if (goldCardRecord[i].itemId == -1) {
          // 排除未出金记录
          hasNoGold = true
          continue
        }
        goldCount++
        everyGoldCost += goldCardRecord[i].thisCardCost
      }
      everyGoldCost =
        Math.floor(
          (everyGoldCost / (goldCardRecord.length - (hasNoGold ? 1 : 0))) * 100
        ) / 100
    }
    // 通过 API 获取用户昵称和头像
    let gameName = '未获取'
    let gameHeadUrl =
      'https://prod-alicdn-community.kurobbs.com/game/mingchaoIcon.png'
    let kuroapi = new kuroApi(e.user_id)
    // 根据用户游戏 uid 获取库洛 id
    let kuro_uid = (await user.getCurGameUidLocal(e.user_id, 3))?.inKuroUid
    kuroLogger.debug(`用户 ${e.user_id} 的库洛 id: ${kuro_uid}`)
    if (kuro_uid !== 0 && (await kuroapi.mineV2(kuro_uid)) !== `token 失效`) {
      // 绑定了 token 且有效
      let rsp_roleList = await kuroapi.roleList(kuro_uid, { gameId: 3 })
      if (typeof rsp_roleList !== 'string' && rsp_roleList?.data?.length > 0) {
        // 遍历 data 成员, 寻找 roleId 对应的 roleName
        for (let i = 0; i < rsp_roleList.data.length; i++) {
          if (rsp_roleList.data[i].roleId === OriginGachaRecord.info.uid) {
            gameName = rsp_roleList.data[i].roleName
            gameHeadUrl = rsp_roleList.data[i].gameHeadUrl
            break
          }
        }
      }
    }
    let userInfo = {
      gameName,
      gameUid: OriginGachaRecord.info.uid,
      gameHeadUrl,
      gacha: {
        count: OriginGachaRecord.list.length,
        goldCount,
        everyGoldCost,
        fourStarItemCount,
      },
    }

    let ret = {
      tplFile: `${resPath}/html/mcGachaRecord/index.html`,
      goldCardRecord,
      userInfo,
      cardPoolName,
      pluResPath: _ResPath,
      pluginName,
      pluginVer,
    }
    if (!ret) {
      await e.reply(`抽卡记录卡片数据获取失败: 未知错误`)
      return '抽卡记录卡片数据获取失败: 未知错误'
    }

    return ret
  }
}
