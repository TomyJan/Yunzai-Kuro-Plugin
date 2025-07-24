import kuroLogger from '../components/logger.js'
import kuroApi from './kuroApi.js'
import common from '../../../lib/common/common.js'

export default class PnnTownActivity {
  constructor(e) {
    this.e = e
    this.init()
    // 消息提示以及风险警告
    this.pnnTownActivityTip =
      '免责声明: \n您将通过短信验证码登录快速完成 帕尼尼小镇 活动任务.  \n本 Bot 不会保存您的任何数据 \n我方仅提供本活动的快速完成, 您的账号被封禁, 被盗等, 与我方无关 \n\n继续登录即为您阅读并同意以上条款! '
  }

  async init() {}

  async pnnTownHelp() {
    let pnnTownHelpMsg = await common.makeForwardMsg(
      this.e,
      [
        '[库洛插件] 帕尼尼小镇活动任务帮助',
        this.pnnTownActivityTip,
        '======== 活动任务帮助 ========',
        '涉及敏感信息, 请私聊使用!',
        '1. 给 Bot 私聊发送你的手机号以发送验证码 \n格式: 帕尼尼小镇发送18888888888',
        '2. 收到验证码后, 再次给 Bot 私聊发送手机号和相应验证码 \n格式: 帕尼尼小镇18888888888,验证码114514',
        '3. Bot 使用正确的验证码登录后, 将开始自动完成活动任务, 抽奖后返回奖品信息和兑换码',
      ],
      '[库洛插件] 帕尼尼小镇活动任务帮助',
    )
    await this.e.reply(pnnTownHelpMsg)
    return true
  }

