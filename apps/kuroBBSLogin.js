import kurologin from '../model/kuroBBSLogin.js'
import plugin from '../../../lib/plugins/plugin.js'
import { checkTokenValidity, saveToken } from '../model/kuroBBSTokenHandler.js'

export class kuroBBSLogin extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '库洛账号登录',
      /** 功能描述 */
      dsc: '库洛账号登录',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1000,
      rule: [
        {
          reg: '^#?库洛(账号|验证码|密码)(登录|绑定|登陆)$',
          fnc: 'captchaLoginHelp',
        },
        {
          reg: '^#?库洛账号(.*)验证码(.*)$',
          fnc: 'captchaLoginResult',
        },
        {
          reg: '^#?库洛token(登录|绑定|登陆)$',
          fnc: 'tokenLoginHelp',
        },
        {
          reg: new RegExp('^#?库洛token(.*)$', 's'),
          fnc: 'tokenLoginResult',
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
    if (rsp) await this.bindToken(e, rsp)
    return true
  }

  async tokenLoginHelp(e) {
    if (!e.isPrivate) {
      this.reply(`请私聊使用`)
      return false
    }
    let kuro = new kurologin(e)
    await kuro.tokenLoginHelp()
    return true
  }

  async tokenLoginResult(e) {
    if (!e.isPrivate) {
      this.reply(`请私聊使用`)
      return false
    }
    let kuro = new kurologin(e)
    let rsp = await kuro.tokenLoginResult()
    if (rsp) await this.bindToken(e, rsp)
    return true
  }

  async bindToken(e, res) {
    if (await checkTokenValidity(res.data.userId, res.data.token)) {
      if (
        await saveToken(
          e.user_id,
          res.data.userId,
          res.data.token,
          res.data.refreshToken
        )
      ) {
        e.reply(
          '保存 token 成功!\n已为您开启自动签到, 请确保我们已经添加好友, 以便我能及时给你推送签到结果'
        )
      } else {
        e.reply('保存 token 出错!')
      }
    } else {
      e.reply('保存 token 失败: token 已失效!')
    }
  }
}
