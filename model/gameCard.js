import { getToken } from './kuroBBSTokenHandler.js'
import {
  pluginName,
  pluginVer,
  resPath,
  _ResPath,
} from '../data/system/pluginConstants.js'
import cfg from '../../../lib/config/config.js'
import kuroApi from './kuroApi.js'

export default class gameCard {
  constructor(e, model) {
    this.e = e
  }

  static async get(e, model, uin) {
    let accArr = []
    let html = new gameCard(e, model)
    const tokenData = await getToken(uin)

    if (tokenData && Object.keys(tokenData).length > 0) {
      for (const kuro_uid in tokenData) {
        if (tokenData.hasOwnProperty(kuro_uid)) {
          let kuroapi = new kuroApi(uin)
          // 获取昵称
          let rsp_mineV2 = await kuroapi.mineV2(kuro_uid)
          let accName = rsp_mineV2?.data?.mine?.userName || '未知昵称'
          accName += ` (${kuro_uid})`
          let rsp_roleList = await kuroapi.roleList(kuro_uid, { gameId: 2 })
          let acc = { account: accName, msg: '', data: null }
          if (typeof rsp_roleList !== 'string') {
            if (rsp_roleList.data.length > 0) {
              acc.msg = rsp_roleList.msg
              acc.data = rsp_roleList.data
            } else {
              acc.msg = ' - 未绑定游戏账号'
            }
          } else acc.msg = ` - 获取数据失败: ${rsp_roleList}`
          accArr.push(acc)
        } else {
          accArr.push({
            account: `未知昵称 (${kuro_uid})`,
            msg: ` - token 格式错误`,
            data: null,
          })
        }
      }
      logger.info(JSON.stringify(accArr))

      return {
        tplFile: `${resPath}/html/${model}/index.html`,
        accArr,
        pluResPath: _ResPath,
        pluginName,
        pluginVer,
      }
    } else {
      this.e.reply(
        `QQ ${this.e.user_id} 暂未绑定 token, 请发送 #库洛验证码登录 绑定 token `
      )
      return false
    }
  }
}
