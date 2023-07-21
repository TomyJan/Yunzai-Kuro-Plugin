import fs from 'node:fs'
import kuroApiHandler from './kuroApiHandler.js'
import { getToken } from './kuroBBSTokenHandler.js'
export default class kuroApi {
  constructor(uin) {
    this.uin = uin
    this.tokenDataPromise = this.initializeTokenData()
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
   * 调用其他接口前请先校验 token 有效性
   * @param {string} ApiName 接口名称
   * @param {string|boolean} kuroUid 库洛 ID, sdkLogin 时传入 false
   * @param {object} data 传入数据, 具体业务需要的参数也不同
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async getData(ApiName, kuroUid, data) {
    await this.waitTokenData()
    if (kuroUid) {
      // TODO: 检查 token 有效性
    }
    this.kuroApiHandler = new kuroApiHandler(this.uin)
    let rsp = ''
    if (ApiName !== 'sdkLogin') {
      rsp = await this.kuroApiHandler.getApiRsp(
        ApiName,
        kuroUid,
        this.tokenData[kuroUid].token,
        data
      )
    } else {
      rsp = await this.kuroApiHandler.getApiRsp(ApiName, false, '', data)
    }

    if (typeof rsp == 'string') {
      // 不是 json, 即返回报错
      return rsp
    }
    if (rsp.code === 200) {
      return rsp
    } else if (rsp.code === 220) {
      return 'token 失效'
    } else return rsp.msg
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
   *  取游戏签到信息
   * @param {string} kuroUid 库洛 ID
   * @param {object} data 传入 data.gameId 游戏 id data.serverId 服务器 id data.roleId 游戏 uid
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async initSignIn(kuroUid, data) {
    return this.getData('initSignIn', kuroUid, data)
  }

  /**
   *  游戏签到
   * @param {string} kuroUid 库洛 ID
   * @param {object} data 传入 data.gameId 游戏 id data.serverId 服务器 id data.roleId 游戏 uid
   * @returns {JSON|string} code=200 时接口返回的原始 json 或者报错信息
   */
  async signIn(kuroUid, data) {
    data.reqMonth = (new Date().getMonth() + 1).toString().padStart(2, '0')
    return this.getData('signIn', kuroUid, data)
  }
}
