import { getToken } from './kuroBBSTokenHandler.js'
import { sleepAsync } from './utils.js'
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
        `QQ ${uin} 绑定了 ${accNum} 个 token\n开始库街区每日, 稍等一会儿哟...`
      )
      let msg = ''
      for (const kuro_uid in tokenData) {
        if (tokenData.hasOwnProperty(kuro_uid)) {
          msg += await doBBSDailyTask(this.e.user_id, kuro_uid)
          msg += '\n'
        } else {
          msg += `账号 ${kuro_uid}: \ntoken 格式错误\n\n`
        }
        await sleepAsync(3000)
      }

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
  // TODO: 先获取任务情况, 如果全都完成就不做了
  doBBSDailyTaskRet += `账号 ${kuro_uid}: \n库洛币: 今日获得{{今日库洛币数量占位符}}, 总{{库洛币总数量占位符}}\n`

  // 每日: 签到x1, 帖子浏览x3, 点赞x5, 分享x1
  let kuroapi = new kuroApi(uin)
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
      // 顺便在这里直接处理 token 失效
      else if (rsp_signIn === 'token 失效')
        return `账号 ${kuro_uid}: \ntoken 失效\n`
      else doBBSDailyTaskRet += `失败: ${rsp_signIn.msg}\n`
      break
    } else await sleepAsync(800)
  } while (tryAgain)

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
      doBBSDailyTaskRet += `获取失败: ${rsp_list.msg}\n论坛点赞: 失败\n` // 直接处理完返回值
      rsp_list = ''
    } else await sleepAsync(300)
  } while (tryAgain)

  if (rsp_list) {
    // 获取到帖子就浏览点赞, 获取不到上面已经返回错误了
    //开始尝试 6 次浏览帖子
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

      await sleepAsync(1000)
    } while (tryAgain)
    doBBSDailyTaskRet += `成功 ${succCount} 次\n论坛点赞: `
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

      if (typeof rsp_like !== 'string') if (++succCount >= 5) break // 成功浏览计数, 够了就返回

      await sleepAsync(1000)
    } while (tryAgain)
    doBBSDailyTaskRet += `成功 ${succCount} 次\n`
  }

  // TODO: 尝试 2 次分享任务
  //

  return doBBSDailyTaskRet
}
