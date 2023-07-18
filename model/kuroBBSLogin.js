import fetch from 'node-fetch'

export default class kuroBBSLogin {
  constructor(e) {
    this.e = e
    this.init()
    //消息提示以及风险警告
    this.captchaLoginHelpTip = `免责声明:您将通过短信验证码获取库街区 token 登录库街区. \n本 Bot 不会保存您的账号和密码, 但会保存获取到的账号 token . \n我方仅提供库街区签到, 查询及其它相关游戏内容服务, 您的账号出现封禁, 被盗等处罚与我方无关. \n\n继续登录即为您阅读并同意以上条款! `
    this.ctokenLoginHelpTip = `免责声明:您将通过直接提交 token 登录库街区. \n本 Bot 不会保存您的账号和密码, 但会保存获取到的账号 token . \n我方仅提供库街区签到, 查询及其它相关游戏内容服务, 您的账号出现封禁, 被盗等处罚与我方无关. \n\n继续登录即为您阅读并同意以上条款! `
  }
  async init() {}

  async captchaLoginHelp() {
    this.e.reply(this.captchaLoginHelpTip)
    this.e.reply(
      `请前往 https://www.kurobbs.com/pns/home/2 或库街区 APP 输入手机号点击发送验证码后, 将手机号和验证码用逗号隔开私聊发送以完成绑定\n例：库洛账号18888888888,验证码114514\n\n注意: 库街区 APP 同战双一样, 只能登录一个设备, 即机器人的登录和你自己手机 APP 的登录会互顶. 如果你需要用到库街区 APP, 请发送 #库洛token登录 查看抓包登录教程`
    )
  }
  async captchaLoginResult() {
    let msg = this.e.msg
      .replace(/库洛账号|验证码|：|:/g, '')
      .replace(/,|，/, ',')
      .replace(/#| /, '')
      .split(',')

    if (msg.length != 2 || (msg[0] == '') | (msg[1] == '')) {
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

    const url = 'https://api.kurobbs.com/user/sdkLogin'
    const headers = {
      osversion: 'Android',
      devcode: '2fba3859fe9bfe9099f2696b8648c2c6',
      distinct_id: '765485e7-30ce-4496-9a9c-a2ac1c03c02c',
      countrycode: 'CN',
      ip: '10.0.2.233',
      model: '2211133C',
      source: 'android',
      lang: 'zh-Hans',
      version: '1.0.9',
      versioncode: '1090',
      'content-type': 'application/x-www-form-urlencoded',
      'accept-encoding': 'gzip',
      'user-agent': 'okhttp/3.10.0',
    }

    const formData = new URLSearchParams()
    formData.append('code', msg[1])
    formData.append('devCode', '2fba3859fe9bfe9099f2696b8648c2c6')
    formData.append('gameList', '')
    formData.append('mobile', msg[0])
    logger.info(formData)
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData,
      })

      if (!response.ok) {
        this.e.reply('请求失败: ' + response.status)
        throw new Error('请求失败: ' + response.status)
      }

      const rsp = await response.json()

      if (rsp.code === 200) {
        logger.info('[库洛插件] 登陆成功, 即将保存 token, 下面是此次获取的 token, 请勿泄露!\n' + JSON.stringify(rsp))
        this.e.reply('登录成功!\n' + JSON.stringify(rsp))
        return rsp
      } else {
        logger.info('[库洛插件] 登陆失败\n' + JSON.stringify(rsp))
        this.e.reply('登录失败!\n' + JSON.stringify(rsp))
        return false
      }
    } catch (error) {
      logger.info('[库洛插件] 登陆失败\n' + JSON.stringify(error))
      this.e.reply('登录失败!\n' + JSON.stringify(error))
      return false
    }

    function isPhoneNumber(str) {
      const pattern = /^1[3456789]\d{9}$/
      return pattern.test(str)
    }
  }

  async tokenLoginHelp() {
    this.e.reply(this.tokenLoginHelpTip)
    this.e.reply(
      `请私聊发送 #库洛token后面跟上你的token 完成登录\n抓包教程: https://blog.tomys.top/2023-07/kuro-token/`
    )
  }
}
