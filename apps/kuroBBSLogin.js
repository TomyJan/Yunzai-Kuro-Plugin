import kurologin from '../model/kuroBBSLogin.js'
import plugin from '../../../lib/plugins/plugin.js'
import fetch from 'node-fetch'

export class kuroBBSLogin extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '库洛账号验证码登录',
      /** 功能描述 */
      dsc: '库洛账号验证码登录',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1000,
      rule: [
        {
          reg: '^#库洛(账号|验证码|密码)(登录|绑定|登陆)$',
          fnc: 'captchaLoginHelp',
        },
        {
          reg: '^库洛账号(.*)验证码(.*)$',
          fnc: 'captchaLoginResult',
        },
      ],
    })
  }

  async captchaLoginHelp(e) {
    if (!e.isPrivate) {
      this.reply(`请私聊使用`)
      return false
    }
    let kuro = new kurologin(e)
    await kuro.captchaLoginHelp()
    return true
  }

  async captchaLoginResult(e) {
    if (!e.isPrivate) {
      this.reply(`请私聊使用`)
      return false
    }
    let kuro = new kurologin(e)
    let rsp = await kuro.captchaLoginResult()
    if (rsp) await bindToken(e, rsp)
    return rsp
  }

  async bindToken(e, res) {
    // TODO
  }
}
