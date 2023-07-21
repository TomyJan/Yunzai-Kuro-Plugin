import fs from 'node:fs'
import kuroApiHandler from "./kuroApiHandler.js"
import { getToken } from './kuroBBSTokenHandler.js'
export default class kuroApi {
    constructor(uin) {
        this.uin = uin
        this.tokenDataPromise = this.initializeTokenData();
    }

    /**
     * 异步初始化 tokenData
     */
    async initializeTokenData() {
        return getToken(this.uin); // 返回getToken的Promise
    }

    // 等待tokenData初始化完成的辅助方法
    async waitTokenData() {
        this.tokenData = await this.tokenDataPromise;
    }

    /**
     * 取库洛接口返回
     * 调用其他接口前请先校验 token 有效性
     * @param {string} ApiName 接口名称
     * @param {string|boolean} kuroUid 库洛 ID, sdkLogin 时传入 false
     * @param {object} data 传入数据, 具体业务需要的参数也不同
     * @returns {JSON|string} 接口返回的 原始 json 或者报错信息
     */
    async getData(ApiName, kuroUid, data) {
        await this.waitTokenData();
        if (kuroUid) {
            // TODO: 检查 token 有效性
        }
        this.kuroApiHandler = new kuroApiHandler(this.uin);
        let rsp = ""
        if (ApiName !== "sdkLogin") {
            rsp = await this.kuroApiHandler.getApiRsp(ApiName, kuroUid, this.tokenData[kuroUid].token, data)
        } else {
            rsp = await this.kuroApiHandler.getApiRsp(ApiName, false, "", data)
        }
        return rsp
    }


    /**
     * 取绑定游戏账号列表
     * @param {string} kuroUid 库洛 ID
     * @param {object} data 传入 data.gameId 游戏 id
     * @returns {JSON|string} 接口返回的 原始 json 或者报错信息
     */
    async findRoleList(kuroUid, data) {
        //
        return this.getData("findRoleList",kuroUid, data)
    }
}
