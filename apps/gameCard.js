import plugin from '../../../lib/plugins/plugin.js'
import puppeteer from '../../../lib/puppeteer/puppeteer.js'
import gameCardData from '../model/gameCard.js'
import md5 from 'md5'
import { saveAccCurPnsUidIndex } from '../model/userConfig.js'
import kuroLogger from '../components/logger.js'

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
          reg: '^#?战双(帕弥什)?(卡片|面板)(.*)$',
          fnc: 'gameCardPns',
        },
      ],
    })
  }

  async gameCardPns(e) {
    kuroLogger.debug('战双卡片:', e.msg)
    // 提取消息文本末尾的数字
    let index = this.e.msg
                      .replace(/战双|帕弥什|卡片|面板|：|:/g, '')
                      .replace(/,|，/g, ',')
                      .replace(/#| /g, '')
    kuroLogger.debug('战双卡片索引:', index)
    if (index) {
      if (await saveAccCurPnsUidIndex(this.e.user_id, index - 1))
        await this.reply(`已切换至第 ${index} 个账号`)
      else
        await this.reply(`切换账号失败`)
    }
    let data = await gameCardData.get(this.e, 'gameCardPns', this.e.user_id)
    if (!data) return false
    let img = await this.cache(data)
    await this.reply(img)
  }

  async cache(data) {
    let tmp = md5(JSON.stringify(data))
    if (gameCard.pnsCardData.md5 === tmp) {
      return gameCard.pnsCardData.img
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