  async pnnTownSendCode() {
    let msg = this.e.msg
      .replace(/帕尼尼小镇|：|:|一键|活动|任务|发送|账号|手机号/g, '')
      .replace(/,|，/g, ',')
      .replace(/#| /g, '')
    if (msg.length != 11 || msg == '') {
      this.e.reply('参数不完整')
      return false
    }
    if (!this.isPhoneNumber(msg)) {
      this.e.reply('手机号格式错误')
      return false
    }
    let pnnAct = new kuroApi(this.e.user_id)
    let rspSendCode = await pnnAct.pnnTownActSendCode(msg)
    kuroLogger.debug('rspSendCode:', JSON.stringify(rspSendCode))
    if (typeof rspSendCode == 'string') {
      // 不是 json, 即返回报错
      this.e.reply(`发送验证码失败, 活动页返回: \n${rspSendCode}`)
      return false
    }
    this.e.reply(
      '验证码发送成功, 请再次发送手机号和验证码, 以完成登录 \n格式: 帕尼尼小镇18888888888,验证码114514',
    )
    return true
  }

  async pnnTownDo() {
    let msg = this.e.msg
      .replace(
        /帕尼尼小镇|：|:|一键|活动|任务|登录|登陆|账号|手机号|验证码/g,
        '',
      )
      .replace(/,|，/g, ',')
      .replace(/#| /g, '')
      .split(',')
    if (msg.length !== 2 || msg[0] == '' || msg[1] == '') {
      this.e.reply('参数不完整')
      return false
    }
    if (!this.isPhoneNumber(msg[0])) {
      this.e.reply('手机号格式错误')
      return false
    }
    if (!/^\d{6}$/.test(msg[1])) {
      this.e.reply('验证码格式错误')
      return false
    }
    let pnnAct = new kuroApi(this.e.user_id)
    let rspPnsTownLogin = await pnnAct.pnnTownActLogin(msg[0], msg[1])
    kuroLogger.debug('rspPnsTownLogin:', JSON.stringify(rspPnsTownLogin))
    if (typeof rspPnsTownLogin == 'string') {
      // 不是 json, 即返回报错
      this.e.reply(`登录失败, 活动页返回: \n${rspPnsTownLogin}`)
      return false
    }
    if (!rspPnsTownLogin.data.token || rspPnsTownLogin.data.token == '') {
      this.e.reply(
        '登录失败: 未知错误, 取消任务. 活动页返回: \n' +
          JSON.stringify(rspPnsTownLogin),
      )
      return false
    }
    const token = rspPnsTownLogin.data.token
    this.e.reply('登录成功, 开始查询任务进度')
    // 先查询一次任务进度
    let rspPnsTownUserInfo = await pnnAct.pnnTownActUserInfo(token)
    kuroLogger.debug('rspPnsTownUserInfo:', JSON.stringify(rspPnsTownUserInfo))
    if (typeof rspPnsTownUserInfo == 'string') {
      // 不是 json, 即返回报错
      this.e.reply(
        `查询任务进度失败, 取消任务. 活动页返回: \n${rspPnsTownUserInfo}`,
      )
      return false
    }

    if (
      rspPnsTownUserInfo?.data?.num == undefined ||
      rspPnsTownUserInfo?.data?.chance_num == undefined
    ) {
      this.e.reply(
        '查询任务进度失败: 未知错误, 取消任务. 活动页返回: \n' +
          JSON.stringify(rspPnsTownUserInfo),
      )
      return false
    }
    let taskNum = rspPnsTownUserInfo?.data?.num
    let chanceRemain = rspPnsTownUserInfo?.data?.chance_num
    this.e.reply(
      `查询任务进度成功, 当前${
        taskNum > 0
          ? taskNum == 20
            ? '已完成所有任务, 跳过自动任务'
            : `已完成 ${taskNum} 个任务, 开始继续自动任务`
          : '未完成任何任务, 开始自动任务'
      }`,
    )
    let continueTask = true
    if (taskNum == 20) {
      continueTask = false
    }
    // 做任务
    if (continueTask) {
      // 直接简单粗暴做完所有任务, 间隔 100-200ms
      for (let i = 1; i < 19; i++) {
        let rsp = await pnnAct.pnnTownActCollectEgg(token, i)
        kuroLogger.debug('rsp_pnnTownActCollectEgg:', JSON.stringify(rsp))
        if (typeof rsp == 'string') {
          // 不是 json, 日志报错就行
          kuroLogger.warn(
            `用户 ${this.e.user_id} 手机号 ${
              msg[0]
            } 帕尼尼小镇在第 ${i} 个蛋时出错, 接口返回: ${JSON.stringify(
              rsp,
            )} , 重试一次`,
          )
          rsp = await pnnAct.pnnTownActCollectEgg(token, i)
          kuroLogger.debug(
            'rsp_pnnTownActCollectEgg_retry:',
            JSON.stringify(rsp),
          )
          if (typeof rsp == 'string') {
            kuroLogger.error(
              `用户 ${this.e.user_id} 手机号 ${
                msg[0]
              } 帕尼尼小镇在第 ${i} 个蛋时出错, 接口返回: ${JSON.stringify(
                rsp,
              )}, 重试失败, 跳过这个蛋`,
            )
            this.e.reply(
              `收集第 ${i} 个蛋出错, 将跳过这个蛋. 活动页返回: \n ${JSON.stringify(
                rsp,
              )}`,
            )
          }
        }
        await new Promise((resolve) =>
          setTimeout(resolve, Math.floor(Math.random() * 100 + 100)),
        )
      }
      // 还有个分享任务
      let rspShare = await pnnAct.pnnTownActShare(token)
      kuroLogger.debug('rsp_pnnTownActShare:', JSON.stringify(rspShare))
      if (typeof rspShare == 'string') {
        // 不是 json, 重试一次
        kuroLogger.warn(
          `用户 ${this.e.user_id} 手机号 ${
            msg[0]
          } 帕尼尼小镇分享任务出错, 接口返回: ${JSON.stringify(
            rspShare,
          )} , 重试一次`,
        )
        rspShare = await pnnAct.pnnTownActShare(token)
        kuroLogger.debug('rsp_pnnTownActShare_retry:', JSON.stringify(rspShare))
        if (typeof rspShare == 'string') {
          kuroLogger.error(
            `用户 ${this.e.user_id} 手机号 ${
              msg[0]
            } 帕尼尼小镇分享任务出错, 接口返回: ${JSON.stringify(
              rspShare,
            )}, 重试失败, 跳过这个任务`,
          )
          this.e.reply('分享任务出错, 跳过此任务. 活动页返回: \n' + rspShare)
        }
      }
      this.e.reply('任务已完成, 开始抽奖')
    }

    // 抽奖前再次获取用户信息
    continueTask = false
    rspPnsTownUserInfo = await pnnAct.pnnTownActUserInfo(token)
    kuroLogger.debug('rspPnsTownUserInfo:', JSON.stringify(rspPnsTownUserInfo))
    if (typeof rspPnsTownUserInfo == 'string') {
      // 不是 json, 即返回报错
      this.e.reply(
        `查询任务进度失败, 取消抽奖. 活动页返回: \n${rspPnsTownUserInfo}`,
      )
    } else {
      chanceRemain = rspPnsTownUserInfo?.data?.chance_num
      continueTask = chanceRemain > 0
      this.e.reply(
        `当前${
          continueTask
            ? `剩余 ${chanceRemain} 次抽奖机会, 开始抽奖`
            : '抽奖机会已用完, 跳过抽奖, 开始查询奖品'
        }`,
      )
    }

    if (continueTask) {
      for (let i = 1; i < chanceRemain + 4; i++) {
        // 多抽几次, 防止出错
        let type = 1
        if (chanceRemain > 10 && i < 10) {
          // 如果剩余十次以上, 先来一发十连
          type = 2
          i = 10
        }
        let rsp = await pnnAct.pnnTownActDraw(token, type)
        kuroLogger.debug('rsp_pnnTownActDraw:', JSON.stringify(rsp))
        if (typeof rsp == 'string') {
          // 不是 json, 日志报错就行
          kuroLogger.warn(
            `用户 ${this.e.user_id} 手机号 ${msg[0]} 帕尼尼小镇第 ${i}/${
              chanceRemain + 4
            } 次抽奖时出错, 接口返回: ${JSON.stringify(rsp)}`,
          )
        }
        await new Promise((resolve) =>
          setTimeout(resolve, Math.floor(Math.random() * 100 + 100)),
        )
      }
      this.e.reply('抽奖已完成, 开始查询奖品')
    }
    // 查询奖品并发送
    let rspPrize = await pnnAct.pnnTownActPrize(token)
    kuroLogger.debug('rsp_pnnTownActPrize:', JSON.stringify(rspPrize))
    if (typeof rspPrize == 'string') {
      // 不是 json, 再试一次
      rspPrize = await pnnAct.pnnTownActPrize(token)
      kuroLogger.debug('rsp_pnnTownActPrize_retry:', JSON.stringify(rspPrize))
      if (typeof rspPrize == 'string') {
        this.e.reply('查询奖品失败, 活动页返回: \n' + rspPrize)
        return false
      }
    }
    // 遍历取出 data 数组下的所有奖品
    let prizeList = []
    for (let i = 0; i < rspPrize.data.length; i++) {
      prizeList.push({
        name: rspPrize.data[i].item_name,
        type: rspPrize.data[i].type_ename,
        code: rspPrize.data[i].code,
      })
    }
    // 从 prizeList 中按照 type 是否为 cdkey 分类
    let cdKeyList = []
    let otherList = []
    for (let i = 0; i < prizeList.length; i++) {
      if (prizeList[i].type == 'cdkey') {
        cdKeyList.push(prizeList[i])
      } else {
        otherList.push(prizeList[i])
      }
    }
    // 生成消息
    let priceMsgs = ['[库洛插件] 帕尼尼小镇 奖品信息']
    if (otherList.length > 0) {
      priceMsgs.push(
        `这就是首席的实力! 你居然抽到了 ${otherList.length} 个蚊子腿以外的东西! 快看看有什么吧~`,
      )
      for (let i = 0; i < otherList.length; i++) {
        priceMsgs.push(`${otherList[i].name}`)
      }
      priceMsgs.push('别忘了填收货地址喔~')
    }
    if (cdKeyList.length > 0) {
      priceMsgs.push(`平淡的一天, ${cdKeyList.length} 个蚊子腿也是肉~`)
      for (let i = 0; i < cdKeyList.length; i++) {
        priceMsgs.push(`${cdKeyList[i].code}`)
      }
      priceMsgs.push('快去兑换吧~')
    }
    let forwardMsg = await common.makeForwardMsg(
      this.e,
      priceMsgs,
      '[库洛插件] 帕尼尼小镇 奖品信息',
    )
    this.e.reply(forwardMsg)
  }

  isPhoneNumber(str) {
    const pattern = /^1[3456789]\d{9}$/
    return pattern.test(str)
  }
}
