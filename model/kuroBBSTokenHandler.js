import { dataPath } from '../data/PluginConstants.js'
import fs from 'node:fs'
import fetch from 'node-fetch'

export async function checkTokenValidity(token) {
    // TODO
    return true
}
export async function saveToken(uin, token, refreshToken) {
    try {
        const tokenData = {
            token: token,
            refreshToken: refreshToken
        };
        const filePath = dataPath + `/token/${uin}.json`
        const jsonData = JSON.stringify(tokenData);

        await fs.promises.mkdir(dataPath + '/token', { recursive: true });

        let existingData = {};
        try {
            const fileData = await fs.promises.readFile(filePath, 'utf-8');
            existingData = JSON.parse(fileData);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        const newData = { ...existingData, ...tokenData };
        const newJsonData = JSON.stringify(newData);

        await fs.promises.writeFile(filePath, newJsonData);
        logger.mark(`Token 已保存至文件: ${filePath}`)
        return true
    } catch (error) {
        logger.warn(`保存 Token 时出错: ${error}`)
        return false
    }
}
