import { getToken } from './kuroBBSTokenHandler.js'
import { getRandomInt, sleepAsync } from './utils.js'
import kuroApi from './kuroApi.js'

export default class bbsActivityTask {
  constructor(e) {
    this.e = e
  }

  async bbsActivityTask() {
    const tokenData = await getToken(this.e.user_id)
    console.log(tokenData)

    if (tokenData && Object.keys(tokenData).length > 0) {
      const accNum = Object.keys(tokenData).length
      await this.e.reply(
        `QQ ${this.e.user_id} 绑定了 ${accNum} 个 token\n开始活动任务, 稍等一会儿哟...`
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
        `QQ ${this.e.user_id} 暂未绑定 token, 请发送 #库洛验证码登录 绑定 token `
      )
      return false
    }
  }

  async bbsActivityTaskBind() {
    let msg = this.e.msg.replace(/,|，/g, ',')
    .replace(/库街区|库洛|战双|活动/g, '')
    .replace(/#| /g, '')
    .replace(/绑定/g, '服')
    .split('服')

    if (msg.length != 3 || msg[0] == '' || msg[1] == '' || msg[2] == '') {
      this.e.reply('参数不完整')
      return false
    }
    if (!/^\d{8}$/.test(msg[0]) || !/^\d{8}$/.test(msg[2])) {
      this.e.reply('账号格式错误')
      return false
    }
    const tokensData = await getToken(this.e.user_id)
    if (
      !tokensData ||
      !tokensData.hasOwnProperty(msg[0]) ||
      !tokensData[msg[0]].token ||
      tokensData[msg[0]].token == ''
    ) {
      this.e.reply('你并未绑定此库洛帐号, 请确认!')
      return false
    }

    let kuroapi = new kuroApi(this.e.user_id)
    // TODO: 没有活动时的返回处理
    let serverId = 0
    if (msg[1] == '星火') serverId = 1000
    if (msg[1] == '信标') serverId = 1001
    let rsp_activityBindRole = await kuroapi.activityBindRole(msg[0], {gameId: 2, serverId: serverId, roleId: msg[2]})
    if (typeof rsp_activityBindRole == 'string') return this.e.reply(rsp_activityBindRole)
    return this.e.reply(`绑定成功, 发送 #库街区一键活动 试试吧~`)
  }
}

/**
 * 执行单个库洛账号的活动任务, 可以不经构造调用
 * @param {number} uin QQ
 * @param {number} kuro_uid 库洛 ID
 * @returns {string} 可以直接发送的签到结果
 */
export async function doBbsActivityTask(uin, kuro_uid) {
  // TODO: 没有活动时的返回处理
  let kuroapi = new kuroApi(uin)
  let doBbsActivityTaskRet = ''
  // getBindRoleInfo, 没绑定直接返回
  let rsp_getBindRoleInfo = await kuroapi.getBindRoleInfo(kuro_uid)
  logger.mark('rsp_getBindRoleInfo ' + JSON.stringify(rsp_getBindRoleInfo))
  if (rsp_getBindRoleInfo == `token 失效`) return `账号 ${kuro_uid}: \ntoken 失效\n`
  if (typeof rsp_getBindRoleInfo == 'string') return `账号 ${kuro_uid}: \n发生错误: ${rsp_getBindRoleInfo}\n`
  if(!rsp_getBindRoleInfo.data.haveBind) {
    doBbsActivityTaskRet += `账号 ${kuro_uid}: \n未绑定游戏账号, 请前往库街区手动绑定或发送 #库街区活动${kuro_uid}绑定星火服12345678, 其中12345678替换为帐号已绑定的游戏 id, 可用 id : \n`
    let rsp_findRoleList = await kuroapi.findRoleList(kuro_uid, {gameId: 2})
    if(typeof rsp_findRoleList == 'string') {
      doBbsActivityTaskRet += `获取失败: ${rsp_findRoleList}\n`
      return doBbsActivityTaskRet
    }
    if(rsp_findRoleList.data.length == 0) {
      doBbsActivityTaskRet += `暂未绑定任何角色\n`
      return doBbsActivityTaskRet
    }
    for(let roleIndex in rsp_findRoleList.data) {
      let curRole = rsp_findRoleList.data[roleIndex]
      doBbsActivityTaskRet += `${curRole.serverName} - ${curRole.roleName}(${curRole.roleId})\n`
    }
    return doBbsActivityTaskRet
  }
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
      if(curTask.status == 0) {
      // 手动完成特定版本活动任务
      if (curTask.type == 4) { // 帖子浏览任务
        let rsp_getPostDetail = await kuroapi.getPostDetail(kuro_uid, {postId: '1134959614593597440'})
        if (typeof rsp_getPostDetail == 'string') {
          doBbsActivityTaskRet += `完成失败: ${rsp_getPostDetail}\n`
          continue
        }
        curTask.status = 1
      }
      if (curTask.type == 3) { // 关注任务
        // TODO: 自动搜索用户名并关注
        let followUserId = 0
        if(curTask.taskName == '关注赛利卡') followUserId = 10002006
        if(curTask.taskName == '关注战双帕弥什') followUserId = 10001001
        if(!followUserId) {
          doBbsActivityTaskRet += `未完成且暂不可自动完成\n`
          continue
        }
        let rsp_followUser = await kuroapi.followUser(kuro_uid, {followUserId: followUserId, operateType: 1})
        if (typeof rsp_followUser == 'string') {
          doBbsActivityTaskRet += `完成失败: ${rsp_followUser}\n`
          continue
        }
        kuroapi.followUser(kuro_uid, {followUserId: followUserId, operateType: 2}) // 毁尸灭迹
        curTask.status = 1
      }
      }
      if(curTask.status == 0) {
        doBbsActivityTaskRet += curTask.type == 2 ? `未完成\n` : `未完成且不可自动完成\n`
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
      curTask.status = 1
    }

    // 如果任务待领取, 或者刚刚完成了
    if(curTask.status == 1){
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
