import fs from 'node:fs'
import {doPnsSignIn} from './gameSignIn.js'
import { dataPath } from '../data/system/pluginConstants.js'
import { sendMsgFriend, sleepAsync } from './utils.js'
import { getToken } from '../model/kuroBBSTokenHandler.js'

export async function gameSignTask(gameName) {
    if (!gameName || (gameName !== 'pns' && gameName !== 'mc')) {
        logger.error(`[库洛插件] 自动游戏签到: 游戏 ${gameName} 未定义!`)
        return false
    }
    if (gameName == 'mc') {
        logger.info(`[库洛插件] 自动游戏签到: 鸣潮签到测试结束`)
        return true
    }
    if (gameName == 'pns') {
        logger.info(`[库洛插件] 自动游戏签到: 战双签到开始...`)

        const gameSignUins = fs.readdirSync(dataPath + '/token').filter((file) => file.endsWith('.json'))

        for (let i in gameSignUins) {
            let gameSignUin = gameSignUins[i].replace('.json', '')
            logger.info(`[库洛插件] 自动游戏签到: 开始为 ${gameSignUin} 战双签到`)
            const tokenData = await getToken(gameSignUin)
            const accNum = Object.keys(tokenData).length
            let msg = ''
            for (const kuro_uid in tokenData) {
                if (tokenData.hasOwnProperty(kuro_uid)) {
                    msg += await doPnsSignIn(kuro_uid, tokenData[kuro_uid].token)
                    msg += '\n'
                } else {
                    msg += `账号 ${kuro_uid}: \ntoken 格式错误\n\n`
                }
                await sleepAsync(3000)
            }
            await sendMsgFriend(gameSignUin, msg)
        }
        logger.info(`[库洛插件] 自动游戏签到: 战双签到完成`)
        return true
    }

}
