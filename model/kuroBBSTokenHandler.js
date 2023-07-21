import { dataPath } from '../data/system/pluginConstants.js'
import fs from 'node:fs'
import fetch from 'node-fetch'
import kuroApi from './kuroApi.js'

/**
 * 检查 token 是否有效
 * @param {string} kuro_uid 库洛 ID
 * @param {string} kuro_token 库洛 ID 的 token
 * @returns {boolean} 是否有效
 */
export async function checkTokenValidity(kuro_uid, kuro_token) {

  let kuroapi = new kuroApi(false)
  let rsp_checkToken_mineV2 = await kuroapi.checkToken_mineV2(kuro_uid, kuro_token)
  logger.mark('rsp_checkToken_mineV2 ' + JSON.stringify(rsp_checkToken_mineV2))

    logger.mark('token 检测:  ' + JSON.stringify(rsp_checkToken_mineV2))
    return rsp_checkToken_mineV2

}

export async function saveToken(uin, kuro_uid, kuro_token, kuro_refreshToken) {
  try {
    const tokenData = {
      [kuro_uid]: {
        token: kuro_token,
        refreshToken: kuro_refreshToken,
      },
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

export async function getToken(uin) {
  const filePath = dataPath + `/token/${uin}.json`
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    if (!data) {
      return null
    }

    const tokenData = JSON.parse(data)
    return tokenData
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Token file not found')
    } else {
      console.error('Error reading token data from file:', error)
    }
    return null
  }
}
