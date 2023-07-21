import fetch from 'node-fetch'
import { getToken } from '../model/kuroBBSTokenHandler.js'
import { sleepAsync } from '../model/utils.js'
import kuroApi from './kuroApi.js'

export default class gameSignIn {
  constructor(e) {
    this.e = e
    this.init()
    //消息提示以及风险警告
    this.captchaLoginHelpTip = `免责声明:您将通过短信验证码获取库街区 token . \n本 Bot 不会保存您的账号和密码, 但会保存获取到的账号 token . \n我方仅提供库街区签到, 查询及其它相关游戏内容服务, 您的账号出现封禁, 被盗等处罚与我方无关. \n\n继续登录即为您阅读并同意以上条款! `
  }
  async init() {}

  async pnsSignIn(uin) {
    const tokenData = await getToken(uin)
    console.log(tokenData)

    if (tokenData && Object.keys(tokenData).length > 0) {
      const accNum = Object.keys(tokenData).length
      await this.e.reply(
        `QQ ${uin} 绑定了 ${accNum} 个 token\n开始战双签到, 稍等一会儿哟...`
      )
      let msg = ''
      for (const kuro_uid in tokenData) {
        if (tokenData.hasOwnProperty(kuro_uid)) {
          msg += await doPnsSignIn(this.e.user_id, kuro_uid, tokenData[kuro_uid].token)
          msg += '\n'
        } else {
          msg += `账号 ${kuro_uid}: \ntoken 格式错误\n\n`
        }
        await sleepAsync(3000)
      }

      await this.e.reply(msg.trim())
      return true
    } else {
      this.e.reply(
        `QQ ${uin} 暂未绑定 token, 请发送 #库洛验证码登录 绑定 token `
      )
      return false
    }
  }
}

export async function doPnsSignIn(uin, kuro_uid, token) {
  let doPnsSignInRet = ''
  doPnsSignInRet += `账号 ${kuro_uid}: \n`
  // 获取绑定的游戏 id 列表有俩接口, emmm 迷惑
  let kuroapi = new kuroApi(uin)
  let rsp_findRoleList = await kuroapi.findRoleList(kuro_uid,{gameId: 2})
  logger.mark('rsp_findRoleList ' + JSON.stringify(rsp_findRoleList))
  if(typeof rsp_findRoleList == 'string') { // 不是 json, 即返回报错
    doPnsSignInRet += `${rsp_findRoleList}\n`
    return doPnsSignInRet
  }
      if (rsp_findRoleList.data.length === 0) {
        // 没绑定游戏账号
        doPnsSignInRet += '未绑定游戏账号\n'
        return doPnsSignInRet
      }
      for (const data of rsp_findRoleList.data) {
        doPnsSignInRet += `${data.serverName}-${data.roleName}(${data.roleId}): \n`
        //执行签到查询后执行签到

          let rsp_initSignIn  = await kuroapi.initSignIn(kuro_uid,{gameId: 2,serverId: data.serverId, roleId: data.roleId})
          logger.mark('rsp_initSignIn ' + JSON.stringify(rsp_initSignIn))
          if(typeof rsp_initSignIn == 'string') { // 不是 json, 即返回报错
            doPnsSignInRet += `${rsp_initSignIn}\n`
            return doPnsSignInRet
          }
            if (rsp_initSignIn.data.sigIn) {
              //如果今天已经签到
              doPnsSignInRet +=
                `      今日已签`
            } else {
              // 签到
              let rsp_signIn  = await kuroapi.signIn(kuro_uid,{gameId: 2,serverId: data.serverId, roleId: data.roleId})
              logger.mark('rsp_signIn ' + JSON.stringify(rsp_signIn))
              if(typeof rsp_signIn !== 'string') { // 是 json
                rsp_signIn = '签到成功'
              }
              doPnsSignInRet += `      ${rsp_signIn}`

            }
            doPnsSignInRet += `, 本月签${rsp_initSignIn.data.sigInNum}天` +
            (rsp_initSignIn.data.omissionNnm !== 0
              ? `, 漏${rsp_initSignIn.data.omissionNnm}天`
              : '') +
            `\n`


        await sleepAsync(3000)
      }

  return doPnsSignInRet
}
