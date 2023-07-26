import { getToken } from './kuroBBSTokenHandler.js'
import { getRandomInt,sleepAsync } from './utils.js'
import kuroApi from './kuroApi.js'

export default class bbsTask {
  constructor(e) {
    this.e = e
  }

  async bbsDailyTask(uin) {
    const tokenData = await getToken(uin)
    console.log(tokenData)

    if (tokenData && Object.keys(tokenData).length > 0) {
      const accNum = Object.keys(tokenData).length
      await this.e.reply(
        `QQ ${uin} 绑定了 ${accNum} 个 token\n开始库街区每日, 预计需要 ${12*accNum}-${35*accNum}s~`
      )
      let startTime = Date.now()
      let msg = ''
      for (const kuro_uid in tokenData) {
        if (tokenData.hasOwnProperty(kuro_uid)) {
          msg += await doBBSDailyTask(this.e.user_id, kuro_uid)
          msg += `\n`
        } else {
          msg += `账号 ${kuro_uid}: \ntoken 格式错误\n\n`
        }
        await sleepAsync(getRandomInt(1000,3000))
      }
      msg += `共用时 ${Math.floor((Date.now() - startTime) / 1000)}s\n`

      await this.e.reply(msg.trimEnd())
      return true
    } else {
      this.e.reply(
        `QQ ${uin} 暂未绑定 token, 请发送 #库洛验证码登录 绑定 token `
      )
      return false
    }
  }
}

/**
 * 执行单个库洛账号的库街区日常, 可以不经构造调用
 * @param {number} uin QQ
 * @param {number} kuro_uid 库洛 ID
 * @returns {string} 可以直接发送的任务结果
 */
