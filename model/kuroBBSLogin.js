import kuroLogger from '../components/logger.js'
import kuroApi from './kuroApi.js'
import { sleepAsync } from './utils.js'

export default class kuroBBSLogin {
  constructor(e) {
    this.e = e
    this.init()
    //消息提示以及风险警告
    this.captchaLoginHelpTip = `免责声明:您将通过短信验证码获取库街区 token 登录库街区. \n本 Bot 不会保存您的账号和密码, 但会保存获取到的账号 token . \n我方仅提供库街区签到, 查询及其它相关游戏内容服务, 您的账号出现封禁, 被盗等处罚与我方无关. \n\n继续登录即为您阅读并同意以上条款! `
    this.tokenLoginHelpTip = `免责声明:您将通过直接提交 token 登录库街区. \n本 Bot 不会保存您的账号和密码, 但会保存获取到的账号 token . \n我方仅提供库街区签到, 查询及其它相关游戏内容服务, 您的账号出现封禁, 被盗等处罚与我方无关. \n\n继续登录即为您阅读并同意以上条款! `
    this.onlineLoginTip = `免责声明:您将通过插件服务器在线登录库街区. \n服务器及本 Bot 不会保存您的账号和密码, 但会保存获取到的账号 token . \n我方仅提供库街区签到, 查询及其它相关游戏内容服务, 您的账号出现封禁, 被盗等处罚与我方无关. \n\n继续登录即为您阅读并同意以上条款! `
  }
  async init() {}

  async captchaLoginHelp() {
    await this.e.reply(this.captchaLoginHelpTip)
    this.e.reply(
      `建议优先使用 #库洛在线登录 , 无法使用可使用此功能 \n \n请前往 https://wiki.kurobbs.com/pns/home 点击右上角头像或库街区 APP 登录页面, 输入手机号点击发送验证码后, 将手机号和验证码用逗号隔开私聊发送以完成绑定\n例: 库洛账号18888888888,验证码114514\n\n注意: 库街区 APP 同战双一样, 只能登录一个设备, 即机器人的登录和你自己手机 APP 的登录会互顶. 如果你需要用到库街区 APP, 请发送 #库洛token登录 查看抓包登录教程`
    )
  }

