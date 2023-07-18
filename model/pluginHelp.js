import config from './dataHandler.js'
import {pluginName,resPath,_ResPath} from '../data/PluginConstants.js'
import cfg from '../../../lib/config/config.js'

export default class pluginHelp {
    constructor(e) {
        this.e = e
        this.model = 'help'
    }

    static async get(e) {
        let html = new pluginHelp(e)
        return await html.getData()
    }

    async getData() {
        let helpData = config.getConfig('help')

        let groupCfg = cfg.getGroup(this.group_id)

        if (groupCfg.disable && groupCfg.disable.length) {
            helpData = helpData.map((item) => {
                if (groupCfg.disable.includes(item.group)) {
                    item.disable = true
                }
                return item
            })
        }

        const versionData = config.getConfig('version')

        const version =
            (versionData && versionData.length && versionData[0].version) || 'UnkVer'

        const saveId = this.userId
        const tplFile = `${resPath}/html/${this.model}/index.html`

        return {
            ...this.screenData,
            saveId: 'help',
            version,
            helpData,
            tplFile,
            pluginName,
            pluResPath: _ResPath
        }
    }
}
