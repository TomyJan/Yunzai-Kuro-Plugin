import _ from 'lodash'

export async function sleepAsync(sleepms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, sleepms)
  })
}

/**
 * 发送好友消息
 * @param QQ QQ号
 * @param msg 消息
 */
export async function sendMsgFriend(uin, msg) {
  uin = Number(uin)
  let friend = Bot.fl.get(uin)
  if (friend) {
    logger.mark(`发送好友消息[${friend.nickname}](${uin})`)
    return await Bot.pickUser(uin)
      .sendMsg(msg)
      .catch((err) => {
        logger.mark(err)
      })
  } else {
    logger.mark(`${uin} 非好友, 无法推送签到消息`)
  }
}

/**
 * 发送转发消息
 * @param e 事件对象
 * @param message 消息数组
 */
export async function sendForwardMsg(e, message, {
  recallMsg = 0,
  info,
  fkmsg,
  isxml,
  xmlTitle,
  oneMsg,
  anony
} = {}) {
  let forwardMsg = []
  if (_.isEmpty(message)) throw Error('[库洛插件] 合并转发: 发送的转发消息不能为空')
  let add = (msg) => forwardMsg.push(
    {
      message: msg,
      nickname: info?.nickname ?? (e.bot ?? Bot).nickname,
      user_id: info?.user_id ?? (e.bot ?? Bot).uin
    }
  )
  oneMsg ? add(message) : message.forEach(item => add(item))
  // 发送
  if (e.isGroup) {
    forwardMsg = await e.group.makeForwardMsg(forwardMsg)
  } else {
    forwardMsg = await e.friend.makeForwardMsg(forwardMsg)
  }
  if (isxml) {
    // 处理转发卡片
    forwardMsg.data = forwardMsg.data.replace('<?xml version="1.0" encoding="utf-8"?>', '<?xml version="1.0" encoding="utf-8" ?>')
  }
  if (xmlTitle) {
    forwardMsg.data = forwardMsg.data.replace(/\n/g, '')
      .replace(/<title color="#777777" size="26">(.+?)<\/title>/g, '___')
      .replace(/___+/, `<title color="#777777" size="26">${xmlTitle}</title>`)
  }
  let msgRes = await reply(e, forwardMsg, false, {
    anony,
    fkmsg,
    recallMsg
  })
  return msgRes
}

  /**
    * 发送消息
    *
    * @async
    * @param {*} e oicq 事件对象
    * @param {Array|String} msg 消息内容
    * @param {Boolean} quote 是否引用回复
    * @param {Object} data 其他参数
    * @param {Number} data.recallMsg 撤回时间
    * @param {Boolean} data.fkmsg 风控消息
    * @param {Boolean | import('icqq').Anonymous} data.anony 匿名消息
    * @param {Boolean | Number} data.at 是否艾特该成员
    * @returns {Promise<import('icqq').MessageRet>} 返回发送消息后的结果对象
    */
  async function reply (e, msg, quote, {
    recallMsg = 0,
    fkmsg = '',
    at = false,
    anony
  } = {}) {
    if (at && e.isGroup) {
      let text = ''
      if (e?.sender?.card) {
        text = _.truncate(e.sender.card, { length: 10 })
      }
      if (at === true) {
        at = Number(e.user_id)
      } else if (!isNaN(at)) {
        let info = e.group.pickMember(at).info
        text = info?.card ?? info?.nickname
        text = _.truncate(text, { length: 10 })
      }

      if (Array.isArray(msg)) {
        msg = [segment.at(at, text), ...msg]
      } else {
        msg = [segment.at(at, text), msg]
      }
    }

    let msgRes = null
    // 发送消息
    if (e.isGroup) {
      // 判断是否开启匿名
      if (anony) {
        let getAnonyInfo = await e.group.getAnonyInfo()
        if (!getAnonyInfo.enable) {
          e.reply('[警告]该群未开启匿名，请启用匿名再使用匿名功能')
          anony = false
        }
      }
      msgRes = await e.group.sendMsg(msg, quote ? e : undefined, anony)
    } else {
      msgRes = await e.reply(msg, quote)
      if (!msgRes) await e.reply(fkmsg || '消息发送失败，可能被风控')
    }
    if (recallMsg > 0 && msgRes?.message_id) {
      if (e.isGroup) {
        setTimeout(() => e.group.recallMsg(msgRes.message_id), recallMsg * 1000)
      } else if (e.friend) {
        setTimeout(() => e.friend.recallMsg(msgRes.message_id), recallMsg * 1000)
      }
    }
    return msgRes
  }