import fetch from 'node-fetch'
import fs from 'node:fs'
import FormData from 'form-data'
import { getToken } from './kuroBBSTokenHandler.js'
import { sendForwardMsg } from './utils.js'

export default class bbsHeadUpload {
    constructor(e) {
        this.e = e
        this.init()
        //消息提示以及风险警告
        this.bbsHeadUploadHelpTip = `免责声明:您将上传库街区自定义头像. \n请勿上传侵权, 违反相关法律法规等任何不适宜图片图片. \n我方仅提供自定义头像上传服务, 任何不适宜使用带来的后果均与我方无关. \n继续上传即为您阅读并同意以上条款! `
    }
    async init() { }

    async bbsHeadUploadHelp() {
        let tmp = []
        tmp.push('例2: \n#库洛头像上传账号10065669,头像', segment.image("http://gchat.qpic.cn/gchatpic_new/0/0-0-A61649D801BABCE4CACD685296461175/0"))

        const tokenData = await getToken(this.e.user_id)
        const accNum = Object.keys(tokenData).length
        let tmp2 = '下面是你账号绑定的库洛账号 ID 列表: \n'
        for (const kuro_uid in tokenData) {
            tmp2 += `${kuro_uid}\n`
        }

        let bbsHeadUploadHelpMsg = []
        bbsHeadUploadHelpMsg.push(this.bbsHeadUploadHelpTip, '请将库洛账号 ID 和要上传的图片或者图片直链用逗号隔开发送以完成绑定', '例1: \n#库洛头像上传账号10065669,头像https://public-cdn.tomys.top/head.png', tmp, '头像会居中截圆显示, 建议上传正方形图片', tmp2)

        await sendForwardMsg(this.e, bbsHeadUploadHelpMsg)
        return true
    }

    async bbsHeadUploadResult() {
        let msg = this.e.toString()
            .replace(/\r\n|\n/g, '')
            .replace(/库洛头像上传账号|头像|：|:/g, '')
            .replace('http//', 'http://').replace('https//', 'https://') // 还回来 http 协议头的 :
            .replace('{image', '{image:') // 还回来 {image 的 :
            .replace(/,|，/g, ',')
            .replace(/#| /g, '')
            .split(',')

        if (msg.length != 2 || msg[0] == '' || msg[1] == '') {
            this.e.reply('参数不完整')
            return false
        }
        if (!/^\d{8}$/.test(msg[0])) {
            this.e.reply('账号 ID 格式错误')
            return false
        }

        if (/^\{image:/.test(msg[1])) { // 匹配 {image: 
            msg[1] = "http://gchat.qpic.cn/gchatpic_new/0/0-0-" + msg[1].replace('{image:', '').replace('}', '') + "/0"
        } else {
            if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(msg[1])) { // 匹配不上链接
                this.e.reply('图片无效')
                return false
                
            } 
        }

        const tokensData = await getToken(this.e.user_id)
        if(!tokensData || !tokensData.hasOwnProperty(msg[0]) || !tokensData[msg[0]].token || tokensData[msg[0]].token == ''){
            this.e.reply('你并未绑定此 ID, 请确认!')
            return false
        }
        const tokenData = tokensData[msg[0]].token
        
        const url = 'https://api.kurobbs.com/forum/uploadForumImg'
        const headers = {
            osversion: 'Android',
            devcode: '2fba3859fe9bfe9099f2696b8648c2c6',
            distinct_id: '765485e7-30ce-4496-9a9c-a2ac1c03c02c',
            countrycode: 'CN',
            ip: '10.0.2.233',
            model: '2211133C',
            source: 'android',
            lang: 'zh-Hans',
            version: '1.0.9',
            versioncode: '1090',
            token: tokenData,
            'accept-encoding': 'gzip',
            'user-agent': 'okhttp/3.10.0',
        }

        const formData = new FormData()
        const image = await this.downloadImage(msg[1])
        if(!image) return false
        formData.append('files', image, 'image.jpg')
        try {
            const response_uploadForumImg = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: formData,
            })

            if (!response_uploadForumImg.ok) {
                this.e.reply('请求失败: ' + response_uploadForumImg.status)
                throw new Error('[库洛插件] 请求失败: ' + response_uploadForumImg.status)
            }

            const rsp_uploadForumImg = await response_uploadForumImg.json()

            if (rsp_uploadForumImg.code === 200) {
                logger.info('[库洛插件] 图片上传成功!\n' + JSON.stringify(rsp_uploadForumImg))
                //上传图片成功, 开始更新头像
                const url = 'https://api.kurobbs.com/user/updateHeadUrl'
                const headers = {
                    osversion: 'Android',
                    devcode: '2fba3859fe9bfe9099f2696b8648c2c6',
                    distinct_id: '765485e7-30ce-4496-9a9c-a2ac1c03c02c',
                    countrycode: 'CN',
                    ip: '10.0.2.233',
                    model: '2211133C',
                    source: 'android',
                    lang: 'zh-Hans',
                    version: '1.0.9',
                    versioncode: '1090',
                    token: tokenData,
                    'content-type': 'application/x-www-form-urlencoded',
                    'accept-encoding': 'gzip',
                    'user-agent': 'okhttp/3.10.0',
                }

                const formData = new URLSearchParams()
                formData.append('headUrl', rsp_uploadForumImg.data[0])
                console.log(formData)
                try {
                    const response_updateHeadUrl = await fetch(url, {
                        method: 'POST',
                        headers: headers,
                        body: formData,
                    })

                    if (!response_updateHeadUrl.ok) {
                        this.e.reply('请求失败: ' + response_updateHeadUrl.status)
                        throw new Error('[库洛插件] 请求失败: ' + response_updateHeadUrl.status)
                    }

                    const rsp_updateHeadUrl = await response_updateHeadUrl.json()

                    if (rsp_updateHeadUrl.code === 200) {
                        logger.info('[库洛插件] 头像更新成功!\n' + JSON.stringify(rsp_updateHeadUrl))
                        this.e.reply('头像上传成功!')
                        return true
                    } else {
                        logger.info('[库洛插件] 头像更新失败\n' + JSON.stringify(rsp_updateHeadUrl))
                        this.e.reply('头像上传失败!\n' + JSON.stringify(rsp_updateHeadUrl))
                        return false
                    }
                } catch (error) {
                    logger.info('[库洛插件] 头像更新失败\n' + JSON.stringify(error))
                    this.e.reply('头像上传失败!\n' + JSON.stringify(error))
                    return false
                }
                return false
            } else {
                logger.info('[库洛插件] 图片上传失败\n' + JSON.stringify(rsp_uploadForumImg))
                this.e.reply('图片上传失败, 请稍后尝试或使用直链更新头像!\n' + JSON.stringify(rsp_uploadForumImg))
                return false
            }
        } catch (error) {
            logger.info('[库洛插件] 图片上传失败\n' + JSON.stringify(error))
            this.e.reply('图片上传失败, 请稍后尝试或使用直链更新头像!\n' + JSON.stringify(error))
            return false
        }
        return false

        
    }


    async downloadImage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
              this.e.reply('请求失败: ' + response.status)
              throw new Error('[库洛插件] 请求失败: ' + response.status);
            }
            return response.body;
        } catch (error) {
            this.e.reply('图片下载失败: ' + error.message);
            logger.info('[库洛插件] 图片下载失败: ' + error.message);
            return null;
        }
    }
}

