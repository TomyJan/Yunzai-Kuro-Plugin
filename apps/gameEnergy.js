import gameEnergy from '../model/gameEnergy.js'
import plugin from '../../../lib/plugins/plugin.js'

export class gameEnergyApp extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '[库洛插件]库洛游戏体力',
      /** 功能描述 */
      dsc: '库洛游戏体力查询',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1000,
      rule: [
        {
          reg: '^#?(血清|战双(体力|血清))(查询)?$',
          fnc: 'pnsEnergy',
        },
        {
          reg: '^#?((结晶)?波片|鸣潮(体力|(结晶)?波片))(查询)?$',
          fnc: 'mcEnergy',
        },
      ],
    })
  }

  async pnsEnergy(e) {
    let energy = new gameEnergy(e)
    await energy.pnsEnergy(e.user_id)
    return true
  }

  async mcEnergy(e) {
    let energy = new gameEnergy(e)
    await energy.mcEnergy(e.user_id)
    return true
  }
}
