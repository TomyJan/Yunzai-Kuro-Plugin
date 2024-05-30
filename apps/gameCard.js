import plugin from '../../../lib/plugins/plugin.js'
import puppeteer from '../../../lib/puppeteer/puppeteer.js'
import gameCardData from '../model/gameCard.js'
import md5 from 'md5'
import userConfig from '../model/userConfig.js'
import kuroLogger from '../components/logger.js'

export class gameCard extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '[库洛插件]库洛游戏卡片',
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
        {
          reg: '^#?鸣潮?(卡片|面板)(.*)$',
          fnc: 'gameCardMc',
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
      let user = new userConfig()
      if (await user.saveCurGameUidByIndex(this.e.user_id, index - 1, 2))
        await this.reply(
          `已切换至第 ${index} 个账号, UID: ${
            (
              await user.getCurGameUidLocal(this.e.user_id, 2)
            )?.gameUid
          }`
        )
      else await this.reply(`切换账号失败, 请检查索引是否正确`)
    }
    let data = await gameCardData.get(this.e, 'gameCardPns', this.e.user_id)
    if (!data) return false
    let img = await this.cachePns(data)
    await this.reply(img)
  }

  async cachePns(data) {
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

  async gameCardMc(e) {
    kuroLogger.debug('鸣潮卡片:', e.msg)
    // 提取消息文本末尾的数字
    let index = this.e.msg
      .replace(/鸣潮|卡片|面板|：|:/g, '')
      .replace(/,|，/g, ',')
      .replace(/#| /g, '')
    kuroLogger.debug('鸣潮卡片索引:', index)
    if (index) {
      let user = new userConfig()
      if (await user.saveCurGameUidByIndex(this.e.user_id, index - 1, 3))
        await this.reply(
          `已切换至第 ${index} 个账号, UID: ${await user.getCurGameUidLocal(
            this.e.user_id,
            3
          )?.gameUid}`
        )
      else await this.reply(`切换账号失败, 请检查索引是否正确`)
    }
    let data = await gameCardData.get(this.e, 'gameCardMc', this.e.user_id)
    if (!data) return false
    let img = await this.cacheMc(data)
    await this.reply(img)
  }

  async cacheMc(data) {
    let tmp = md5(JSON.stringify(data))
    if (gameCard.mcCardData.md5 === tmp) {
      return gameCard.mcCardData.img
    }

    gameCard.mcCardData.img = await puppeteer.screenshot('gameCardMc', data)
    gameCard.mcCardData.md5 = tmp

    return gameCard.mcCardData.img
  }

  static mcCardData = {
    md5: '',
    img: '',
  }
}
