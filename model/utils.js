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
