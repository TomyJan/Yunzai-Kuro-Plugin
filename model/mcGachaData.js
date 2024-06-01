import kuroLogger from '../components/logger.js'
import { getToken } from './kuroBBSTokenHandler.js'
import { getRandomInt, sleepAsync } from './utils.js'
import kuroApi from './kuroApi.js'
import userConfig from './userConfig.js'
import {
  mcGachaDataPath,
  pluginName,
  pluginVer,
} from '../data/system/pluginConstants.js'
import fs from 'fs'

export default class mcGachaData {
  constructor(e) {
    this.e = e
    // 创建 mcGachaDataPath
    // 抽卡记录文件在 mcGachaDataPath/QQ-gameUid.json
    if (!fs.existsSync(mcGachaDataPath)) {
      fs.mkdirSync(mcGachaDataPath, { recursive: true })
    }
  }

/** 检查是否可以生成抽卡记录
 * @returns {boolean} 是否通过检查, 没通过检查就不生成了
 */
  async check() {
    const tokenData = await getToken(this.e.user_id)
    kuroLogger.debug(
      `QQ ${this.e.user_id} 的 tokenData: ${JSON.stringify(tokenData)}`
    )

    // 尝试获取用户的绑定信息和抽卡链接
    let user = new userConfig()
    let gameId = 3
    let gameUid = (await user.getCurGameUidLocal(this.e.user_id, gameId))
      ?.gameUid
    let gachaLink = await user.getMcGachaDataLink(this.e.user_id, gameUid)
    kuroLogger.debug(
      `QQ ${this.e.user_id} 的游戏 uid: ${gameUid}, 抽卡链接: ${gachaLink}`
    )

    // 先检查本地是否既没有抽卡记录也没有抽卡链接, 如果没有就提示获取抽卡记录
    if (!(await this.exist(this.e.user_id, gameUid)) && !gachaLink) {
      await this.e.reply(
        `QQ ${this.e.user_id} 的游戏 uid ${gameUid} 暂未获取抽卡记录\n请发送 #鸣潮抽卡记录帮助 以获取记录`
      )
      return false
    }

    // 然后检查是否是通过链接上传的信息, 如果是链接上传就更新再生成, 如果是本地上传就直接生成
    if (gachaLink) {
      await this.e.reply(
        `QQ ${this.e.user_id} 的游戏 uid ${gameUid} 本地存在抽卡链接, 尝试更新抽卡记录...`
      )
      let gachaRecord = await this.get(gachaLink, this.e.user_id)
      if (typeof gachaRecord === 'string') {
        // 如果记录更新失败, 进行提示; 如果更新成功, 不提示直接进入生成
        await this.e.reply(
          `QQ ${this.e.user_id} 的游戏 uid ${gameUid} 更新抽卡记录失败: \n${failedReason}\n将展示历史抽卡记录`
        )
      } else {
        // 更新成功, 存入本地
        await this.update(this.e.user_id, gachaRecord)
      }
    } else {
      await this.e.reply(
        `QQ ${this.e.user_id} 的游戏 uid ${gameUid} 通过本地上传的抽卡记录, 将展示历史抽卡记录`
      )
    }

    if (tokenData && Object.keys(tokenData).length > 0) {
      // TODO: 以后可能可以通过 token 获取到 抽卡记录, 先放着吧
    } else {
      // 没绑定当然也能获取 ,但是警告一下获取不到部分信息
      // TODO: 把这个放到绑定抽卡链接的提示吧
      // await this.e.reply(
      //   `QQ ${this.e.user_id} 暂未绑定 token, 将无法获取到部分额外信息, 建议发送 #库洛验证码登录 绑定 token`
      // )
    }

    return true
  }

