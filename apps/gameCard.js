import plugin from '../../../lib/plugins/plugin.js'
import puppeteer from '../../../lib/puppeteer/puppeteer.js'
import gameCardData from '../model/gameCard.js'
import md5 from 'md5'

export class gameCard extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '库洛游戏卡片',
      /** 功能描述 */
      dsc: '库洛游戏卡片',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1000,
      rule: [
        {
          reg: '^#?战双(帕弥什)?(卡片|面板)$',
          fnc: 'gameCardPns',
        },
      ],
    })
  }

  async gameCardPns(e) {
    let data = await gameCardData.get(this.e, 'gameCardPns', this.e.user_id)
    if (!data) {
      await this.reply('卡片信息获取失败')
      return
    }
    let img = await this.cache(data)
    await this.reply(img)
  }

  async cache(data) {
    let tmp = md5(JSON.stringify(data))
    if (gameCard.pnsCardData.md5 === tmp) {
      //return gameCard.pnsCardData.img
    }

    gameCard.pnsCardData.img = await puppeteer.screenshot('gameCardPns', data)
    gameCard.pnsCardData.md5 = tmp

    return gameCard.pnsCardData.img
  }

  static pnsCardData = {
    md5: '',
    img: '',
  }
}
