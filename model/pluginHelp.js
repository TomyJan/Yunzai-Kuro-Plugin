import config from './dataHandler.js'
import {
  pluginName,
  pluginVer,
  resPath,
  _ResPath,
} from '../data/system/pluginConstants.js'
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
    let helpData = config.getData('help')

    let groupCfg = cfg.getGroup(this.group_id)

    if (groupCfg.disable && groupCfg.disable.length) {
      helpData = helpData.map((item) => {
        if (groupCfg.disable.includes(item.group)) {
          item.disable = true
        }
        return item
      })
    }

    const saveId = this.userId
    const tplFile = `${resPath}/html/${this.model}/index.html`

    return {
      tplFile,
      helpData,
      pluResPath: _ResPath,
      pluginName,
      pluginVer,
    }
  }
}
