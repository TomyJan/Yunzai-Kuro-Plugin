import kuroLogger from '../components/logger.js'
import {
  mcGachaDataPath,
  pluginName,
  pluginVer,
  resPath,
  _ResPath,
} from '../data/system/pluginConstants.js'
import mcGachaData from './mcGachaData.js'
import userConfig from './userConfig.js'

export default class mcGachaCard {
  constructor(e, gachaType) {
    this.e = e
  }

  /** 获取抽卡记录卡片数据
   * @param {object} e - 消息对象
   * @param {number} gachaType - 抽卡类型
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

    // 提取符合 gachaType 的记录
    let gachaRecord = []
    for (let i = 0; i < OriginGachaRecord.list.length; i++) {
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
        })
      }
    }

    // 再次倒序, 把新的记录放在最前面
    goldCardRecord.reverse()

    kuroLogger.debug('分析后的抽卡记录:', JSON.stringify(goldCardRecord))

    // return JSON.stringify(goldCardRecord)

    let ret = {
      tplFile: `${resPath}/html/mcGachaRecord/index.html`,
      goldCardRecord,
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
