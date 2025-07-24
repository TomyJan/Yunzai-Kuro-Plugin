import kuroLogger from '../components/logger.js'
import config from '../components/config.js'
import crypto from 'crypto'
import { dataPath, resPath } from '../data/system/pluginConstants.js'
import fs from 'fs'
import fetch from 'node-fetch'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import zhCN from 'date-fns/locale/zh-CN'
import { Buffer } from 'buffer'

/**
 * 程序延时
 * @param {number} sleepms 延时时间
 * @returns {Promise<void>}
 */
export function sleepAsync(sleepms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, sleepms)
  })
}

/**
 * 获取随机整数
 * @param {number} min 最小值
 * @param {number} max 最大值
 * @returns {number} 随机整数
 */
export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}

/**
 * 获取当前月份天数
 * @returns {number} 当前月份天数
 */
export async function mGetDate() {
  var date = new Date()
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var d = new Date(year, month, 0)
  return d.getDate()
}

/**
 * 根据输入字符串生成固定 UUID
 * @param {*} inputString 输入字符串
 * @returns {string} UUID
 */
export function generateUUID(inputString) {
  const md5Hash = crypto.createHash('md5')
  md5Hash.update(inputString)
  const hash = md5Hash.digest('hex')

  // Format the hash into UUID-like string
  const uuid =
    hash.substring(0, 8) +
    '-' +
    hash.substring(8, 12) +
    '-' +
    '4' +
    hash.substring(13, 16) +
    '-' +
    'a' +
    hash.substring(17, 20) +
    '-' +
    hash.substring(20, 32)

  kuroLogger.debug(`使用 ${inputString} 生成 UUID ${uuid}`)
  return uuid
}

/**
 * 根据输入字符串生成固定字符串
 * @param {*} inputString 输入字符串
 * @param {number} length 字符串长度, 默认为40, 最长为64
 * @returns {string} 固定字符串
 */
export function generateFixedString(inputString, length = 40) {
  if (!inputString) {
    kuroLogger.warn('生成固定字符串输入为空, 使用默认值 1')
    inputString = '1'
  }
  inputString = inputString.toString()
  if (length > 64) {
    length = 64
    kuroLogger.warn(
      `使用 ${inputString} 生成长度 ${length} 超过最大值, 已自动调整为64`,
    )
  }
  const sha256Hash = crypto.createHash('sha256')
  sha256Hash.update(inputString)
  const hash = sha256Hash.digest('hex').toUpperCase()

  // 截取前40个字符作为结果
  const fixedString = hash.substring(0, length)

  kuroLogger.debug(
    `使用 ${inputString} 生成长度为 ${length} 的固定字符串 ${fixedString}`,
  )
  return fixedString
}

/**
 * 更新卡片要用的背景图片
 * @returns {boolean} 是否成功更新背景图片
 */
export function updateCardBg() {
  let defaultCardBgPath = resPath + '/img/common/bg/Alisa-Echo_0.jpg'
  let cardBgPath = dataPath + '/system/cachedImg/cardBg.jpg'
  let tmpCardBgPath = dataPath + '/system/cachedImg/cardBgTmp.jpg'
  let imgDownloadUrl = 'https://api.tomys.top/api/pnsWallPaper'

  if (!config.getConfig().useRandomBgInCard) {
    // 没使用随机背景图片
    try {
      let cardBgExist = fs.existsSync(cardBgPath)
      if (
        !cardBgExist ||
        fs.statSync(cardBgPath).size !== fs.statSync(defaultCardBgPath).size
      ) {
        if (fs.existsSync(cardBgPath)) fs.unlinkSync(cardBgPath)
        fs.copyFileSync(defaultCardBgPath, cardBgPath)
      }
      return true
    } catch (err) {
      kuroLogger.warn('复制卡片默认背景图片错误:', err.message)
      return false
    }
  }

  // 获取随机背景图片
  fetch(imgDownloadUrl, { method: 'GET', timeout: 5000 })
    .then((rsp) => {
      if (
        rsp.status === 301 ||
        rsp.status === 302 ||
        rsp.status === 307 ||
        rsp.status === 308
      ) {
        let location = rsp.headers.get('location')
        kuroLogger.debug(
          '更新卡片背景图片重定向:',
          rsp.status,
          rsp.statusText,
          'url:',
          location,
        )
        return fetch(location, { method: 'GET', timeout: 5000 })
      }
      return rsp
    })
    .then((rsp) => {
      if (rsp.ok) {
        kuroLogger.debug('更新卡片背景图片响应:', rsp.status, rsp.statusText)
        return rsp.arrayBuffer()
      } else {
        kuroLogger.warn(
          '更新卡片背景图片错误:',
          rsp.status,
          rsp.statusText,
          rsp.url,
        )
      }
    })
    .then((buffer) => {
      fs.writeFileSync(tmpCardBgPath, Buffer.from(buffer))
      if (fs.existsSync(cardBgPath)) fs.unlinkSync(cardBgPath)
      fs.renameSync(tmpCardBgPath, cardBgPath)
      return true
    })
    .catch((err) => {
      kuroLogger.warn('更新卡片背景图片错误:', err.message)
      if (!fs.existsSync(cardBgPath))
        fs.copyFileSync(defaultCardBgPath, cardBgPath)
      return false
    })
}

/**
 * 格式化时间戳为人类易读的时间
 * @param {number} timestamp 时间戳
 * @returns {string} 人类易读的时间
 */
export function formatTimestampInReadableFormat(timestamp) {
  if (!timestamp) return '已经'
  if (timestamp.toString().length === 10) {
    timestamp = timestamp * 1000
  }
  return formatDistanceToNow(new Date(timestamp), {
    locale: zhCN,
    addSuffix: true,
  })
}

/**
 * 发送好友消息
 * @param QQ QQ号
 * @param msg 消息
 */
export async function sendMsgFriend(uin, msg) {
  uin = Number(uin)
  // 延迟五秒
  // await sleepAsync(5000)
  // eslint-disable-next-line no-undef
  let friend = Bot.fl.get(uin)
  if (friend || config.getConfig().attemptSendNonFriend) {
    kuroLogger.debug(
      // eslint-disable-next-line no-undef
      `bot ${config.getConfig().botQQ || Bot.uin} 发送好友消息[${
        friend?.nickname
      }](${uin})`,
    )
    // 如果 Bot 是 array 则使用配置的 Bot
    // eslint-disable-next-line no-undef
    let tmpBot = Bot
    // eslint-disable-next-line no-undef
    if (Array.isArray(Bot)) {
      // eslint-disable-next-line no-undef
      tmpBot = Bot[config.getConfig().botQQ || 0]
    }
    return await tmpBot
      .pickUser(uin)
      .sendMsg(msg)
      .catch((err) => {
        kuroLogger.error('发送好友消息错误:', err.message)
      })
  } else {
    kuroLogger.warn(`${uin} 非好友, 无法推送签到消息`)
  }
}