  /** 通过抽卡链接获取抽卡记录
   * @param {string} link 抽卡链接
   * @param {number} qq QQ
   * @returns {object|string} 获取成功返回 json {"1":{}, "2": {}}, 失败返回 str 原因
   */
  async get(link, qq) {
    kuroLogger.debug(`尝试获取 QQ ${qq} 的抽卡记录, 通过链接 ${link} ...`)
    // 抽卡链接形式 https://aki-gm-resources.aki-game.com/aki/gacha/index.html#/record?svr_id=TomyJan&player_id=101812955&lang=zh-Hans&gacha_id=1&gacha_type=1&svr_area=cn&record_id=TomyJan&resources_id=TomyJan
    // POST 请求 URL https://gmserver-api.aki-game2.com/gacha/record/query
    // POST 请求 body {"playerId":"101812955","cardPoolId":"TomyJan","cardPoolType":1,"serverId":"TomyJan","languageCode":"zh-Hans","recordId":"TomyJan"}
    // POST 请求 响应体
    // {
    //     "code": 0,
    //     "message": "success",
    //     "data": [
    //         {
    //             "cardPoolType": "角色精准调谐",
    //             "resourceId": 1404,
    //             "qualityLevel": 5,
    //             "resourceType": "角色",
    //             "name": "忌炎",
    //             "count": 1,
    //             "time": "2024-05-24 15:23:33"
    //         }
    //     ]
    // }
    // cardPoolType: 角色活动唤取=1, 武器活动唤取=2, 角色常驻唤取=3, 武器常驻唤取=4, 新手唤取=5, 新手自选唤取=6, 新手自选唤取（感恩定向唤取）=7
    // 其中 cardPoolType 为 6 和 7 时返回的 cardPoolType 为数字
    // 参数对应: resources_id = cardPoolId, record_id = recordId, gacha_type = cardPoolType, lang = languageCode(统一用 zh-Hans), svr_id = serverId, player_id = playerId

    // 检查链接及参数
    if (
      !link.startsWith(
        'https://aki-gm-resources.aki-game.com/aki/gacha/index.html#/record?'
      )
    ) {
      kuroLogger.debug(`QQ ${qq} 的抽卡链接 ${link} 格式错误`)
      return '抽卡链接格式错误'
    }
    let serverId = link.match(/svr_id=([^&]*)/)[1]
    let playerId = link.match(/player_id=([^&]*)/)[1]
    let recordId = link.match(/record_id=([^&]*)/)[1]
    let cardPoolId = link.match(/resources_id=([^&]*)/)[1]
    if (!serverId || !playerId || !recordId || !cardPoolId) {
      kuroLogger.debug(
        `QQ ${qq} 的抽卡链接 ${link} 参数缺失, serverId: ${serverId}, playerId: ${playerId}, recordId: ${recordId}, cardPoolId: ${cardPoolId}`
      )
      return '抽卡链接参数缺失'
    }
    if (
      !serverId.match(/^[a-z0-9]{32}$/) ||
      !playerId.match(/^\d{9}$/) ||
      !recordId.match(/^[a-z0-9]{32}$/) ||
      !cardPoolId.match(/^[a-z0-9]{32}$/)
    ) {
      kuroLogger.debug(
        `QQ ${qq} 的抽卡链接 ${link} 参数格式错误, serverId: ${serverId}, playerId: ${playerId}, recordId: ${recordId}, cardPoolId: ${cardPoolId}`
      )
      return '抽卡链接参数格式错误'
    }

    // 发送请求
    let kuroapi = new kuroApi(qq)
    let rsp_mcGachaRecord = await kuroapi.mcGachaRecord(0, {
      cardPoolId,
      cardPoolType: 7,
      playerId,
      recordId,
      serverId,
    })
    if (typeof rsp_mcGachaRecord === 'string') {
      kuroLogger.debug(
        `QQ ${qq} 的抽卡链接 ${link} 获取失败: ${rsp_mcGachaRecord}`
      )
      return `获取失败: ${rsp_mcGachaRecord}`
    }

    // 完成测试, 保存记录到本地
    let user = new userConfig()
    kuroLogger.debug(
      `QQ ${qq} 的抽卡链接 ${link} 获取成功, 保存链接及游戏 uid...`
    )
    user.saveMcGachaDataLink(qq, playerId, link)
    user.saveCurGameUid(qq, playerId, 0, 3)

    // 接下来正式开始获取抽卡记录
    let gachaDataJson = {
      gachaData: {},
      playerId,
      version: 1, // 版本控制, 防止不兼容
    }
    // cardPoolType 1-6 获取数据存入 gachaDataJson
    for (
      let curCardPoolToFetch = 1;
      curCardPoolToFetch <= 6;
      curCardPoolToFetch++
    ) {
      let rsp_mcGachaRecord = await kuroapi.mcGachaRecord(0, {
        cardPoolId,
        cardPoolType: curCardPoolToFetch,
        playerId,
        recordId,
        serverId,
      })
      if (typeof rsp_mcGachaRecord === 'string')
        // 失败重试一次
        rsp_mcGachaRecord = await kuroapi.mcGachaRecord(0, {
          cardPoolId,
          cardPoolType: curCardPoolToFetch,
          playerId,
          recordId,
          serverId,
        })
      if (typeof rsp_mcGachaRecord === 'string')
        rsp_mcGachaRecord = { code: -1, message: rsp_mcGachaRecord, data: [] }
      kuroLogger.debug(
        `QQ ${qq} 的抽卡链接 ${link} 获取卡池 ${curCardPoolToFetch} 的抽卡记录结果: ${JSON.stringify(
          rsp_mcGachaRecord
        )}`
      )
      gachaDataJson.gachaData[curCardPoolToFetch] = rsp_mcGachaRecord
    }

    kuroLogger.debug(
      `QQ ${qq} 的抽卡链接 ${link} 获取抽卡记录完成: ${JSON.stringify(
        gachaDataJson
      )}`
    )
    return gachaDataJson
  }
  /** 通过 get() 方法或者用户本地获取得到的抽卡记录保存到本地
   * @param {number} qq QQ
   * @param {object} gachaDataJson 抽卡记录原始 json {"gachaData": {"1":{}, "2": {}}, "playerId": 101812955, "version": 1}
   * @returns {null|string} 保存成功返回 null, 失败返回 str 原因
   */
  async update(qq, gachaDataJson) {
    kuroLogger.debug(
      `尝试保存 QQ ${qq} 的抽卡记录 ${JSON.stringify(gachaDataJson)} 到本地...`
    )
    // 检查 gachaDataJson 版本是否兼容
    if (!gachaDataJson.version || gachaDataJson.version !== 1) {
      kuroLogger.debug(
        `QQ ${qq} 的抽卡记录版本 ${gachaDataJson?.version} 不兼容: ${gachaDataJson.version}`
      )
      return '抽卡记录版本不兼容'
    }
    // 检查 gachaDataJson 是否有 1-6 键名
    for (let i = 1; i <= 6; i++) {
      if (!gachaDataJson?.gachaData[i]) {
        kuroLogger.debug(`QQ ${qq} 的抽卡记录不完整`)
        return '抽卡记录不完整'
      }
    }

    // 开始以 UIGF 格式构造抽卡记录对象
    let gachaDataInUniform = {
      info: {
        uid: gachaDataJson.playerId.toString(),
        lang: 'zh-cn', // 暂时固定简中
        export_timestamp: Math.floor(new Date().getTime() / 1000),
        export_time: new Date().toLocaleString().replace(/\//g, '-').toString(),
        export_app: pluginName.toString(),
        export_app_version: 'v' + pluginVer,
        uigf_version: 'v3.0',
        region_time_zone: Number(8),
      },
      list: [],
    }
    kuroLogger.debug(
      `准备转换 QQ ${qq} 的抽卡记录到 UIGF 格式: ${JSON.stringify(
        gachaDataInUniform
      )}`
    )

    for (let i = 1; i <= 6; i++) {
      let gachaData = gachaDataJson.gachaData[i].data
      let timeCount = {}
      // 先统计每个 time 的物品数量
      for (let j = 0; j < gachaData.length; j++) {
        let data = gachaData[j]
        if (!timeCount[data.time]) {
          timeCount[data.time] = 0
        }
        timeCount[data.time] += 1
      }

      for (let j = 0; j < gachaData.length; j++) {
        let data = gachaData[j]

        let id =
          Date.parse(data.time) +
          i.toString() +
          (timeCount[data.time]--).toString().padStart(2, '0')

        kuroLogger.debug(
          `QQ ${qq} 的抽卡记录 ${i} 在时间 ${
            data.time
          } 下的物品 ${JSON.stringify(data)} 是第 ${
            timeCount[data.time] + 1
          } 个, 其 id 为 ${id}`
        )

        let item = {
          uigf_gacha_type: i.toString(),
          gacha_type: i.toString(),
          item_id: data.resourceId.toString(),
          count: data.count.toString(),
          time: data.time.toString(),
          name: data.name.toString(),
          item_type: data.resourceType.toString(),
          rank_type: data.qualityLevel.toString(),
          id,
        }
        gachaDataInUniform.list.push(item)
      }
    }

    // 保存到本地 TODO: 目前 API 返回的是完整数据, 后续分割数据后应该是增量更新
    kuroLogger.debug(
      `QQ ${qq} 的 UIGF 抽卡记录转换完成: ${JSON.stringify(gachaDataInUniform)}`
    )
    let path = `${mcGachaDataPath}/${qq}-${gachaDataJson.playerId}.json`
    // 使用错误捕获
    try {
      fs.writeFileSync(path, JSON.stringify(gachaDataInUniform, null, 2))
      kuroLogger.debug(`QQ ${qq} 的抽卡记录保存成功: ${path}`)
      return null
    } catch (error) {
      kuroLogger.warn(`QQ ${qq} 的抽卡记录保存失败: ${error.message}`)
      return error.message
    }
  }

  /** 通过 QQ 和游戏 uid 检查本地是否存在抽卡记录
   * @param {number} qq QQ
   * @param {number} gameUid 游戏 uid, 如果传入 0 则检查并返回第一个 uid
   * @returns {string|null} 存在返回游戏 uid, 不存在返回 null
   */
  async exist(qq, gameUid) {
    if (gameUid !== 0) {
      let path = `${mcGachaDataPath}/${qq}-${gameUid}.json`
      if (fs.existsSync(path)) {
        return gameUid
      } else {
        return null
      }
    } else {
      let files = fs.readdirSync(mcGachaDataPath)
      for (let i = 0; i < files.length; i++) {
        let file = files[i]
        if (file.startsWith(`${qq}-`) && file.endsWith('.json')) {
          return file.split('-')[1].split('.')[0]
        }
      }
      return null
    }
  }

/** 以原格式输出抽卡记录
 * @param {number} qq QQ
 * @param {number} gameUid 游戏 uid, 如果传入 0 则输出第一个 uid
 * @returns {object|string} 成功则返回原始 UIGF 格式的抽卡记录, 失败则返回 str 原因
 */
  async getUigfRecord(qq, gameUid) {
    // gameUid 无效时获取第一个 uid
    if (!gameUid) {
      gameUid = this.exist(qq, 0)
      if (!gameUid) {
        return '未找到抽卡记录'
      }
    }
    let path = `${mcGachaDataPath}/${qq}-${gameUid}.json`
    if (!fs.existsSync(path)) {
      return '未找到抽卡记录'
    }
    // 使用 try catch 捕获错误
    try {
      let data = fs.readFileSync(path)
      return JSON.parse(data)
    } catch (error) {
      return '提取抽卡记录失败: ' + error.message
    }
  }
}
