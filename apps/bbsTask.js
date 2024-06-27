import Task from '../model/bbsTask.js'
import plugin from '../../../lib/plugins/plugin.js'

export class bbsTaskApp extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '[库洛插件]库街区任务',
      /** 功能描述 */
      dsc: '库街区任务',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1000,
      rule: [
        {
          reg: '^#?库街区(((日常|每日)(任务)?)|任务)$',
          fnc: 'bbsDailyTask',
        },
      ],
    })
  }

  async bbsDailyTask(e) {
    let task = new Task(e)
    await task.bbsDailyTask(e.user_id)
    return true
  }
}
