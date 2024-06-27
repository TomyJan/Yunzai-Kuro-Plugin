import FormData from 'form-data'
import kuroApiHandler from './kuroApiHandler.js'
import { getToken } from './kuroBBSTokenHandler.js'

export default class kuroApi {
  constructor(uin) {
    this.uin = uin
    if (uin) this.tokenDataPromise = this.initializeTokenData()
  }

  /**
   * 异步初始化 tokenData
   */
  async initializeTokenData() {
    return getToken(this.uin) // 返回getToken的Promise
  }

  // 等待tokenData初始化完成的辅助方法
  async waitTokenData() {
    this.tokenData = await this.tokenDataPromise
  }

  /**
   * 取库洛接口返回
   * @param {string} ApiName 接口名称
   * @param {string|boolean} kuroUid 库洛 ID, sdkLogin 时传入 false
   * @param {object} data 传入数据, 具体业务需要的参数也不同
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async getData(ApiName, kuroUid, data) {
    // 不需要从文件读 token 的 API
    if (!['sdkLogin', 'checkToken_mineV2'].includes(ApiName))
      await this.waitTokenData()

    this.kuroApiHandler = new kuroApiHandler()
    let rsp = ''

    // 特殊 API 的调用处理
    if (
      [
        'sdkLogin',
        'mcGachaRecord',
        'getPluginServerKuroBbsLoginAuth',
        'getPluginServerKuroBbsLoginToken',
      ].includes(ApiName)
    ) {
      rsp = await this.kuroApiHandler.getApiRsp(ApiName, '1', null, data)
    } else if (ApiName == 'checkToken_mineV2') {
      ApiName = 'mineV2'
      rsp = await this.kuroApiHandler.getApiRsp(
        ApiName,
        kuroUid,
        data.token,
        data
      )
    } else {
      rsp = await this.kuroApiHandler.getApiRsp(
        ApiName,
        kuroUid,
        this.tokenData[kuroUid]?.token,
        data
      )
    }

    if (typeof rsp == 'string') {
      // 不是 json, 即返回报错
      return rsp
    }
    if (rsp.code === 200) {
      return rsp
    } else if (rsp.code === 220) {
      if (
        ['forumSignIn', 'gameSignInV2'].includes(ApiName) &&
        rsp.hasOwnProperty('success')
      )
        return '签到失败风控'
      return 'token 失效'
    } else if (
      [
        'mcGachaRecord',
        'getPluginServerKuroBbsLoginAuth',
        'getPluginServerKuroBbsLoginToken',
      ].includes(ApiName)
    ) {
      if (rsp.code === 0) return rsp
      else return rsp?.message || rsp?.msg || '未知错误'
    } else return rsp?.msg || rsp?.message || '未知错误'
  }

  /**
   * 取绑定游戏账号列表
   * @param {string} kuroUid 库洛 ID
   * @param {object} data 传入 data.gameId 游戏 id
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async findRoleList(kuroUid, data) {
    return this.getData('findRoleList', kuroUid, data)
  }

  /**
   * 取绑定游戏账号列表
   * @param {string} kuroUid 库洛 ID
   * @param {object} data 传入 data.gameId 游戏 id
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async roleList(kuroUid, data) {
    return this.getData('roleList', kuroUid, data)
  }

  /**
   * 取战双小组件数据
   * @param {string} kuroUid 库洛 ID
   * @param {object} data 传入 data.serverId 服务器 id data.roleId 游戏 uid
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async getPnsWidgetData(kuroUid, data) {
    data.gameId = 2
    data.type = 2
    return this.getData('getPnsWidgetData', kuroUid, data)
  }

  /**
   * 取鸣潮小组件数据
   * @param {string} kuroUid 库洛 ID
   * @param {object} data 传入 data.serverId 服务器 id data.roleId 游戏 uid
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async getMcWidgetData(kuroUid, data) {
    data.gameId = 3
    data.type = 2
    data.sizeType = 1
    return this.getData('getMcWidgetData', kuroUid, data)
  }

  /**
   *  取游戏签到信息 V2
   * @param {string} kuroUid 库洛 ID
   * @param {object} data 传入 data.gameId 游戏 id data.serverId 服务器 id data.roleId 游戏 uid
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async initSignInV2(kuroUid, data) {
    return this.getData('initSignInV2', kuroUid, data)
  }

  /**
   *  游戏签到 V2
   * @param {string} kuroUid 库洛 ID
   * @param {object} data 传入 data.gameId 游戏 id data.serverId 服务器 id data.roleId 游戏 uid
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async gameSignInV2(kuroUid, data) {
    data.reqMonth = (new Date().getMonth() + 1).toString().padStart(2, '0')
    return this.getData('gameSignInV2', kuroUid, data)
  }

  /**
   * 取游戏签到记录 V2
   * @param {string} kuroUid 库洛 ID
   * @param {object} data 传入 data.gameId 游戏 id data.serverId 服务器 id data.roleId 游戏 uid
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async queryGameSignInRecordV2(kuroUid, data) {
    return this.getData('queryGameSignInRecordV2', kuroUid, data)
  }

  /**
   *  APP 端验证码登录
   * @param {object} data 传入 data.mobile 手机号 data.code 验证码
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async sdkLogin(data) {
    return this.getData('sdkLogin', null, data)
  }

  /**
   *  取个人信息 V2
   * @param {string} kuroUid 库洛 ID
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async mineV2(kuroUid) {
    return this.getData('mineV2', kuroUid, {})
  }

  /**
   *  利用 mineV2 检查 token 有效性
   * @param {string} kuroUid 库洛 ID
   * @param {string} token 库洛 ID 的 token
   * @returns {boolean} 是否有效
   */
  async checkToken_mineV2(kuroUid, token) {
    let tmp = await this.getData('checkToken_mineV2', kuroUid, { token: token })

    if (tmp.code == 200) return true
    else return false
  }

