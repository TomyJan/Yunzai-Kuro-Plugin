import fs from 'fs'

export const pluginName = 'Yunzai-Kuro-Plugin'
export const pluginPath = './plugins/' + pluginName
export const appsPath = pluginPath + '/apps'
export const dataPath = pluginPath + '/data'
export const resPath = pluginPath + '/resources'
export const _ResPath = `${process
  .cwd()
  .replace(/\\/g, '/')}/plugins/${pluginName}/resources`
const CHANGELOG_path = `${pluginPath}/CHANGELOG.md`

var ver

try {
  if (
    fs.existsSync(CHANGELOG_path) &&
    fs.readFileSync(CHANGELOG_path, 'utf8') !== ''
  ) {
    const logText = fs.readFileSync(CHANGELOG_path, 'utf8') || ''

    const vers = logText.match(/#\s*([\d.]+(?:-\w+)*)/)
    ver = vers ? vers[1] : 'UnkVer'
  } else {
    ver = 'UnkVer'
  }
} catch (e) {
  logger.error(e)
  ver = 'UnkVer'
}

export const pluginVer = ver
