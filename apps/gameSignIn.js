import gamesign from '../model/gameSignIn.js'
import plugin from '../../../lib/plugins/plugin.js'

export class kuroBBSLogin extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '[库洛插件]库洛游戏签到',
      /** 功能描述 */
      dsc: '库洛游戏签到',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1000,
      rule: [
        {
          reg: '^#?战双签到$',
          fnc: 'pnsSignIn',
        },
        {
          reg: '^#?鸣潮签到$',
          fnc: 'mcSignIn',
        },
      ],
    })
  }

  async pnsSignIn(e) {
    let pnssign = new gamesign(e)
    await pnssign.pnsSignIn(e.user_id)
    return true
  }

  async mcSignIn(e) {
    this.reply(`敬请期待~`)
    return false
  }
}
