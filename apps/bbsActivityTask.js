import bbsActivity from '../model/bbsActivityTask.js'
import plugin from '../../../lib/plugins/plugin.js'

export class bbsActivityTaskApp extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '[库洛插件]库街区活动任务',
      /** 功能描述 */
      dsc: '库街区活动任务',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1000,
      rule: [
        {
          reg: '^#?(库街区|库洛|战双)一键活动(任务)?$',
          fnc: 'bbsActivityTaskDo',
        },
        {
          reg: '^#?(库街区|库洛|战双)活动(.*)绑定(星火|信标)服(.*)$',
          fnc: 'bbsActivityTaskBind',
        },
      ],
    })
  }

  async bbsActivityTaskDo(e) {
    let bbsAct = new bbsActivity(e)
    await bbsAct.bbsActivityTask()
    return true
  }

  async bbsActivityTaskBind(e) {
    let bbsAct = new bbsActivity(e)
    await bbsAct.bbsActivityTaskBind()
    return true
  }
}
