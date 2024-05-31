import mcGachaData from '../model/mcGachaData.js'
import plugin from '../../../lib/plugins/plugin.js'

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
          reg: '^#?鸣潮(抽卡|角色|up|抽奖|角色活动|角色up|武器|武器活动|武器up|常驻|角色常驻|武器常驻|新手|新手自选|自选)+池?(记录|唤取|分析)$',
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
          reg: '^#?鸣潮上传抽卡记录链接$',
          fnc: 'mcGachaHelpUrlGet',
        },
        {
          reg: '^#?https://aki-gm-resources.aki-game.com/aki/gacha/index.html#/record(.*)$',
          fnc: 'mcGachaLinkUpload',
        },
      ],
    })
  }

  async mcGachaDataShow(e) {
    let gacha = new mcGachaData(e)
    await gacha.show()
    return true
  }

  async mcGachaHelp(e) {
    e.reply(
      `可通过以下两种方式获取抽卡记录: 
      #鸣潮本地获取抽卡记录
       - 在本地访问链接获取抽卡记录, 快速但是无法自动更新
      #鸣潮上传抽卡记录链接
       - 通过日志中的抽卡记录链接上传, 繁琐但是一次获取长期有效
      请发送相应指令查看帮助` // 抽卡链接有效期
    )
    return true
  }

  async mcGachaHelpLocalGet(e) {
    // TODO: 生成获取抽卡记录的链接
    e.reply('前方施工中~')
    return true
    let getGachaRecordUrl = 'https://www.vov.moe'
    e.reply(
      `请在游戏内打开一次抽卡记录后, 使用相同的网络点击 ${getGachaRecordUrl} 输入游戏 uid 进行上传`
    )
    return true
  }

  async mcGachaHelpUrlGet(e) {
    e.reply(
      `请在游戏内打开一次抽卡记录, 然后从以下目录打开日志文件: 
      Win 设备: 游戏安装目录\\Client\\Saved\\Logs\\Client.log
      Android 设备: 内部存储/Android/data/com.kurogame.mingchao/files/UE4Game/Client/Client/Saved/Logs/Client.log
      在文件内搜索 record_id , 将找到的链接发送给我即可. 
      注意删除多余字符, 你发送的链接应该是以下格式: 
      https://aki-gm-resources.aki-game.com/aki/gacha/index.html#/record?svr_id=TomyJan&player_id=101812955&lang=zh-Hans&gacha_id=1&gacha_type=1&svr_area=cn&record_id=TomyJan&resources_id=TomyJan`
    )
    return true
  }

  async mcGachaLinkUpload(e) {
    e.reply(`抽卡记录链接上传成功, 尝试更新抽卡记录...`)
    let gacha = new mcGachaData(e)
    let gachaRecord = await gacha.get(e.msg, e.user_id)
    if (typeof gachaRecord === 'string') {
      e.reply(`抽卡记录更新失败: \n${gachaRecord}`)
      return true
    } else {
      let failedReason = await gacha.update(e.user_id, gachaRecord)
      if (failedReason) {
        e.reply(`抽卡记录更新成功但保存失败: \n${failedReason}`)
        return true
      } else {
        // TODO: 如果用户绑定的 token 里面没有绑定这个账号的提示, 以及抽卡总体数据的展示
        e.reply(`抽卡记录更新成功, 获取到 x 条 xx 记录`)
        return true
      }
    }
  }
}
