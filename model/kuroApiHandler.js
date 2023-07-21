import fetch from "node-fetch"

export default class kuroApiHandler {
    constructor(uin) {
        this.uin = uin
        this.kuroApiUrl = "https://api.kurobbs.com"
    }

    /**
     * 取库洛接口返回
     * 调用其他接口前请先校验 token 有效性
     * @param {string} ApiName 接口名称
     * @param {string|boolean} kuroUid 库洛 ID, sdkLogin 时传入 false
     * @param {string} token 库洛 ID 的 token
     * @param {object} data 传入数据
     * @returns {JSON|string} 接口返回的 原始 json 或者报错信息
     */
    async getApiRsp(ApiName, kuroUid, token, data) {
        let tmpParams = this.getParams(ApiName, kuroUid, token, data)
        if (!tmpParams) return "接口不存在"
        let {
            url,
            headers,
            body,
            method
        } = tmpParams

        if (!url) return "接口不存在"
        let param = {
            headers: headers,
            body: body,
            method: method
        }

        let response = {}
        try {
            response = await fetch(url, param)
        } catch (error) {
            logger.warn(JSON.stringify(error))
            return `请求出错: \n${JSON.stringify(error)}\n`
        }
        if (!response.ok) {
            logger.warn(`[库洛插件] 接口 ${ApiName}报错, 用户 ${this.e.uid}, 错误: ${response.status} ${response.statusText}`)
            return `请求出错: ${response.status} ${response.statusText}\n`
        }

        let rsp = await response.json();
        return rsp
    }
    /**
     * 取请求需要的参数
     * @param {string} ApiName 接口名称
     * @param {string} kuroUid 库洛 ID
     * @param {string} token 库洛 ID 的 token
     * @param {object} data 传入数据
     * @returns {object} 返回参数
     */
    getParams(ApiName, kuroUid, token, data) {
        let ApiMap = {
            findRoleList: { // 取绑定游戏账号列表
                url: `${this.kuroApiUrl}/user/role/findRoleList`,
                body: `gameId=${data.gameId}`
            },
            initSignIn: { // 取绑定游戏账号列表
                url: `${this.kuroApiUrl}/encourage/signIn/initSignIn`,
                body: `gameId=${data.gameId}&serverId=${data.serverId}&roleId=${data.roleId}`
            },
            signIn: { // 取绑定游戏账号列表
                url: `${this.kuroApiUrl}/encourage/signIn/`,
                body: `gameId=${data.gameId}&serverId=${data.serverId}&roleId=${data.roleId}&reqMonth=${data.reqMonth}`
            },
        }
        if (!ApiMap[ApiName]) return false
        let {
            url,
            query = '', // GET 请求参数
            body = '',
            method = "POST"
        } = ApiMap[ApiName]
        if (query) url += `?${query}`
        let headers = this.getHeaders(ApiName, token)
        return {
            url,
            headers,
            body,
            method
        }
    }
    /**
     * 取请求头
     * @param {string} ApiName 接口名称
     * @returns {object} 返回参数
     */
    getHeaders(ApiName, token) {
        if (["initSignIn", "signIn"].includes(ApiName)) { // 这些 API 请求头是浏览器的
            let headers = {
                pragma: 'no-cache',
                'cache-control': 'no-cache',
                accept: 'application/json, text/plain, */*',
                source: 'android',
                'user-agent': 'Mozilla/5.0 (Linux; Android 13; 2211133C Build/TKQ1.220905.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.131 Mobile Safari/537.36 Kuro/1.0.9 KuroGameBox/1.0.9',
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
            return headers
        }

        let headers = { // 共同请求头
            osversion: 'Android',
            devcode: '2fba3859fe9bfe9099f2696b8648c2c6',
            countrycode: 'CN',
            ip: '10.0.2.233',
            model: '2211133C',
            source: 'android',
            lang: 'zh-Hans',
            version: '1.0.9',
            versioncode: '1090',
            'accept-encoding': 'gzip',
            'user-agent': 'okhttp/3.10.0',
        }
        if (ApiName !== "sdkLogin") { // 除了 login 再都要 token
            headers = {
                ...headers,
                token: token,
            }
        }
        if (["uploadForumImg","mineV2","updateHeadUrl","sdkLogin"].includes(ApiName)) { // 这几个多个 distinct_id
            headers = {
                ...headers,
                distinct_id: '765485e7-30ce-4496-9a9c-a2ac1c03c02c',
            }
        }
          
        // 处理 content-type
        if (ApiName == "findRoleList") { // findRoleList 多了个 utf8
            headers = {
                ...headers,
                'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
            }
        } else if (ApiName !== "uploadForumImg") { // 普通请求为 application/x-www-form-urlencoded, uploadForumImg 为 multipart/form-data, 这里不用手动添加, 让那边的 form-data 自己处理
            headers = {
                ...headers,
                'content-type': 'application/x-www-form-urlencoded',
            }
        }

        return headers


    }
}