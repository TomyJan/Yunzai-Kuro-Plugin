import { dataPath } from '../data/PluginConstants.js'
import fs from 'node:fs'
import fetch from 'node-fetch'

export async function checkTokenValidity(kuro_uid, kuro_token) {
  const url = 'https://api.kurobbs.com/user/mineV2'
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
    token: kuro_token,
    'content-type': 'application/x-www-form-urlencoded',
    'accept-encoding': 'gzip',
    'user-agent': 'okhttp/3.10.0',
  }

  const formData = new URLSearchParams()
  formData.append('otherUserId', kuro_uid)

  logger.info(formData)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: formData,
    })

    if (!response.ok) {
      throw new Error('请求失败: ' + response.status)
    }

    const rsp = await response.json()
    logger.mark('token 检测:  ' + JSON.stringify(rsp))

    if (rsp.code === 200) {
      logger.mark("token 有效!")
      return true
    } else {
        logger.mark("token 失效")
        return false
    }
  } catch (error) {
    logger.mark("请求出错: " +  JSON.stringify(error))
    return false
  }

}
export async function saveToken(uin, kuro_uid,kuro_token, kuro_refreshToken) {
  try {
    const tokenData = {
      [kuro_uid]: {
        token: kuro_token,
        refreshToken: kuro_refreshToken,
        }
    }
    const filePath = dataPath + `/token/${uin}.json`
    const jsonData = JSON.stringify(tokenData)

    await fs.promises.mkdir(dataPath + '/token', { recursive: true })

    let existingData = {}
    try {
      const fileData = await fs.promises.readFile(filePath, 'utf-8')
      existingData = JSON.parse(fileData)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }

    const newData = { ...existingData, ...tokenData }
    const newJsonData = JSON.stringify(newData)

    await fs.promises.writeFile(filePath, newJsonData)
    logger.mark(`Token 已保存至文件: ${filePath}`)
    return true
  } catch (error) {
    logger.warn(`保存 Token 时出错: ${error}`)
    return false
  }
}
