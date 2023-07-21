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
            }
        }
        if (!ApiMap[ApiName]) return false
        let {
            url,
            query = '', // GET 请求参数
            body = '',
            method = "POST"
        } = ApiMap[ApiName]
        if (query) url += `?${query}`
        if (body) body = JSON.stringify(body)
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
        let headers = {
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
        if (ApiName !== "sdkLogin") {
            headers = {
                ...headers,
                token: token,
            }
        }
        if (["uploadForumImg","mineV2","updateHeadUrl","sdkLogin"].includes(ApiName)) {
            headers = {
                ...headers,
                distinct_id: '765485e7-30ce-4496-9a9c-a2ac1c03c02c',
            }
        }
          
        // 处理 content-type
        // 普通请求为 application/x-www-form-urlencoded
        // findRoleList 多了个 utf8
        // uploadForumImg 为 multipart/form-data, 这里不用手动添加, 让那边的 form-data 自己处理
        if (ApiName == "findRoleList") {
            headers = {
                ...headers,
                'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
            }
        } else if (ApiName !== "uploadForumImg") {
            headers = {
                ...headers,
                'content-type': 'application/x-www-form-urlencoded',
            }
        }

        return headers


    }
}