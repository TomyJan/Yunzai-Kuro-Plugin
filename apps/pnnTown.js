import PnnTownActivity from '../model/pnnTownActivityTask.js'
import plugin from '../../../lib/plugins/plugin.js'

export class pnnTownActivityTaskApp extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '[库洛插件]帕尼尼小镇活动任务',
      /** 功能描述 */
      dsc: '一键完成帕尼尼小镇并领取兑换码',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1000,
      rule: [
        {
          reg: '^#?帕尼尼小镇(一键)?(活动)?(任务)?$',
          fnc: 'pnnTownHelp',
        },
        {
          reg: '^#?帕尼尼小镇(一键)?(活动)?(任务)?(登录)?(登陆)?(账号)?(手机号)?(.*)验证码(.*)$',
          fnc: 'pnnTownDo',
        },
        {
          reg: '^#?帕尼尼小镇(一键)?(活动)?(任务)?发送(账号)?(手机号)?(.*)$',
          fnc: 'pnnTownSendCode',
        },
      ],
    })
  }

  async pnnTownHelp(e) {
    if (!e.isPrivate) {
      this.reply('涉及敏感信息, 请私聊使用!')
      return false
    }
    let pnnAct = new PnnTownActivity(e)
    await pnnAct.pnnTownHelp()
    return true
  }

  async pnnTownDo(e) {
    if (!e.isPrivate) {
      this.reply('涉及敏感信息, 请私聊使用!')
      return false
    }
    let pnnAct = new PnnTownActivity(e)
    await pnnAct.pnnTownDo()
    return true
  }

  async pnnTownSendCode(e) {
    if (!e.isPrivate) {
      this.reply('涉及敏感信息, 请私聊使用')
      return false
    }
    let pnnAct = new PnnTownActivity(e)
    await pnnAct.pnnTownSendCode()
    return true
  }
}