export async function doBBSDailyTask(uin, kuro_uid) {
  let doBBSDailyTaskRet = ''
  let kuroapi = new kuroApi(uin)
  // 获取任务进度, 尝试两次
  let rsp_getTaskProcess = await kuroapi.getTaskProcess(kuro_uid)
  logger.mark('rsp_getTaskProcess ' + JSON.stringify(rsp_getTaskProcess))
  if (typeof rsp_getTaskProcess == 'string' || rsp_getTaskProcess.code !== 200)
    rsp_getTaskProcess = await kuroapi.getTaskProcess(kuro_uid)
  if (typeof rsp_getTaskProcess == 'string' || rsp_getTaskProcess.code !== 200)
    if (rsp_getTaskProcess === `token 失效`) return `账号 ${kuro_uid}: \ntoken 失效\n`
    else return `账号 ${kuro_uid}: \n获取任务进度失败: ${rsp_getTaskProcess.msg||rsp_getTaskProcess}\n`
  if(rsp_getTaskProcess.data.currentDailyGold == rsp_getTaskProcess.data.maxDailyGold) {
    // 获取库洛币总数, 尝试两次
    let rsp_getTotalGold = await kuroapi.getTotalGold(kuro_uid)
    logger.mark('rsp_getTotalGold ' + JSON.stringify(rsp_getTotalGold))
    if (typeof rsp_getTotalGold == 'string' || rsp_getTotalGold.code !== 200)
      rsp_getTotalGold = await kuroapi.getTotalGold(kuro_uid)
    if (typeof rsp_getTotalGold == 'string' || rsp_getTotalGold.code !== 200)
      return `账号 ${kuro_uid}: \n今日任务已完成, 获得 ${rsp_getTaskProcess.data.currentDailyGold} 库洛币, 库洛币总数获取失败: ${rsp_getTotalGold.msg||rsp_getTotalGold}\n`
    return `账号 ${kuro_uid}: \n今日任务已完成, 获得 ${rsp_getTaskProcess.data.currentDailyGold} 库洛币, 共 ${rsp_getTotalGold.data.goldNum} 库洛币\n`
  }
    
  doBBSDailyTaskRet += `账号 ${kuro_uid}: \n`

  // 每日: 签到x1, 帖子浏览x3, 点赞x5, 分享x1
  let tryAgain = true
  let tryTimes = 0

  // 开始尝试 3 次社区签到
  doBBSDailyTaskRet += '社区签到: '
  do {
    let rsp_signIn = await kuroapi.signIn(kuro_uid)
    logger.mark('rsp_signIn ' + JSON.stringify(rsp_signIn))

    if (
      tryTimes++ >= 3 ||
      typeof rsp_signIn !== 'string' ||
      rsp_signIn === '您已签到' ||
      rsp_signIn === 'token 失效'
    )
      tryAgain = false

    if (!tryAgain) {
      // 最后一次尝试了那就处理返回值吧
      if (typeof rsp_signIn !== 'string' && rsp_signIn.code === 200)
        doBBSDailyTaskRet += '签到成功\n'
      else if (rsp_signIn === '您已签到') doBBSDailyTaskRet += '今日已签\n'
      else doBBSDailyTaskRet += `失败: ${rsp_signIn.msg||rsp_signIn}\n`
      break
    } else await sleepAsync(getRandomInt(600,1000))
  } while (tryAgain)

  await sleepAsync(getRandomInt(1000,3000))
  doBBSDailyTaskRet += '帖子浏览: '
  // 开始尝试 2 次取帖子列表, 获取不到就不浏览和点赞
  tryAgain = true
  tryTimes = 0
  let rsp_list = ''
  do {
    rsp_list = await kuroapi.list(kuro_uid, { forumId: 2, gameId: 2 }) // 默认获取推荐板块
    logger.mark('rsp_list ' + JSON.stringify(rsp_list))

    if (tryTimes++ >= 2 || typeof rsp_list !== 'string') tryAgain = false

    if (!tryAgain) {
      if (typeof rsp_list !== 'string' && rsp_list.code === 200) break
      doBBSDailyTaskRet += `获取失败: ${rsp_list.msg||rsp_list}\n论坛点赞: 已取消\n` // 直接处理完返回值
      rsp_list = ''
    } else await sleepAsync(getRandomInt(200,400))
  } while (tryAgain)

  if (rsp_list) {
    await sleepAsync(getRandomInt(500,2000))
    // 获取到帖子就浏览点赞, 获取不到上面已经返回错误了
    // 开始尝试 6 次浏览帖子
    tryAgain = true
    tryTimes = 0
    let succCount = 0
    do {
      let rsp_getPostDetail = await kuroapi.getPostDetail(kuro_uid, {
        postId: rsp_list.data.postList[tryTimes].postId,
      })
      logger.mark('rsp_getPostDetail ' + JSON.stringify(rsp_getPostDetail))

      if (tryTimes++ >= 6) tryAgain = false

      if (typeof rsp_getPostDetail !== 'string') if (++succCount >= 3) break // 成功浏览计数, 够了就返回

      if (tryAgain) await sleepAsync(getRandomInt(500,2000))
    } while (tryAgain)
    doBBSDailyTaskRet += `成功 ${succCount} 次\n论坛点赞: `
    await sleepAsync(getRandomInt(500,2000))
    // 开始尝试 10 次点赞
    tryAgain = true
    tryTimes = 0
    succCount = 0
    do {
      let rsp_like = await kuroapi.like(kuro_uid, {
        forumId: 2,
        gameId: 2,
        likeType: 1,
        operateType: 1,
        postCommentId: 0,
        postCommentReplyId: 0,
        postId: rsp_list.data.postList[tryTimes].postId,
        postType: rsp_list.data.postList[tryTimes].postType,
        toUserId: rsp_list.data.postList[tryTimes].userId,
      })
      logger.mark('rsp_like ' + JSON.stringify(rsp_like))

      if (tryTimes++ >= 10) tryAgain = false

      if (typeof rsp_like !== 'string') if (++succCount >= 5) break // 成功点赞计数, 够了就返回

      if (tryAgain) await sleepAsync(getRandomInt(500,2000))
    } while (tryAgain)
    doBBSDailyTaskRet += `成功 ${succCount} 次\n`
  }

  doBBSDailyTaskRet += `分享帖子: `
  await sleepAsync(getRandomInt(500,2000))
  // 开始尝试 2 次分享
  tryAgain = true
  tryTimes = 0
  do {
    let rsp_shareTask = await kuroapi.shareTask(kuro_uid)
    logger.mark('rsp_shareTask ' + JSON.stringify(rsp_shareTask))

    if (tryTimes++ >= 2 || typeof rsp_like !== 'string') tryAgain = false

    if (!tryAgain){
      if (typeof rsp_shareTask !== 'string' && rsp_shareTask.code == 200) doBBSDailyTaskRet += `成功\n`
      else doBBSDailyTaskRet += `失败: ${rsp_shareTask.msg||rsp_shareTask}\n`
    } else await sleepAsync(getRandomInt(500,2000))
  } while (tryAgain)

  // 获取库洛币详情
  // `本次获得 80 库洛币, (今日还可获得 0 库洛币), 共 {{库洛币总数}} 库洛币\n`
  // 
  // 获取任务进度, 尝试两次
  rsp_getTaskProcess = await kuroapi.getTaskProcess(kuro_uid)
  logger.mark('rsp_getTaskProcess ' + JSON.stringify(rsp_getTaskProcess))
  if (typeof rsp_getTaskProcess == 'string' || rsp_getTaskProcess.code !== 200)
    rsp_getTaskProcess = await kuroapi.getTaskProcess(kuro_uid)
  if (typeof rsp_getTaskProcess == 'string' || rsp_getTaskProcess.code !== 200)
    doBBSDailyTaskRet += `获取今日任务进度失败: ${rsp_getTaskProcess.msg||rsp_getTaskProcess}, `
  else
    doBBSDailyTaskRet += `本次获得 ${rsp_getTaskProcess.data.currentDailyGold} 库洛币, ` + (rsp_getTaskProcess.data.currentDailyGold !== rsp_getTaskProcess.data.maxDailyGold ? `今日还可获得 ${rsp_getTaskProcess.data.maxDailyGold - rsp_getTaskProcess.data.currentDailyGold} 库洛币, ` : '今日任务已完成, ')
  if(rsp_getTaskProcess.data.currentDailyGold == rsp_getTaskProcess.data.maxDailyGold) {}
  // 获取库洛币总数
  let rsp_getTotalGold = await kuroapi.getTotalGold(kuro_uid)
  if (typeof rsp_getTotalGold == 'string' || rsp_getTotalGold.code !== 200)
    rsp_getTotalGold = await kuroapi.getTotalGold(kuro_uid)
  if (typeof rsp_getTotalGold == 'string' || rsp_getTotalGold.code !== 200)
  // doBBSDailyTaskRet = doBBSDailyTaskRet.replace('{{库洛币详情占位符}}', `本次获得`)
  doBBSDailyTaskRet += (rsp_getTotalGold.data.goldNum ? `共 ${rsp_getTotalGold.data.goldNum} 库洛币\n` : `库洛币总数获取失败: ${rsp_getTotalGold.msg||rsp_getTotalGold}\n`)

  return doBBSDailyTaskRet
}
