import fetch from 'node-fetch'
import { getToken } from '../model/kuroBBSTokenHandler.js'
import { sleepAsync } from '../model/utils.js'

export default class gameSignIn {
  constructor(e) {
    this.e = e
    this.init()
    //消息提示以及风险警告
    this.captchaLoginHelpTip = `免责声明:您将通过短信验证码获取库街区 token . \n本 Bot 不会保存您的账号和密码, 但会保存获取到的账号 token . \n我方仅提供库街区签到, 查询及其它相关游戏内容服务, 您的账号出现封禁, 被盗等处罚与我方无关. \n\n继续登录即为您阅读并同意以上条款! `
  }
  async init() {}

  async pnsSignIn(uin) {
    const tokenData = await getToken(uin)
    console.log(tokenData)

    if (tokenData && Object.keys(tokenData).length > 0) {
      const accNum = Object.keys(tokenData).length
      await this.e.reply(
        `QQ ${uin} 绑定了 ${accNum}个token\n开始战双签到, 稍等一会儿哟...`
      )
      let msg = ''
      for (const kuro_uid in tokenData) {
        if (tokenData.hasOwnProperty(kuro_uid)) {
          msg += await doPnsSignIn(kuro_uid, tokenData[kuro_uid].token)
          msg += '\n'
        }
        await sleepAsync(3000)
      }

      await this.e.reply(msg.trim())
      return true
    } else {
      this.e.reply(
        `QQ ${uin} 暂未绑定 token, 请发送 #库洛验证码登录 绑定 token `
      )
      return false
    }

    async function doPnsSignIn(kuro_uid, token) {
      // 哦 uid 好像用不到 先放着吧
      let doPnsSignInRet = ''
      doPnsSignInRet += `账号 ${kuro_uid}: \n`
      // 获取绑定的游戏 id 列表有俩接口, emmm 迷惑
      const url = 'https://api.kurobbs.com/user/role/findRoleList'
      const headers = {
        osversion: 'Android',
        devcode: '2fba3859fe9bfe9099f2696b8648c2c6',
        countrycode: 'CN',
        ip: '10.0.2.233',
        model: '2211133C',
        source: 'android',
        lang: 'zh-Hans',
        version: '1.0.9',
        versioncode: '1090',
        token: token,
        'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
        'accept-encoding': 'gzip',
        'user-agent': 'okhttp/3.10.0',
      }

      const formData = new URLSearchParams()
      formData.append('gameId', 2)

      try {
        const response_findRoleList = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: formData,
        })

        if (!response_findRoleList.ok) {
          doPnsSignInRet += `${response_findRoleList.status}\n`
          return doPnsSignInRet
        }

        const rsp_findRoleList = await response_findRoleList.json()

        if (rsp_findRoleList.code === 200) {
          if (rsp_findRoleList.data.length === 0) {
            // 没绑定游戏账号
            doPnsSignInRet += '未绑定游戏账号\n'
            return doPnsSignInRet
          }
          for (const data of rsp_findRoleList.data) {
            doPnsSignInRet += `${data.serverName}-${data.roleName}(${data.roleId}): \n`
            //执行签到查询后执行签到
            //
            const url = 'https://api.kurobbs.com/encourage/signIn/initSignIn'
            const headers = {
              pragma: 'no-cache',
              'cache-control': 'no-cache',
              accept: 'application/json, text/plain, */*',
              source: 'android',
              'user-agent':
                'Mozilla/5.0 (Linux; Android 13; 2211133C Build/TKQ1.220905.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.131 Mobile Safari/537.36 Kuro/1.0.9 KuroGameBox/1.0.9',
              token: token,
              'content-type': 'application/x-www-form-urlencoded',
              origin: 'https://web-static.kurobbs.com',
              'x-requested-with': 'com.kurogame.kjq',
              'sec-fetch-site': 'same-site',
              'sec-fetch-mode': 'cors',
              'sec-fetch-dest': 'empty',
              'accept-encoding': 'gzip, deflate, br',
              'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            }

            const formData = new URLSearchParams()
            formData.append('gameId', 2)
            formData.append('serverId', data.serverId)
            formData.append('roleId', data.roleId)

            try {
              const response_initSignIn = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: formData,
              })

              if (!response_initSignIn.ok) {
                doPnsSignInRet += `      ${response_initSignIn.status}\n`
              }

              const rsp_initSignIn = await response_initSignIn.json()
              logger.mark('rsp_initSignIn ' + JSON.stringify(rsp_initSignIn))

              if (rsp_initSignIn.code === 200) {
                if (rsp_initSignIn.data.sigIn) {
                  //如果今天已经签到
                  doPnsSignInRet +=
                    `      今日已签, 本月签${rsp_initSignIn.data.sigInNum}天` +
                    (rsp_initSignIn.data.omissionNnm !== 0
                      ? `, 漏${rsp_initSignIn.data.omissionNnm}天`
                      : '') +
                    `\n`
                } else {
                  //
                  const url = 'https://api.kurobbs.com/encourage/signIn/'
                  const headers = {
                    pragma: 'no-cache',
                    'cache-control': 'no-cache',
                    accept: 'application/json, text/plain, */*',
                    source: 'android',
                    'user-agent':
                      'Mozilla/5.0 (Linux; Android 13; 2211133C Build/TKQ1.220905.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.131 Mobile Safari/537.36 Kuro/1.0.9 KuroGameBox/1.0.9',
                    token: token,
                    'content-type': 'application/x-www-form-urlencoded',
                    origin: 'https://web-static.kurobbs.com',
                    'x-requested-with': 'com.kurogame.kjq',
                    'sec-fetch-site': 'same-site',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-dest': 'empty',
                    'accept-encoding': 'gzip, deflate, br',
                    'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
                  }
                  const formData = new URLSearchParams()
                  formData.append('gameId', 2)
                  formData.append('serverId', data.serverId)
                  formData.append('roleId', data.roleId)
                  formData.append(
                    'reqMonth',
                    (new Date().getMonth() + 1).toString().padStart(2, '0')
                  ) // 去当前月份, 形如 07

                  try {
                    const response_signIn = await fetch(url, {
                      method: 'POST',
                      headers: headers,
                      body: formData,
                    })

                    if (!response_signIn.ok) {
                      doPnsSignInRet +=
                        `      ${response_signIn.status}, 本月签${rsp_initSignIn.data.sigInNum}天` +
                        (rsp_initSignIn.data.omissionNnm !== 0
                          ? `, 漏${rsp_initSignIn.data.omissionNnm}天`
                          : '') +
                        `\n`
                    }

                    const rsp_signIn = await response_signIn.json()
                    logger.mark('rsp_signIn ' + JSON.stringify(rsp_signIn))

                    if (rsp_signIn.code === 200) {
                      //签到成功
                      doPnsSignInRet +=
                        `      签到成功, 本月签${
                          rsp_initSignIn.data.sigInNum + 1
                        }天` +
                        (rsp_initSignIn.data.omissionNnm !== 0
                          ? `, 漏${rsp_initSignIn.data.omissionNnm}天`
                          : '') +
                        `\n`
                    } else {
                      doPnsSignInRet +=
                        `      ${response_signIn.msg}, 本月签${rsp_initSignIn.data.sigInNum}天` +
                        (rsp_initSignIn.data.omissionNnm !== 0
                          ? `, 漏${rsp_initSignIn.data.omissionNnm}天`
                          : '') +
                        `\n`
                    }
                  } catch (error) {
                    doPnsSignInRet +=
                      `      请求出错: ${JSON.stringify(error)}, 本月签${
                        rsp_initSignIn.data.sigInNum
                      }天` +
                      (rsp_initSignIn.data.omissionNnm !== 0
                        ? `, 漏${rsp_initSignIn.data.omissionNnm}天`
                        : '') +
                      `\n`
                  }
                }
              } else {
                doPnsSignInRet += `      ${rsp_signIn.msg}\n`
              }
            } catch (error) {
              doPnsSignInRet += `      请求出错: ${JSON.stringify(error)}\n`
            }
            await sleepAsync(3000)
          }
        } else {
          doPnsSignInRet += `token 失效\n`
        }
      } catch (error) {
        doPnsSignInRet += `请求出错: ${JSON.stringify(error)}\n`
      }
      return doPnsSignInRet
    }
  }
}
