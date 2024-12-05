import mcGachaData from '../model/mcGachaData.js'
import plugin from '../../../lib/plugins/plugin.js'
import md5 from 'md5'
import puppeteer from '../../../lib/puppeteer/puppeteer.js'
import mcGachaCard from '../model/mcGachaCard.js'
import kuroLogger from '../components/logger.js'
import userConfig from '../model/userConfig.js'
import { mcGachaType } from '../data/system/pluginConstants.js'
import common from '../../../lib/common/common.js'
import { updateCardBg } from '../model/utils.js'

export class mcGachaApp extends plugin {
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
        {
          reg: '^#?鸣潮导入(抽卡|唤取)+(记录)?$',
          fnc: 'mcGachaDataImport',
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
        .replace(/鸣潮|记录|抽卡|卡池|唤取|分析|池/g, '')
      let gachaType = 1
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
          break
        case '武器':
        case '武器活动':
        case '活动武器':
        case '武器限定':
        case '限定武器':
        case '武器up':
        case 'up武器':
          gachaType = 2
          break
        case '常驻':
        case '角色常驻':
        case '常驻角色':
          gachaType = 3
          break
        case '武器常驻':
        case '常驻武器':
          gachaType = 4
          break
        case '新手':
          gachaType = 5
          break
        case '新手自选':
        case '自选':
          gachaType = 6
          break
        default:
          gachaType = 1
      }
      let data = await mcGachaCard.get(
        this.e,
        gachaType,
        mcGachaType[gachaType]
      )
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
    if (mcGachaApp.mcGachaCardData.md5 === tmp) {
      return mcGachaApp.mcGachaCardData.img
    }

    updateCardBg()
    mcGachaApp.mcGachaCardData.img = await puppeteer.screenshot(
      'mcGachaRecord',
      data
    )
    mcGachaApp.mcGachaCardData.md5 = tmp

