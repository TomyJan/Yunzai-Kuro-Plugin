import plugin from '../../../lib/plugins/plugin.js'
import headUp from '../model/bbsHeadUpload.js'

export class bbsHeadUpload extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '库洛头像上传',
      /** 功能描述 */
      dsc: '库洛头像上传',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1000,
      rule: [
        {
          reg: '^#?(库洛(插件)?|kuro)(头像|head)(帮助|help)$',
          fnc: 'bbsHeadUploadHelp',
        },
        {
          reg: '^#?库洛头像上传账号(.*)头像(.*)$',
          fnc: 'bbsHeadUploadResult',
        },
      ],
    })
  }

  async bbsHeadUploadHelp(e) {
    let head = new headUp(e)
    await head.bbsHeadUploadHelp()
    return true
  }

  async bbsHeadUploadResult(e) {
    let head = new headUp(e)
    await head.bbsHeadUploadResult()
    return true
  }
}