  async captchaLoginResult() {
    let msg = this.e.msg
      .replace(/库洛账号|验证码|：|:/g, '')
      .replace(/,|，/g, ',')
      .replace(/#| /g, '')
      .split(',')

    if (msg.length != 2 || msg[0] == '' || msg[1] == '') {
      this.e.reply(`参数不完整`)
      return false
    }
    if (!isPhoneNumber(msg[0])) {
      this.e.reply(`手机号格式错误`)
      return false
    }
    if (!/^\d{6}$/.test(msg[1])) {
      this.e.reply(`验证码格式错误`)
      return false
    }

    let kuroapi = new kuroApi(this.e.user_id)
    let rsp_sdkLogin = await kuroapi.sdkLogin({ mobile: msg[0], code: msg[1] })
    kuroLogger.debug('rsp_sdkLogin:', JSON.stringify(rsp_sdkLogin))
    if (typeof rsp_sdkLogin == 'string') {
      // 不是 json, 即返回报错
      this.e.reply(rsp_sdkLogin)
      return false
    }

    if (rsp_sdkLogin.code === 200) {
      // kuroLogger.debug('登录成功!', JSON.stringify(rsp_sdkLogin))
      this.e.reply(
        '登录成功, 即将保存 token, 下面是此次获取的 token, 请勿泄露!\n' +
          JSON.stringify(rsp_sdkLogin)
      )
      return rsp_sdkLogin
    } else {
      kuroLogger.info('登录失败:', JSON.stringify(rsp_sdkLogin))
      this.e.reply('登录失败!\n' + JSON.stringify(rsp_sdkLogin.msg))
      return false
    }

    function isPhoneNumber(str) {
      const pattern = /^1[3456789]\d{9}$/
      return pattern.test(str)
    }
  }

  async tokenLoginHelp() {
    await this.e.reply(this.tokenLoginHelpTip)
    this.e.reply(
      `请私聊发送 #库洛token后面跟上你的token 完成登录\n抓包教程: https://blog.tomys.top/2023-07/kuro-token/`
    )
  }

  async tokenLoginResult() {
    let rsp1 = this.e.msg.replace(/#| |\r\n|\n/g, '').replace(/库洛token/, '')

    try {
      JSON.parse(rsp1)
      if (JSON.parse(rsp1).hasOwnProperty('data')) {
        if (
          JSON.parse(rsp1).data.hasOwnProperty('userId') &&
          JSON.parse(rsp1).data.hasOwnProperty('token')
        ) {
          return JSON.parse(rsp1)
        }
      }
      this.e.reply('token 格式错误!')
      return false
    } catch (e) {
      this.e.reply('token 格式错误!')
      return false
    }
  }

  async onlineLogin() {
    await this.e.reply(this.onlineLoginTip)
    let kuroapi = new kuroApi(this.e.user_id)
    let rsp_getPluginServerKuroBbsLoginAuth =
      await kuroapi.getPluginServerKuroBbsLoginAuth(0)
    kuroLogger.debug(
      'rsp_getPluginServerKuroBbsLoginAuth:',
      JSON.stringify(rsp_getPluginServerKuroBbsLoginAuth)
    )
    if (typeof rsp_getPluginServerKuroBbsLoginAuth == 'string') {
      // 不是 json, 即返回报错
      this.e.reply(
        `生成通行证失败: ${rsp_getPluginServerKuroBbsLoginAuth} \n 请重试或尝试使用 #库洛验证码登录`
      )
      return false
    }

    if (rsp_getPluginServerKuroBbsLoginAuth.code === 0) {
      // kuroLogger.debug('登录成功!', JSON.stringify(rsp_onlineLogin))
      let loginMsg = await this.e.reply(
        `请在三分钟内点击此链接完成登录: https://kuro.amoe.cc/page/kuroBbsLogin?token=${rsp_getPluginServerKuroBbsLoginAuth.token} \n这是专属链接, 请勿点击他人的链接~ `
      )
      // 五秒取一次登录状态, 三分钟后过期
      let i = 0
      let failedTimes = 0
      while (i < 36) {
        await sleepAsync(5000)
        if (i == 12) {
          // 一分钟后撤回消息
          kuroLogger.debug(
            'loginMsg:',
            JSON.stringify(loginMsg),
            '消息属性:',
            this.e.group ? '群聊' : '',
            this.e.friend ? '私聊' : ''
          )
          if (loginMsg) {
            try {
              if (this.e.group) this.e.group.recallMsg(loginMsg.message_id)
              if (this.e.friend) this.e.friend.recallMsg(loginMsg.message_id)
            } catch (err) {
              kuroLogger.warn('撤回消息失败:', JSON.stringify(err))
            }
          }
        }
        let rsp_onlineLogin = await kuroapi.getPluginServerKuroBbsLoginToken(
          0,
          {
            token: rsp_getPluginServerKuroBbsLoginAuth.token,
          }
        )
        kuroLogger.debug('rsp_onlineLogin:', JSON.stringify(rsp_onlineLogin))
        if (typeof rsp_onlineLogin == 'string') {
          // 不是 json
          if (failedTimes++ > 6) {
            this.e.reply(`多次获取登录态失败: ${rsp_onlineLogin}, 请重试`)
            return false
          }
          i++
          continue
        }
        if (rsp_onlineLogin.code !== 0) {
          if (failedTimes++ > 6) {
            this.e.reply(`多次获取登录态失败: ${rsp_onlineLogin.msg}, 请重试`)
            return false
          }
          i++
          continue
        }
        if (
          rsp_onlineLogin.data.hasOwnProperty('code') &&
          rsp_onlineLogin.data.hasOwnProperty('data')
        ) {
          this.e.reply(
            '登录成功, 即将保存 token, 可在网页复制此次获取的 token, 关闭网页后将无法再次复制, 请勿泄露!'
          )
          return rsp_onlineLogin.data
        }
        i++
      }
      await this.e.reply('登录超时, 请重试')
      return false
    } else {
      kuroLogger.info(
        '生成通行证失败:',
        JSON.stringify(rsp_getPluginServerKuroBbsLoginAuth)
      )
      this.e.reply(
        `生成通行证失败: ${rsp_getPluginServerKuroBbsLoginAuth.msg} \n 请重试或尝试使用 #库洛验证码登录`
      )
      return false
    }
  }
}