  /**
   *  更新头像直链
   * @param {string} kuroUid 库洛 ID
   * @param {object} data 传入 data.headUrl 头像直链
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async updateHeadUrl(kuroUid, data) {
    return this.getData('updateHeadUrl', kuroUid, data)
  }

  /**
   *  上传图片
   * @param {string} kuroUid 库洛 ID
   * @param {object} data 传入 data.image 头像图片二进制
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async uploadForumImg(kuroUid, data) {
    let formData = new FormData()
    formData.append('files', data.image, 'image.jpg')
    data.body = formData
    return this.getData('uploadForumImg', kuroUid, data)
  }

  /**
   * 社区签到
   * @param {string} kuroUid 库洛 ID
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async forumSignIn(kuroUid) {
    return this.getData('forumSignIn', kuroUid, { gameId: 2 })
  }

  /**
   * 社区签到信息
   * @param {string} kuroUid 库洛 ID
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async forumSignInInfo(kuroUid) {
    return this.getData('forumSignInInfo', kuroUid, { gameId: 2 })
  }

  /**
   * 取帖子列表, 这里暂时写死了一些不常改变的参数
   * @param {string} kuroUid 库洛 ID
   * @param {object} data 传入 data.forumId 板块 id, data.gameId 游戏 id
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async forumList(kuroUid, data) {
    data.pageIndex = 1
    data.pageSize = 20
    data.searchType = 2
    data.timeType = 0
    data.topicId = 0
    return this.getData('forumList', kuroUid, data)
  }

  /**
   * 取帖子详情, 这里暂时写死了未知参数
   * @param {string} kuroUid 库洛 ID
   * @param {object} data 传入 data.postId 帖子 id
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async getPostDetail(kuroUid, data) {
    data.isOnlyPublisher = 0
    data.showOrderType = 2
    return this.getData('getPostDetail', kuroUid, data)
  }

  /**
   * 取帖子详情
   * @param {string} kuroUid 库洛 ID
   * @param {object} data 传入 data.postId 帖子 id
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async like(kuroUid, data) {
    return this.getData('like', kuroUid, data)
  }

  /**
   * 社区分享任务, 游戏 id 无所谓所以暂时写死
   * @param {string} kuroUid 库洛 ID
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async shareTask(kuroUid) {
    return this.getData('shareTask', kuroUid, { gameId: 2 })
  }

  /**
   * 取任务进度
   * @param {string} kuroUid 库洛 ID
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async getTaskProcess(kuroUid) {
    return this.getData('getTaskProcess', kuroUid, {})
  }

  /**
   * 取库洛币总数
   * @param {string} kuroUid 库洛 ID
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async getTotalGold(kuroUid) {
    return this.getData('getTotalGold', kuroUid, {})
  }

  /**
   * 取活动绑定游戏角色信息
   * @param {string} kuroUid 库洛 ID
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async getBindRoleInfo(kuroUid) {
    return this.getData('getBindRoleInfo', kuroUid, {})
  }

  /**
   * 取活动任务详情
   * @param {string} kuroUid 库洛 ID
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async getActivityTaskList(kuroUid) {
    return this.getData('getActivityTaskList', kuroUid, {})
  }

  /**
   * 完成活动任务, 暂时写死游戏 id
   * @param {string} kuroUid 库洛 ID
   * @param {object} data 传入 data.taskId 任务 id
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async completeActivityTask(kuroUid, data) {
    data.gameId = 2
    return this.getData('completeActivityTask', kuroUid, data)
  }

  /**
   * 领取活动任务奖励, 暂时写死游戏 id
   * @param {string} kuroUid 库洛 ID
   * @param {object} data 传入 data.taskId 任务 id
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async receiveActivityTask(kuroUid, data) {
    data.gameId = 2
    return this.getData('receiveActivityTask', kuroUid, data)
  }

  /**
   * 活动绑定游戏角色, 暂时写死游戏 id
   * @param {string} kuroUid 库洛 ID
   * @param {object} data 传入 data.roleId 游戏账号 id data.serverId 游戏服务器 id
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async activityBindRole(kuroUid, data) {
    data.gameId = 2
    return this.getData('activityBindRole', kuroUid, data)
  }

  /**
   * 取活动奖券数量
   * @param {string} kuroUid 库洛 ID
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async getActivityLotteryRemain(kuroUid) {
    return this.getData('getActivityLotteryRemain', kuroUid, {})
  }

  /**
   * 执行活动抽奖, 暂时写死游戏 id
   * @param {string} kuroUid 库洛 ID
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async doActivityLottery(kuroUid) {
    return this.getData('doActivityLottery', kuroUid, { gameId: 2 })
  }

  /**
   * 关注用户
   * @param {string} kuroUid 库洛 ID
   * @param {object} data 传入 data.followUserId 被关注用户 id data.operateType 操作类型 1 关注 2 取消关注
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async followUser(kuroUid, data) {
    return this.getData('followUser', kuroUid, data)
  }

  /**
   * 鸣潮抽卡记录
   * @param {string} kuroUid 库洛 ID, 传 0 即可
   * @param {object} data 传入 data.cardPoolId 卡池 id data.cardPoolType 卡池类型 data.playerId 游戏 uid data.recordId 记录 id data.serverId 服务器 id
   * @returns {JSON|string} code=0 时接口返回的原始 json 或者报错信息
   */
  async mcGachaRecord(kuroUid, data) {
    return this.getData('mcGachaRecord', kuroUid, data)
  }

  /**
   * 从插件服务器获取库街区登录通信 token
   * @param {string} kuroUid 库洛 ID, 传 0 即可
   * @returns {JSON|string} code=0 时接口返回的原始 json 或者报错信息
   */
  async getPluginServerKuroBbsLoginAuth(kuroUid) {
    return this.getData('getPluginServerKuroBbsLoginAuth', kuroUid, {})
  }

  /**
   * 从插件服务器获取库街区 token
   * @param {string} kuroUid 库洛 ID, 传 0 即可
   * @params {object} data 传入 data.token 通信 token
   * @returns {JSON|string} code=0 时接口返回的原始 json 或者报错信息
   */
  async getPluginServerKuroBbsLoginToken(kuroUid, data) {
    return this.getData('getPluginServerKuroBbsLoginToken', kuroUid, data)
  }
}
