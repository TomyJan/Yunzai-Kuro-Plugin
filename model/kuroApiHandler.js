import fetch from 'node-fetch'
import kuroLogger from '../components/logger.js'

export default class kuroApiHandler {
  constructor() {
    this.kuroApiUrl = 'https://api.kurobbs.com'
    this.mcGachaApiUrl = 'https://gmserver-api.aki-game2.com'
  }

  /**
   * 取库洛接口返回
   * 调用其他接口前请先校验 token 有效性
   * @param {string} ApiName 接口名称
   * @param {string|boolean} kuroUid 库洛 ID, sdkLogin 时传入 false
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
      return `请求出错: ${error.message}\n`
    }
    if (!response.ok) {
      kuroLogger.warn(
        `接口 ${ApiName}报错, 错误: ${response.status} ${response.statusText}`
      )
      return `请求出错: ${response.status} ${response.statusText}\n`
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
      initSignInV2: {
        // 取签到配置信息
        url: `${this.kuroApiUrl}/encourage/signIn/initSignInV2`,
        body: `gameId=${data.gameId}&serverId=${data.serverId}&roleId=${data.roleId}&userId=${kuroUid}`,
      },
      gameSignInV2: {
        // 游戏签到
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
        body: `code=${data.code}&devCode=2fba3859fe9bfe9099f2696b8648c2c6&gameList=&mobile=${data.mobile}`,
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
        url: `${this.mcGachaApiUrl}/gacha/record/query`,
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
    }
    if (!ApiMap[ApiName]) return false
    let {
      url,
      query = '', // GET 请求参数
      body = '',
      method = 'POST',
    } = ApiMap[ApiName]
    if (query) url += `?${query}`
    let headers = this.getHeaders(ApiName, token)
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
   * @returns {object} 返回参数
   */
  getHeaders(ApiName, token) {
    if (
      [
        'initSignIn',
        'gameSignIn',
        'queryGameSignInRecord',
        'getBindRoleInfo',
        'getActivityTaskList',
        'completeActivityTask',
        'receiveActivityTask',
        'activityBindRole',
        'getActivityLotteryRemain',
        'doActivityLottery',
      ].includes(ApiName)
    ) {
      // 这些 API 请求头是浏览器的
      let headers = {
        pragma: 'no-cache',
        'cache-control': 'no-cache',
        accept: 'application/json, text/plain, */*',
        source: 'android',
        'user-agent':
          'Mozilla/5.0 (Linux; Android 13; 2211133C Build/TKQ1.220905.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.131 Mobile Safari/537.36 Kuro/1.0.9 KuroGameBox/1.0.9',
        token: token,
        'content-type': 'application/x-www-form-urlencoded',
        origin: 'https://web-static.kurobbs.com',
        'x-requested-with': 'com.kurogame.kjq',
        'sec-fetch-site': 'same-site',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      }
      return headers
    }

    let headers = {
      // 共同请求头
      osversion: 'Android',
      devcode: '2fba3859fe9bfe9099f2696b8648c2c6', // 注意 sdkLogin 请求体里有个一样的要一起更新
      countrycode: 'CN',
      ip: '10.0.2.233',
      model: '2211133C',
      source: 'android',
      lang: 'zh-Hans',
      version: '1.0.9',
      versioncode: '1090',
      'accept-encoding': 'gzip',
      'user-agent': 'okhttp/3.10.0',
    }
    if (ApiName !== 'sdkLogin') {
      // 除了 login 再都要 token
      headers = {
        ...headers,
        token: token,
      }
    }
    if (!['forumList', 'findRoleList', 'roleList'].includes(ApiName)) {
      // 除了上面几个其他都有 distinct_id
      headers = {
        ...headers,
        distinct_id: '765485e7-30ce-4496-9a9c-a2ac1c03c02c',
      }
    }

    // 处理 content-type
    if (['findRoleList', 'roleList'].includes(ApiName)) {
      // findRoleList roleList 多了个 utf8
      headers = {
        ...headers,
        'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
      }
    } else if (ApiName == 'mcGachaRecord') {
      headers = {
        ...headers,
        'content-type': 'application/json',
      }
    } else if (ApiName !== 'uploadForumImg') {
      // 普通请求为 application/x-www-form-urlencoded, uploadForumImg 为 multipart/form-data, 这里不用手动添加, 让那边的 form-data 自己处理
      headers = {
        ...headers,
        'content-type': 'application/x-www-form-urlencoded',
      }
    }

    return headers
  }
}
