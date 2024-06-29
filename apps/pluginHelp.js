import plugin from '../../../lib/plugins/plugin.js'
import puppeteer from '../../../lib/puppeteer/puppeteer.js'
import pluginHelpData from '../model/pluginHelp.js'
import md5 from 'md5'
import { updateCardBg } from '../model/utils.js'

export class pluginHelpApp extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '[库洛插件]库洛帮助',
      /** 功能描述 */
      dsc: '库洛帮助',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1000,
      rule: [
        {
          reg: '^#?(库洛(插件)?|kuro)(帮助|菜单|help)$',
          fnc: 'pluginHelpIndex',
        },
      ],
    })
  }

  async pluginHelpIndex(e) {
    let data = await pluginHelpData.get(this.e)
    if (!data) {
      await this.reply('帮助信息获取失败')
      return
    }
    let img = await this.cache(data)
    await this.reply(img)
  }

  async cache(data) {
    let tmp = md5(JSON.stringify(data))
    if (pluginHelpApp.helpData.md5 === tmp) {
      return pluginHelpApp.helpData.img
    }

    await updateCardBg()
    pluginHelpApp.helpData.img = await puppeteer.screenshot('help', data)
    pluginHelpApp.helpData.md5 = tmp

    return pluginHelpApp.helpData.img
  }

  static helpData = {
    md5: '',
    img: '',
  }
}
