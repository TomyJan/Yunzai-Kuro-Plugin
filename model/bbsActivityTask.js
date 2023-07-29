import { getToken } from './kuroBBSTokenHandler.js'
import { getRandomInt, sleepAsync } from './utils.js'
import kuroApi from './kuroApi.js'

export default class bbsActivityTask {
  constructor(e) {
    this.e = e
  }

  async bbsActivityTask(uin) {
    const tokenData = await getToken(uin)
    console.log(tokenData)

    if (tokenData && Object.keys(tokenData).length > 0) {
      const accNum = Object.keys(tokenData).length
      await this.e.reply(
        `QQ ${uin} 绑定了 ${accNum} 个 token\n开始活动任务, 稍等一会儿哟...`
      )
      let startTime = Date.now()
      let msg = ''
      for (const kuro_uid in tokenData) {
        if (tokenData.hasOwnProperty(kuro_uid)) {
          msg += await doBbsActivityTask(this.e.user_id, kuro_uid)
          msg += `\n`
        } else {
          msg += `账号 ${kuro_uid}: \ntoken 格式错误\n\n`
        }
        await sleepAsync(getRandomInt(1000, 3000))
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
 * 执行单个库洛账号的活动任务, 可以不经构造调用
 * @param {number} uin QQ
 * @param {number} kuro_uid 库洛 ID
 * @returns {string} 可以直接发送的签到结果
 */
export async function doBbsActivityTask(uin, kuro_uid) {
  let kuroapi = new kuroApi(uin)
  let doBbsActivityTaskRet = ''
  // getBindRoleInfo, 没绑定直接返回
  let rsp_getBindRoleInfo = await kuroapi.getBindRoleInfo(kuro_uid)
  logger.mark('rsp_getBindRoleInfo ' + JSON.stringify(rsp_getBindRoleInfo))
  if (rsp_getBindRoleInfo == `token 失效`) return `账号 ${kuro_uid}: \ntoken 失效\n`
  if (typeof rsp_getBindRoleInfo == 'string') return `账号 ${kuro_uid}: \n发生错误: ${rsp_getBindRoleInfo}\n`
  if(!rsp_getBindRoleInfo.data.haveBind) return `账号 ${kuro_uid}: \n未绑定游戏账号, 请先前往库街区手动绑定\n` // TODO: 暂时没抓绑定账号的 API, 或许会去实现这个
  doBbsActivityTaskRet += `账号 ${kuro_uid}: \n绑定角色: ${rsp_getBindRoleInfo.data.serverName} - ${rsp_getBindRoleInfo.data.roleName}(${rsp_getBindRoleInfo.data.roleId})\n`

  // getList 取活动列表, 成功了根据任务的 status 执行完成和领取
  let rsp_getActivityTaskList = await kuroapi.getActivityTaskList(kuro_uid)
  logger.mark('rsp_getActivityTaskList ' + JSON.stringify(rsp_getActivityTaskList))
  if(typeof rsp_getActivityTaskList == 'string') {
    doBbsActivityTaskRet += `获取任务列表失败: ${rsp_getActivityTaskList}\n`
    return doBbsActivityTaskRet
  }
  for(let taskIndex in rsp_getActivityTaskList.data.taskList) {
    let curTask = rsp_getActivityTaskList.data.taskList[taskIndex]
    doBbsActivityTaskRet += curTask.taskName + ': '
    
    let rsp_completeActivityTask = ''
    if([2, 3, 4].includes(curTask.type)) {
      // 不可以自动做的任务类型
      // TODO: 3 和 4 的自动完成
      if(curTask.status == 0) {
        doBbsActivityTaskRet += `未完成且不可自动完成\n`
        continue
      }

    } else if(curTask.status == 0) {
      // 可以自动做, 且还未完成的任务
      rsp_completeActivityTask = await kuroapi.completeActivityTask(kuro_uid, {taskId: curTask.taskId})
      if(typeof rsp_completeActivityTask == 'string') {
        doBbsActivityTaskRet += `完成失败: ${rsp_completeActivityTask}\n`
        continue
      }
      doBbsActivityTaskRet += `完成成功, `
    }

    // 如果任务待领取, 或者刚刚完成了
    if(curTask.status == 1 || typeof rsp_completeActivityTask !== 'string'){
      let rsp_receiveActivityTask = await kuroapi.receiveActivityTask(kuro_uid, {taskId: curTask.taskId})
      if(typeof rsp_receiveActivityTask == 'string') {
        doBbsActivityTaskRet += `领取失败: ${rsp_receiveActivityTask}\n`
        continue
      }
      doBbsActivityTaskRet += `领取成功\n`
    }

    // 任务领取过了
    if(curTask.status == 2) doBbsActivityTaskRet += `已领取\n`
  }

  // 取任务列表
  // 里程碑, 满足就领不满足就返回
  //
  //
  //
  return doBbsActivityTaskRet

}
