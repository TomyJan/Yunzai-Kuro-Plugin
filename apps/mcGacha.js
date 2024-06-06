import mcGachaData from '../model/mcGachaData.js'
import plugin from '../../../lib/plugins/plugin.js'
import md5 from 'md5'
import puppeteer from '../../../lib/puppeteer/puppeteer.js'
import mcGachaCard from '../model/mcGachaCard.js'
import kuroLogger from '../components/logger.js'
import userConfig from '../model/userConfig.js'
import fs from 'fs'

export class mcGacha extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '[库洛插件]鸣潮抽卡记录',
      /** 功能描述 */
      dsc: '获取和分析鸣潮抽卡记录',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1000,
      rule: [
        {
          reg: '^#?鸣潮(抽卡|角色|up|抽奖|角色活动|活动角色|角色限定|限定角色|角色up|up角色|武器|武器活动|活动武器|武器限定|限定武器|武器up|up武器|常驻|角色常驻|常驻角色|武器常驻|常驻武器|新手|新手自选|自选)+池?(记录|唤取|分析)$',
          fnc: 'mcGachaDataShow',
        },
        {
          reg: '^#?鸣潮(抽卡|唤取)+(记录)?帮助$',
          fnc: 'mcGachaHelp',
        },
        {
          reg: '^#?鸣潮本地获取抽卡记录$',
          fnc: 'mcGachaHelpLocalGet',
        },
        {
          reg: '^#?鸣潮链接上传抽卡记录$',
          fnc: 'mcGachaHelpUrlGet',
        },
        {
          reg: '^#?(https://aki-gm-resources.aki-game.com/aki/gacha/index.html#/record|https://aki-gm-resources-oversea.aki-game.net/aki/gacha/index.html#/record)(.*)$',
          fnc: 'mcGachaLinkUpload',
        },
        {
          reg: '^#?{(.*)"recordId"(.*)}$',
          fnc: 'mcGachaLinkUpload',
        },
        {
          reg: '^#?鸣潮更新(抽卡|唤取)+(记录)?$',
          fnc: 'mcGachaDataUpdate',
        },
        {
          reg: '^#?鸣潮导出(抽卡|唤取)+(记录)?$',
          fnc: 'mcGachaDataExport',
        },
      ],
    })
  }

  async mcGachaDataShow(e) {
    let gacha = new mcGachaData(e)
    if (await gacha.check()) {
      // 通过检查, 可以生成抽卡分析
      // 从消息中提取卡池类型
      let msg = this.e.msg
        .replace(/#| /g, '')
        .replace(/鸣潮|记录|唤取|分析|池/g, '')
      let gachaType = 0
      let cardPoolName = ''
      switch (msg) {
        case '抽卡':
        case '角色':
        case 'up':
        case '抽奖':
        case '角色活动':
        case '活动角色':
        case '角色限定':
        case '限定角色':
        case '角色up':
        case 'up角色':
          gachaType = 1
          cardPoolName = '角色活动唤取'
          break
        case '武器':
        case '武器活动':
        case '活动武器':
        case '武器限定':
        case '限定武器':
        case '武器up':
        case 'up武器':
          gachaType = 2
          cardPoolName = '武器活动唤取'
          break
        case '常驻':
        case '角色常驻':
        case '常驻角色':
          gachaType = 3
          cardPoolName = '角色常驻唤取'
          break
        case '武器常驻':
        case '常驻武器':
          gachaType = 4
          cardPoolName = '武器常驻唤取'
          break
        case '新手':
          gachaType = 5
          cardPoolName = '新手唤取'
          break
        case '新手自选':
        case '自选':
          gachaType = 6
          cardPoolName = '新手自选唤取'
          break
        default:
          gachaType = 1
          cardPoolName = '角色活动唤取'
      }
      let data = await mcGachaCard.get(this.e, gachaType, cardPoolName)
      if (!data) {
        kuroLogger.warn('抽卡记录卡片数据获取失败')
        return false
      }
      if (typeof data === 'string') {
        await this.reply(data)
        return false
      }
      let img = await this.cache(data)
      await this.reply(img)
    }
    return false
  }

  async cache(data) {
    let tmp = md5(JSON.stringify(data))
    if (mcGacha.mcGachaCardData.md5 === tmp) {
      return mcGacha.mcGachaCardData.img
    }

    mcGacha.mcGachaCardData.img = await puppeteer.screenshot(
      'mcGachaRecord',
      data
    )
    mcGacha.mcGachaCardData.md5 = tmp

    return mcGacha.mcGachaCardData.img
  }

  static mcGachaCardData = {
    md5: '',
    img: '',
  }

  async mcGachaHelp(e) {
    e.reply(
      `请在游戏内打开一次抽卡记录, 然后从以下目录打开日志文件: \n \nWin 设备: \n游戏安装目录\\Client\\Saved\\Logs\\Client.log \n \nAndroid 设备: \n内部存储/Android/data/com.kurogame.mingchao或com.kurogame.wutheringwaves.global/files/UE4Game/Client/Client/Saved/Logs/Client.log \n \n在文件内搜索 record_id , 将找到的链接发送给我即可 \n \nAndroid 也可在抽卡界面断网后点击抽卡记录, 加载完成后长按-全选-复制 也可得到抽卡链接 \n \niOS 设备: \n参照此教程抓包获取: https://blog.tomys.top/2023-07/kuro-token/#iOS \n \n注意删除多余字符, 你发送的链接应该是以下格式: \nhttps://aki-gm-resources.aki-game.com/aki/gacha/index.html#/record?svr_id=TomyJan&player_id=101812955&lang=zh-Hans&gacha_id=1&gacha_type=1&svr_area=cn&record_id=TomyJan&resources_id=TomyJan \n国际服格式: \nhttps://aki-gm-resources-oversea.aki-game.net/aki/gacha/index.html#/record?svr_id=TomyJan&player_id=101812955&lang=zh-Hans&gacha_id=1&gacha_type=1&svr_area=global&record_id=TomyJan&resources_id=TomyJan \niOS 格式: \n{ \n  "recordId": "TomyJan", \n  "playerId": "101812955", \n  "serverId": "TomyJan", \n  "cardPoolId": "TomyJan", \n  "cardPoolType": 1, \n  "languageCode": "zh-Hans" \n} \n建议私聊发送哦~`
    )
    // e.reply(
    //   `可通过以下两种方式获取抽卡记录: \n\n#鸣潮本地获取抽卡记录 \n - 在本地访问链接获取抽卡记录, 快速但是无法自动更新 \n\n#鸣潮链接上传抽卡记录 \n - 通过日志中的抽卡记录链接上传, 较繁琐但是一次获取长期有效 \n\n发送相应指令即可查看帮助, 建议私聊使用~` // TODO: 抽卡链接有效期
    // )
    return true
  }

  async mcGachaHelpLocalGet(e) {
    // 该方法已经失效
    e.reply(
      '该方法已失效~ \n(没错, 小丑开发者写了一下午, 都基本写完了, 才发现库洛把这玩意修了)'
    )
    return true
    let getGachaRecordUrl = 'https://www.vov.moe'
    e.reply(
      `请在游戏内打开一次抽卡记录后, 使用相同的网络点击 ${getGachaRecordUrl} 输入游戏 uid 进行上传`
    )
    return true
  }

  async mcGachaHelpUrlGet(e) {
    e.reply(
      `请在游戏内打开一次抽卡记录, 然后从以下目录打开日志文件: \n \nWin 设备: \n游戏安装目录\\Client\\Saved\\Logs\\Client.log \n \nAndroid 设备: \n内部存储/Android/data/com.kurogame.mingchao或com.kurogame.wutheringwaves.global/files/UE4Game/Client/Client/Saved/Logs/Client.log \n \n在文件内搜索 record_id , 将找到的链接发送给我即可 \n \nAndroid 也可在抽卡界面断网后点击抽卡记录, 加载完成后长按-全选-复制 也可得到抽卡链接 \n \niOS 设备: \n参照此教程抓包获取: https://blog.tomys.top/2023-07/kuro-token/#iOS \n \n注意删除多余字符, 你发送的链接应该是以下格式: \nhttps://aki-gm-resources.aki-game.com/aki/gacha/index.html#/record?svr_id=TomyJan&player_id=101812955&lang=zh-Hans&gacha_id=1&gacha_type=1&svr_area=cn&record_id=TomyJan&resources_id=TomyJan \n国际服格式: \nhttps://aki-gm-resources-oversea.aki-game.net/aki/gacha/index.html#/record?svr_id=TomyJan&player_id=101812955&lang=zh-Hans&gacha_id=1&gacha_type=1&svr_area=global&record_id=TomyJan&resources_id=TomyJan \niOS 格式: \n{ \n  "recordId": "TomyJan", \n  "playerId": "101812955", \n  "serverId": "TomyJan", \n  "cardPoolId": "TomyJan", \n  "cardPoolType": 1, \n  "languageCode": "zh-Hans" \n} \n建议私聊发送哦~`
    )
    return true
  }

  async mcGachaLinkUpload(e) {
    let gachaLink = this.e.msg.replace(/#/g, '').replace(/\s/g, '').replace('index.html/record', 'index.html#/record')
    if (!gachaLink.startsWith('https://aki-gm-resources.aki-game.com/aki/gacha/index.html#/record') && !gachaLink.startsWith('https://aki-gm-resources-oversea.aki-game.net/aki/gacha/index.html#/record')) {
      // 上传了 json, 校验并转换为链接
      try {
        JSON.parse(gachaLink)
        // 检查字段是否缺失
        if (!gachaLink.recordId || !gachaLink.playerId || !gachaLink.serverId || !gachaLink.cardPoolId || !gachaLink.serverId) {
          await e.reply('抽卡记录 JSON 字段缺失, 请检查')
        }
        if (!/^[a-zA-Z0-9]{32}$/.test(gachaLink.recordId) || !/^[1-9]\d{8}$/.test(gachaLink.playerId) || !/^[a-zA-Z0-9]{32}$/.test(gachaLink.serverId) || !/^[a-zA-Z0-9]{32}$/.test(gachaLink.cardPoolId) || !/^[a-zA-Z0-9]{32}$/.test(gachaLink.serverId)) {
          await e.reply('抽卡记录 JSON 字段格式错误, 请检查')
          return true
        }
        // 转换为链接
        if (gachaLink.serverId === '76402e5b20be2c39f095a152090afddc') { // 国服
        gachaLink = `https://aki-gm-resources.aki-game.com/aki/gacha/index.html#/record??svr_id=${gachaLink.serverId}&player_id=${gachaLink.playerId}&lang=zh-Hans&gacha_id=1&gacha_type=1&svr_area=cn&record_id=${gachaLink.recordId}&resources_id=${gachaLink.cardPoolId}`
        } else {
          gachaLink = `https://aki-gm-resources-oversea.aki-game.net/aki/gacha/index.html#/record??svr_id=${gachaLink.serverId}&player_id=${gachaLink.playerId}&lang=zh-Hans&gacha_id=1&gacha_type=1&svr_area=global&record_id=${gachaLink.recordId}&resources_id=${gachaLink.cardPoolId}`
        }
      } catch (err) {
        kuroLogger.warn('抽卡记录 JSON 格式错误', JSON.stringify(err))
        await e.reply('抽卡记录 JSON 格式错误, 请检查')
        return true
      }
    }
    await e.reply(`抽卡记录链接上传成功, 尝试更新抽卡记录...`)
    await this.updateGachaData(e, gachaLink)
  }

  async mcGachaDataUpdate(e) {
    let user = new userConfig()
    let gameUid = (await user.getCurGameUidLocal(this.e.user_id, 3))?.gameUid
    let gachaLink = await user.getMcGachaDataLink(this.e.user_id, gameUid)
    if (!gachaLink) {
      await e.reply('你暂未上传抽卡记录链接, 请先上传抽卡记录链接')
      return true
    }
    await e.reply(`尝试更新 UID ${gameUid} 的抽卡记录...`)

    await this.updateGachaData(e, gachaLink)
  }

  // 私有的通过抽卡记录链接更新抽卡记录的方法
  async updateGachaData(e, gachaLink) {
    let gacha = new mcGachaData(e)
    let gachaRecord = await gacha.get(gachaLink, e.user_id)
    if (typeof gachaRecord === 'string') {
      e.reply(`抽卡记录更新失败: \n${gachaRecord} \n请检查链接是否正确 `)
      return true
    } else {
      let gachaUpdateRet = await gacha.update(e.user_id, gachaRecord)
      if (typeof gachaUpdateRet === 'string') {
        e.reply(`抽卡记录更新成功但保存失败: \n${gachaUpdateRet}`)
        return true
      } else {
        // TODO: 如果用户绑定的 token 里面没有绑定这个账号的提示
        let msg = '抽卡记录更新成功, 获取到'
        // 遍历 gachaUpdateRet, 提取出每次抽卡的信息, 属性名是卡池名字, 值是数量
        for (let key in gachaUpdateRet) {
          msg += ` ${gachaUpdateRet[key]} 条${key}记录,`
        }
        // 去掉最后一个逗号
        msg = msg.slice(0, -1)
        e.reply(msg)
        return true
      }
    }
  }

  async mcGachaDataExport(e) {
    let gacha = new mcGachaData(e)
    let gachaExportRet = await gacha.export()
    if (typeof gachaExportRet === 'string') {
      await e.reply(`导出失败: \n${gachaExportRet}`)
      return true
    } else {
      let msg = '以上是你的 UIGF 鸣潮抽卡记录, 你可以导入其他支持 UIGF 的工具中使用~'
      await e.reply(msg)
      return true
    }
  }
}
