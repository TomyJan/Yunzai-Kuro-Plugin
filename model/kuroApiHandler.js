import fetch from 'node-fetch'
import kuroLogger from '../components/logger.js'
import { generateFixedString, generateUUID } from './utils.js'

export default class kuroApiHandler {
  constructor() {
    this.kuroApiUrl = 'https://api.kurobbs.com'
    this.kuroEvtApiUrl = 'https://event.kurobbs.com'
    this.mcGachaApiUrl = 'https://gmserver-api.aki-game2.com'
    this.mcGachaApiUrlOS = 'https://gmserver-api.aki-game2.net'
    this.pluginServerUrl = 'https://kuro.amoe.cc'
    this.pnnTownActUrl = 'https://paninitown-api.kurogames-global.com'

    this.kuroBbsVersion = '2.2.1'
    this.kuroBbsVerCode = '2210'
  }

  /**
   * 取库洛接口返回
   * 调用其他接口前请先校验 token 有效性
   * @param {string} ApiName 接口名称
   * @param {string|boolean} kuroUid 库洛 ID, 不需要的接口 传入 114514
   * @param {string} token 库洛 ID 的 token
   * @param {object} data 传入数据
   * @returns {JSON|string} 接口返回的 原始 json 或者报错信息
   */
  async getApiRsp(ApiName, kuroUid, token, data) {
    let tmpParams = this.getParams(ApiName, kuroUid, token, data)
    if (!tmpParams) return '接口不存在'
    let { url, headers, body, method } = tmpParams

    if (!url) return '接口不存在'
    let param = {
      headers: headers,
      body: body,
      method: method,
    }
    // kuroLogger.info('url:    ' + url)
    // kuroLogger.info('header: ' + JSON.stringify(headers))
    // kuroLogger.info('body:   ' + body)
    // kuroLogger.info('method: ' + method)

    let response = {}
    try {
      response = await fetch(url, param)
    } catch (error) {
      kuroLogger.warn('请求出错:', error.message)
      return `请求出错: ${error.message}`
    }
    if (!response.ok) {
      kuroLogger.warn(
        `接口 ${ApiName}报错, 错误: ${response.status} ${response.statusText}`,
      )
      return `请求出错: ${response.status} ${response.statusText}`
    }

    let rsp = await response.json()
    // kuroLogger.debug('rsp:    ', JSON.stringify(rsp))
    return rsp
  }
  /**
   * 取请求需要的参数
   * @param {string} ApiName 接口名称
   * @param {string} kuroUid 库洛 ID
   * @param {string} token 库洛 ID 的 token
   * @param {object} data 传入数据
   * @returns {object} 返回参数
   */
  getParams(ApiName, kuroUid, token, data) {
    let ApiMap = {
      findRoleList: {
        // 取绑定游戏账号列表
        url: `${this.kuroApiUrl}/user/role/findRoleList`,
        body: `gameId=${data.gameId}`,
      },
      roleList: {
        // 取绑定游戏账号列表
        url: `${this.kuroApiUrl}/gamer/role/list`,
        body: `gameId=${data.gameId}`,
      },
      getPnsWidgetData: {
        // 取战双小组件数据
        url: `${this.kuroApiUrl}/gamer/widget/game2/getData`,
        body: `gameId=${data.gameId}&roleId=${data.roleId}&serverId=${data.serverId}&type=${data.type}`,
      },
      getMcWidgetData: {
        // 取鸣潮小组件数据
        url: `${this.kuroApiUrl}/gamer/widget/game3/getData`,
        body: `gameId=${data.gameId}&roleId=${data.roleId}&serverId=${data.serverId}&type=${data.type}&sizeType=${data.sizeType}`,
      },
      initSignInV2: {
        // 取签到配置信息 V2
        url: `${this.kuroApiUrl}/encourage/signIn/initSignInV2`,
        body: `gameId=${data.gameId}&serverId=${data.serverId}&roleId=${data.roleId}&userId=${kuroUid}`,
      },
      gameSignInV2: {
        // 游戏签到 V2
        url: `${this.kuroApiUrl}/encourage/signIn/v2`,
        body: `gameId=${data.gameId}&serverId=${data.serverId}&roleId=${data.roleId}&userId=${kuroUid}&reqMonth=${data.reqMonth}`,
      },
      queryGameSignInRecordV2: {
        // 取游戏签到记录 V2
        url: `${this.kuroApiUrl}/encourage/signIn/queryRecordV2`,
        body: `gameId=${data.gameId}&serverId=${data.serverId}&roleId=${data.roleId}&userId=${kuroUid}`,
      },
      sdkLogin: {
        // APP 端登录
        url: `${this.kuroApiUrl}/user/sdkLogin`,
        body: `code=${data.code}&devCode=${generateFixedString(
          kuroUid,
        )}&gameList=&mobile=${data.mobile}`,
      },
      mineV2: {
        // 取个人信息 V2
        url: `${this.kuroApiUrl}/user/mineV2`,
        body: `otherUserId=${kuroUid}`,
      },
      updateHeadUrl: {
        // 更新头像链接
        url: `${this.kuroApiUrl}/user/updateHeadUrl`,
        body: `headUrl=${data.headUrl}`,
      },
      uploadForumImg: {
        // 上传图片
        url: `${this.kuroApiUrl}/forum/uploadForumImg`,
        body: data.body,
      },
      forumSignIn: {
        // 社区签到
        url: `${this.kuroApiUrl}/user/signIn`,
        body: `gameId=${data.gameId}`,
      },
      forumSignInInfo: {
        // 社区签到信息
        url: `${this.kuroApiUrl}/user/signIn/info`,
        body: `gameId=${data.gameId}`,
      },
      forumList: {
        //取帖子列表
        url: `${this.kuroApiUrl}/forum/list`,
        body: `forumId=${data.forumId}&gameId=${data.gameId}&pageIndex=${data.pageIndex}&pageSize=${data.pageSize}&searchType=${data.searchType}&timeType=${data.timeType}&topicId=${data.topicId}`,
      },
      getPostDetail: {
        //取帖子详情
        url: `${this.kuroApiUrl}/forum/getPostDetail`,
        body: `isOnlyPublisher=${data.isOnlyPublisher}&postId=${data.postId}&showOrderType=${data.showOrderType}`,
      },
      like: {
        //通用论坛点赞
        url: `${this.kuroApiUrl}/forum/like`,
        body: `forumId=${data.forumId}&gameId=${data.gameId}&likeType=${data.likeType}&operateType=${data.operateType}&postCommentId=${data.postCommentId}&postCommentReplyId=${data.postCommentReplyId}&postId=${data.postId}&postType=${data.postType}&toUserId=${data.toUserId}`,
      },
      shareTask: {
        // 社区分享任务
        url: `${this.kuroApiUrl}/encourage/level/shareTask`,
        body: `gameId=${data.gameId}`,
      },
      getTaskProcess: {
        // 取任务进度
        url: `${this.kuroApiUrl}/encourage/level/getTaskProcess`,
        body: `gameId=0&userId=${kuroUid}`,
      },
      getTotalGold: {
        // 取库洛币总数
        url: `${this.kuroApiUrl}/encourage/gold/getTotalGold`,
        body: ``,
      },
      getBindRoleInfo: {
        // 取活动绑定游戏角色信息
        url: `${this.kuroApiUrl}/activity/gamer/role/getBindRoleInfo`,
        body: `userId=${kuroUid}`,
      },
      getActivityTaskList: {
        // 取活动任务详情
        url: `${this.kuroApiUrl}/activity/task/getList`,
        body: `userId=${kuroUid}`,
      },
      completeActivityTask: {
        // 完成活动任务
        url: `${this.kuroApiUrl}/activity/task/complete`,
        body: `userId=${kuroUid}&taskId=${data.taskId}&gameId=${data.gameId}`,
      },
      receiveActivityTask: {
        // 领取活动任务奖励
        url: `${this.kuroApiUrl}/activity/task/receive`,
        body: `userId=${kuroUid}&taskId=${data.taskId}&gameId=${data.gameId}`,
      },
      activityBindRole: {
        // 活动绑定游戏角色
        url: `${this.kuroApiUrl}/activity/gamer/role/bindRole`,
        body: `gameId=${data.gameId}&roleId=${data.roleId}&serverId=${data.serverId}&userId=${kuroUid}`,
      },
      getActivityLotteryRemain: {
        // 取活动奖券数量
        url: `${this.kuroApiUrl}/activity/lottery/getRemain`,
        body: ``,
      },
      doActivityLottery: {
        // 执行活动抽奖
        url: `${this.kuroApiUrl}/activity/lottery/start`,
        body: `userId=${kuroUid}&gameId=${data.gameId}`,
      },
      followUser: {
        // 关注用户
        url: `${this.kuroApiUrl}/user/followUser`,
        body: `followUserId=${data.followUserId}&operateType=${data.operateType}`,
      },
      mcGachaRecord: {
        // 鸣潮抽卡记录
        url: `${
          data.serverId === '76402e5b20be2c39f095a152090afddc'
            ? this.mcGachaApiUrl
            : this.mcGachaApiUrlOS
        }/gacha/record/query`,
        // 这个的body是json
        body: JSON.stringify({
          cardPoolId: data.cardPoolId,
          cardPoolType: data.cardPoolType,
          languageCode: 'zh-Hans', // 暂时固定简中
          playerId: data.playerId,
          recordId: data.recordId,
          serverId: data.serverId,
        }),
      },
      getPluginServerKuroBbsLoginAuth: {
        // 从插件服务器取库洛登录 token
        url: `${this.pluginServerUrl}/api/kuroBbs/token/generateToken`,
        body: JSON.stringify({ version: 1 }),
      },
      getPluginServerKuroBbsLoginToken: {
        // 从插件服务器取库洛登录状态
        url: `${this.pluginServerUrl}/api/kuroBbs/token/get`,
        body: JSON.stringify({ version: 1, token: data.token }),
      },
      pnnTownActSendCode: {
        // 帕尼尼小镇发送验证码
        url: `${this.pnnTownActUrl}/mobile/send`,
        body: `mobile=${data.mobile}`,
      },
      pnnTownActLogin: {
        // 帕尼尼小镇登录
        url: `${this.pnnTownActUrl}/mobile/login`,
        body: `mobile=${data.mobile}&code=${data.code}`,
      },
      pnnTownActUserInfo: {
        // 帕尼尼小镇取用户信息
        url: `${this.pnnTownActUrl}/user/getInfo`,
        body: ``,
        header: { token: data.token },
      },
      pnnTownActCollectEgg: {
        // 帕尼尼小镇收集蛋
        url: `${this.pnnTownActUrl}/egg/collect`,
        body: `egg_id=${data.id}`,
        header: { token: data.token },
      },
      pnnTownActDraw: {
        // 帕尼尼小镇抽奖
        url: `${this.pnnTownActUrl}/draw/get`,
        query: `type=${data.type}`,
        header: { token: data.token },
      },
      pnnTownActShare: {
        // 帕尼尼小镇分享任务
        url: `${this.pnnTownActUrl}/egg/share`,
        body: ``,
        header: { token: data.token },
      },
      pnnTownActPrize: {
        // 帕尼尼小镇取奖品
        url: `${this.pnnTownActUrl}/draw/prize`,
        body: ``,
        header: { token: data.token },
      },
    }
    if (!ApiMap[ApiName]) return false
    let {
      url,
      header = {},
      query = '', // GET 请求参数
      body = '',
      method = 'POST',
    } = ApiMap[ApiName]
    if (query) url += `?${query}`
    let headers = this.getHeaders(ApiName, token, kuroUid)
    if (header) headers = { ...headers, ...header }
    return {
      url,
      headers,
      body,
      method,
    }
  }
  /**
   * 取请求头
   * @param {string} ApiName 接口名称
   * @param {string} token 库洛 ID 的 token
   * @param {string} kuroUid 库洛 ID, 用于生成独有请求头
   * @returns {object} 返回参数
   */
  getHeaders(ApiName, token, kuroUid) {
    if (
      [
        'getPnsWidgetData',
        'getMcWidgetData',
        'initSignInV2',
        'gameSignInV2',
        'queryGameSignInRecordV2',
        'getBindRoleInfo',
        'getActivityTaskList',
        'completeActivityTask',
        'receiveActivityTask',
        'activityBindRole',
        'getActivityLotteryRemain',
        'doActivityLottery',
        'pnnTownActSendCode',
        'pnnTownActLogin',
        'pnnTownActUserInfo',
        'pnnTownActCollectEgg',
        'pnnTownActDraw',
        'pnnTownActShare',
        'pnnTownActPrize',
      ].includes(ApiName)
    ) {
      // 这些 API 请求头是浏览器的
      let headers = {
        pragma: 'no-cache',
        'cache-control': 'no-cache',
        'sec-ch-ua': `"Not)A;Brand";v="99", "Android WebView";v="12${kuroUid.substring(
          kuroUid.length - 1,
        )}", "Chromium";v="12${kuroUid.substring(kuroUid.length - 1)}"`,
        source: 'android',
        'sec-ch-ua-mobile': '?1',
        'user-agent': `Mozilla/5.0 (Linux; Android 14; 23127PN0CC Build/UKQ1.230804.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/12${kuroUid.substring(
          kuroUid.length - 1,
        )}.0.${kuroUid.substring(kuroUid.length - 4)}.${kuroUid.substring(
          kuroUid.length - 2,
        )} Mobile Safari/537.36 Kuro/${this.kuroBbsVersion} KuroGameBox/${
          this.kuroBbsVersion
        }`,
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json, text/plain, */*',
        devcode: generateFixedString(kuroUid),
        token: token,
        'sec-ch-ua-platform': '"Android"',
        origin: 'https://web-static.kurobbs.com',
        'sec-fetch-site': 'same-site',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        priority: 'u=1, i',
      }
      return headers
    }

    let headers = {
      // 共同请求头
      devCode: generateFixedString(kuroUid),
      ip: `192.168.1.1${kuroUid.substring(kuroUid.length - 2)}`,
      source: 'android',
      version: this.kuroBbsVersion,
      versionCode: this.kuroBbsVerCode,
      osVersion: 'Android',
      countryCode: 'CN',
      model: '23127PN0CC',
      lang: 'zh-Hans',
      channelId: '2',
      'Content-Type': 'application/x-www-form-urlencoded',
      'accept-encoding': 'gzip',
      'User-Agent': 'okhttp/3.11.0',
    }
    if (ApiName !== 'sdkLogin') {
      // 除了 login 再都要 token
      headers = {
        ...headers,
        token: token,
        Cookie: `user_token=${token}`,
      }
    }
    if (!['forumList', 'findRoleList', 'roleList'].includes(ApiName)) {
      // 除了上面几个其他都有 distinct_id
      headers = {
        ...headers,
        distinct_id: generateUUID(kuroUid),
      }
    }

    // 处理 Content-Type
    if (['findRoleList', 'roleList'].includes(ApiName)) {
      // findRoleList roleList 多了个 utf8
      headers = {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      }
    } else if (
      [
        'mcGachaRecord',
        'getPluginServerKuroBbsLoginAuth',
        'getPluginServerKuroBbsLoginToken',
      ].includes(ApiName)
    ) {
      headers = {
        ...headers,
        'Content-Type': 'application/json',
      }
    } else if (ApiName !== 'uploadForumImg') {
      // 普通请求为 application/x-www-form-urlencoded, uploadForumImg 为 multipart/form-data, 这里不用手动添加, 让那边的 form-data 自己处理
      headers = {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    }

    return headers
  }
}
