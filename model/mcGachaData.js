import kuroLogger from '../components/logger.js'
import { getToken } from './kuroBBSTokenHandler.js'
import { getRandomInt, sleepAsync } from './utils.js'
import kuroApi from './kuroApi.js'
import userConfig from './userConfig.js'
import {
  mcGachaDataPath,
  _McGachaDataPath,
  pluginName,
  pluginVer,
  mcGachaType,
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
        `QQ ${this.e.user_id}${
          gameUid ? ` 的游戏 uid ${gameUid}` : ''
        } 暂未获取过抽卡记录\n请发送 #鸣潮抽卡记录帮助 以获取帮助信息`
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
          `QQ ${this.e.user_id} 的游戏 uid ${gameUid} 更新抽卡记录失败: \n${failedReason} \n将展示历史抽卡记录 `
        )
      } else {
        // 更新成功, 存入本地
        let gachaUpdateRet = await this.update(this.e.user_id, gachaRecord)
        if (typeof gachaUpdateRet === 'string') {
          await this.e.reply(
            `QQ ${this.e.user_id} 的游戏 uid ${gameUid} 抽卡更新记录成功但保存失败: \n${gachaUpdateRet} \n将展示历史抽卡记录 `
          )
        } // 更新且保存成功, 无需提示
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
      //   `QQ ${this.e.user_id} 暂未绑定 token, 将无法获取到部分额外信息, 建议发送 #库洛在线登录 绑定 token`
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
      ) &&
      !link.startsWith(
        'https://aki-gm-resources-oversea.aki-game.net/aki/gacha/index.html#/record?'
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
    await user.saveMcGachaDataLink(qq, playerId, link)
    await user.saveCurGameUid(qq, playerId, 0, 3)

    // 接下来正式开始获取抽卡记录
    let gachaDataJson = {
      gachaData: {},
      playerId,
      version: 1, // 版本控制, 防止不兼容
    }
    // cardPoolType 1-7 获取记录存入 gachaDataJson
    for (
      let curCardPoolToFetch = 1;
      curCardPoolToFetch <= 7;
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
  /** 将 通过 get() 方法获取得到的抽卡记录以 WWGF 保存到本地
   * @param {number} qq QQ
   * @param {object} gachaDataJson 抽卡记录原始 json {"gachaData": {"1":{}, "2": {}}, "playerId": 101812955, "version": 1} , 1-7键值为七个卡池的原始记录
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
      return `抽卡记录版本 ${gachaDataJson?.version} 暂不兼容`
    }
    // 检查 gachaDataJson 是否有 1-7 键名
    for (let i = 1; i <= 7; i++) {
      if (!gachaDataJson?.gachaData[i]) {
        kuroLogger.debug(`QQ ${qq} 的抽卡记录不完整`)
        return '抽卡记录不完整'
      }
    }

    // 开始以 WWGF 格式构造抽卡记录对象
    let gachaDataInUniform = {
      info: {
        uid: gachaDataJson.playerId.toString(),
        lang: 'zh-cn', // 暂时固定简中
        export_timestamp: Math.floor(new Date().getTime() / 1000),
        export_app: pluginName.toString(),
        export_app_version: 'v' + pluginVer,
        wwgf_version: 'v0.1b',
        region_time_zone: Number(8),
      },
      list: [],
    }
    kuroLogger.debug(
      `准备转换 QQ ${qq} 的抽卡记录到 WWGF 格式: ${JSON.stringify(
        gachaDataInUniform
      )}`
    )

    for (let i = 1; i <= 7; i++) {
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
          Math.floor(Date.parse(data.time) / 1000) +
          i.toString().padStart(4, '0') +
          (timeCount[data.time]--).toString().padStart(5, '0')

        kuroLogger.debug(
          `QQ ${qq} 的抽卡记录 ${i} 在时间 ${
            data.time
          } 下的物品 ${JSON.stringify(data)} 是第 ${
            timeCount[data.time] + 1
          } 个, 其 id 为 ${id}`
        )

        let item = {
          gacha_id: i.toString().padStart(4, '0'),
          gacha_type: mcGachaType[i].toString(),
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

    // 保存到本地 TODO: 目前 API 返回的是完整记录, 后续分割记录后应该是增量更新
    kuroLogger.debug(
      `QQ ${qq} 的 WWGF 抽卡记录转换完成: ${JSON.stringify(gachaDataInUniform)}`
    )
    let path = `${mcGachaDataPath}/${qq}-${gachaDataJson.playerId}.json`
    // 使用错误捕获
    try {
      fs.writeFileSync(path, JSON.stringify(gachaDataInUniform, null, 2))
      kuroLogger.debug(`QQ ${qq} 的抽卡记录保存成功: ${path}`)
      // return null
      // 统计每种卡池获取到的数量, 构造json返回, gachatype替换为可读的卡池类型
      let gachaCount = {}
      for (let i = 0; i < gachaDataInUniform.list.length; i++) {
        let item = gachaDataInUniform.list[i]
        let gachaName = ''
        switch (item.gacha_id.replace(/^0+/, '')) {
          case '1':
            gachaName = '角色活动'
            break
          case '2':
            gachaName = '武器活动'
            break
          case '3':
            gachaName = '角色常驻'
            break
          case '4':
            gachaName = '武器常驻'
            break
          case '5':
            gachaName = '新手'
            break
          case '6':
            gachaName = '新手自选'
            break
          case '7':
            gachaName = '自选五星'
            break
          default:
            gachaName = `未知(${item.gacha_id.replace(/^0+/, '')})`
        }
        if (!gachaCount[gachaName]) {
          gachaCount[gachaName] = 0
        }
        gachaCount[gachaName]++
      }
      if (Object.keys(gachaCount).length === 0) {
        return '抽卡记录为空'
      }
      return gachaCount
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
   * @returns {object|string} 成功则返回原始 WWGF 格式的抽卡记录, 失败则返回 str 原因
   */
  async getWwgfRecord(qq, gameUid) {
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

  /** 以 WWGF 格式发送抽卡记录
   * @returns {null|string} 保存成功返回 null, 失败返回 str 原因
   */
  async export() {
    // 检查用户是否有抽卡记录
    let user = new userConfig()
    let gameUid = (await user.getCurGameUidLocal(this.e.user_id, 3))?.gameUid
    if (!gameUid) {
      return `QQ ${this.e.user_id}${
        gameUid ? ` 的游戏 uid ${gameUid}` : ''
      } 暂未获取过抽卡记录\n请发送 #鸣潮抽卡记录帮助 以获取帮助信息`
    }
    let path = `${mcGachaDataPath}/${this.e.user_id}-${gameUid}.json`
    if (!fs.existsSync(path)) {
      return `QQ ${this.e.user_id} 的游戏 uid ${gameUid} 本地不存在抽卡记录\n请发送 #鸣潮更新抽卡 以获取`
    }
    // 复制一份抽卡记录到临时文件
    let time = new Date()
      .toLocaleString()
      .replace(/ /g, '')
      .replace(/\//g, '')
      .replace(/:/g, '')
      .replace(/,/g, '')
      .replace(/-/g, '')
    let tempPath = `${_McGachaDataPath}/WW_Gacha_Export-${gameUid}-${time}.json`
    try {
      fs.copyFileSync(path, tempPath)
      if (this.e.isGroup) {
        let ret = await this.e.group.sendFile(tempPath)
        kuroLogger.debug(
          `QQ ${this.e.user_id} 的抽卡记录文件发送返回: ${JSON.stringify(ret)}`
        )
        fs.unlinkSync(tempPath)
        if (ret !== null && typeof ret !== 'object') {
          kuroLogger.warn(
            `QQ ${this.e.user_id} 的抽卡记录文件发送失败: ${JSON.stringify(
              ret
            )}`
          )
          return `文件发送失败, 可能是协议不支持`
        }
        return null
      } else if (this.e.isPrivate) {
        let ret = await this.e.friend.sendFile(tempPath)
        kuroLogger.debug(
          `QQ ${this.e.user_id} 的抽卡记录文件发送返回: ${JSON.stringify(ret)}`
        )
        fs.unlinkSync(tempPath)
        if (ret !== null && typeof ret !== 'object') {
          kuroLogger.warn(
            `QQ ${this.e.user_id} 的抽卡记录文件发送失败: ${JSON.stringify(
              ret
            )}`
          )
          return `文件发送失败, 可能是协议不支持`
        }
        return null
      } else {
        return `不支持的消息来源, 请尝试好友私聊或群聊使用`
      }
    } catch (error) {
      return `抽卡记录文件复制失败: ${JSON.stringify(error)}`
    }
  }
}