    return mcGachaApp.mcGachaCardData.img
  }

  static mcGachaCardData = {
    md5: '',
    img: '',
  }

  async mcGachaHelp(e) {
    let mcGachaHelpMsg = await common.makeForwardMsg(
      e,
      [
        '[库洛插件] 鸣潮抽卡记录获取帮助',
        '继续获取并发送即表示您阅读并同意 Bot 保存你的抽卡记录信息用于后续自动更新',
        '建议私聊发送哦~',
        '需要注意的是, 自1.2版本开始, 以往抽卡链接全部失效, 新的链接也只有很短的有效期了😔',
        '======== Windows ========',
        '快速获取: \n1. 前往下载此工具 https://wavetools.jamsg.cn/ \n2. 打开游戏进入一次抽卡界面后, 点击工具的 抽卡记录-获取抽卡记录-复制URL',
        '手动获取: \n1. 在游戏内打开一次抽卡记录 \n2. 打开文件资源管理器, 定位到 游戏安装目录\\Client\\Saved\\Logs\\, 打开Client.log \n3. 在文件内搜索 record_id , 将找到的链接发送给我, 注意删除多余的文字 \n\n你发送的链接格式格式应为: \nhttps://aki-gm-resources.aki-game.com/aki/gacha/index.html#/record?svr_id=TomyJan&player_id=101812955&lang=zh-Hans&gacha_id=1&gacha_type=1&svr_area=cn&record_id=TomyJan&resources_id=TomyJan \n国际服格式: \nhttps://aki-gm-resources-oversea.aki-game.net/aki/gacha/index.html#/record?svr_id=TomyJan&player_id=101812955&lang=zh-Hans&gacha_id=1&gacha_type=1&svr_area=global&record_id=TomyJan&resources_id=TomyJan',
        '======== Android ========',
        '1. 在游戏内打开一次抽卡记录 \n2. 打开文件管理器, 定位到 内部存储/Android/data/, 国服进入 com.kurogame.mingchao, 国际服进入 com.kurogame.wutheringwaves.global, 并继续定位到 /files/UE4Game/Client/Client/Saved/Logs/, 打开 Client.log \n3. 在文件内搜索 record_id , 将找到的链接发送给我, 注意删除多余的文字 \n\n你发送的链接格式格式应为: \nhttps://aki-gm-resources.aki-game.com/aki/gacha/index.html#/record?svr_id=TomyJan&player_id=101812955&lang=zh-Hans&gacha_id=1&gacha_type=1&svr_area=cn&record_id=TomyJan&resources_id=TomyJan \n国际服格式: \nhttps://aki-gm-resources-oversea.aki-game.net/aki/gacha/index.html#/record?svr_id=TomyJan&player_id=101812955&lang=zh-Hans&gacha_id=1&gacha_type=1&svr_area=global&record_id=TomyJan&resources_id=TomyJan',
        '========== iOS ==========',
        '参照此教程抓包获取并发给我即可: https://blog.tomys.top/2023-07/kuro-token/#iOS \n\n你发送的内容格式应为: \n{ \n  "recordId": "TomyJan", \n  "playerId": "101812955", \n  "serverId": "TomyJan", \n  "cardPoolId": "TomyJan", \n  "cardPoolType": 1, \n  "languageCode": "zh-Hans" \n}',
      ],
      '[库洛插件] 鸣潮抽卡记录获取帮助'
    )
    e.reply(mcGachaHelpMsg)
    return true
  }

  async mcGachaHelpLocalGet(e) {
    // 该方法已经失效
    e.reply(
      '该方法已失效, 请使用 #鸣潮抽卡帮助 ~ \n(没错, 小丑开发者写了一下午, 都基本写完了, 才发现库洛把这玩意修了)'
    )
    return true
  }

  async mcGachaHelpUrlGet(e) {
    e.reply(`请使用 #鸣潮抽卡帮助 ~`)
    return true
  }

  async mcGachaLinkUpload(e) {
    let gachaLink = this.e.msg
      .replace(/#/g, '')
      .replace(/\s/g, '')
      .replace('index.html/record', 'index.html#/record')
    if (
      !gachaLink.startsWith(
        'https://aki-gm-resources.aki-game.com/aki/gacha/index.html#/record'
      ) &&
      !gachaLink.startsWith(
        'https://aki-gm-resources-oversea.aki-game.net/aki/gacha/index.html#/record'
      )
    ) {
      // 上传了 json, 校验并转换为链接
      try {
        JSON.parse(gachaLink)
        // 检查字段是否缺失
        if (
          !gachaLink.recordId ||
          !gachaLink.playerId ||
          !gachaLink.serverId ||
          !gachaLink.cardPoolId ||
          !gachaLink.serverId
        ) {
          await e.reply('抽卡记录 JSON 字段缺失, 请检查')
        }
        if (
          !/^[a-zA-Z0-9]{32}$/.test(gachaLink.recordId) ||
          !/^[1-9]\d{8}$/.test(gachaLink.playerId) ||
          !/^[a-zA-Z0-9]{32}$/.test(gachaLink.serverId) ||
          !/^[a-zA-Z0-9]{32}$/.test(gachaLink.cardPoolId) ||
          !/^[a-zA-Z0-9]{32}$/.test(gachaLink.serverId)
        ) {
          await e.reply('抽卡记录 JSON 字段格式错误, 请检查')
          return true
        }
        // 转换为链接
        if (gachaLink.serverId === '76402e5b20be2c39f095a152090afddc') {
          // 国服
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
      if (gachaRecord == 'ERROR_NO_NEWER_RECORD') {
        e.reply(`未获取到更新的抽卡记录, 晚点再来试试吧~`)
        return true
      }
      e.reply(`抽卡记录更新失败: \n${gachaRecord} \n请检查链接是否正确 `)
      return true
    } else {
      let gachaUpdateRet = await gacha.update(e.user_id, gachaRecord)
      if (typeof gachaUpdateRet === 'string') {
        e.reply(`抽卡记录更新成功但保存失败: \n${gachaUpdateRet}`)
        return true
      } else {
        // TODO: 如果用户绑定的 token 里面没有绑定这个账号的提示
        let msg = '鸣潮抽卡记录更新成功, 获取到: \n'
        // 遍历 gachaUpdateRet, 提取出每次抽卡的信息, 属性名是卡池名字, 值是数量
        for (let key in gachaUpdateRet) {
          msg += `  ${key}记录: ${gachaUpdateRet[key]} 条\n`
        }
        // 去掉最后一个换行符
        msg = msg.slice(0, -1)
        let forWardMsg = await common.makeForwardMsg(
          e,
          [
            msg,
            '获取抽卡记录可以使用 \n  #鸣潮角色记录 \n  #鸣潮武器记录 \n  #鸣潮常驻角色记录',
            '后续每次获取记录都会自动更新, 无需手动更新哦~',
            '当然, 你也可以手动更新, 使用 \n  #鸣潮更新抽卡',
            '导出抽卡记录使用 \n  #鸣潮导出抽卡 \n导出的记录为 WWGF 格式, 可以导入其他支持 WWGF 的工具中使用~',
          ],
          '[库洛插件] 鸣潮抽卡记录更新结果'
        )
        e.reply(forWardMsg)
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
      let msg =
        '以上是你的 WWGF 鸣潮抽卡记录, 你可以导入其他支持 WWGF 的工具中使用~'
      await e.reply(msg)
      return true
    }
  }

  async mcGachaDataImport(e) {
    e.reply('绝赞监修中~')
  }
}
