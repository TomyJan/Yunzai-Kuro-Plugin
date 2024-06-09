import plugin from '../../../lib/plugins/plugin.js'

export class toy extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '[库洛插件]玩具功能',
      /** 功能描述 */
      dsc: '一些没卵用的小功能',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1000,
      rule: [
        {
          reg: '^#?库洛插件$',
          fnc: 'pluginTip',
        },
        {
          reg: '^#?(.*)是这样的(.*)$',
          fnc: 'mcSentence',
        },
      ],
    })
  }

  async pluginTip(e) {
    await this.reply(
      `库洛插件是这样的，库洛插件只要执行代码就行了，可是玩家就很辛苦了，什么时候绑定，什么时候清体力，什么时候秀抽卡记录，都是要经过深思熟虑的`
    )
  }

  async mcSentence(e) {
    // 沟槽的鸣言
    // 包含逗号的不处理避免打断复读
    if (e.msg.includes(',') || e.msg.includes('，')) return
    // 防止复读自己
    if (
      e.msg == '是这样的 前后都需要有参数' ||
      e.msg == '是这样的 后面至少需要五个参数'
    )
      return
    // 合并消息中的多个连续空格
    e.msg = e.msg.replace(/\s+/g, ' ')
    let message = e.msg.replace(/^#/, '').trim()
    let parts = message.match(/^(.*)是这样的(.*)$/)

    if (parts?.length !== 3 || !parts[0] || !parts[2]) {
      return
    }

    let part1 = parts[1].trim()
    let content = parts[2].trim().split(' ')

    if (content.length < 2) {
      return
    }

    if (content.length < 5) {
      await this.reply('是这样的 后面至少需要五个参数')
      return
    }

    let sentence = `${part1}是这样的，${content[0]}只要${
      content[1]
    }就行了，可是${content[2]}就很${content[3]}了，什么时候${content
      .slice(4)
      .join('，什么时候')}，都是要经过深思熟虑的`

    await this.reply(sentence)
  }
}
