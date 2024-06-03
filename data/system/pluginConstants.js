import fs from 'fs'
import chalk from 'chalk'

// 插件目录
export const pluginPath = './plugins/Yunzai-Kuro-Plugin'

// 读取package.json文件
const rawData = fs.readFileSync(pluginPath + '/package.json')
const packageJson = JSON.parse(rawData)

// 插件包信息
export const pluginAuthor = packageJson.author || '获取失败'
export const pluginName = packageJson.name || '获取失败'
export const pluginNameReadable = '库洛插件'
export const pluginVer = packageJson.version || 'unkVer'
export const pluginDesc = packageJson.description || '获取失败'
export const pluginRepo = packageJson.repository.url || 'Unknown'

// 插件数据目录
export const appsPath = pluginPath + '/apps'
export const dataPath = pluginPath + '/data'
export const _DataPath = `${process // 绝对目录
  .cwd()
  .replace(/\\/g, '/')}/plugins/${pluginName}/data`
export const resPath = pluginPath + '/resources'
export const _ResPath = `${process // 绝对目录
  .cwd()
  .replace(/\\/g, '/')}/plugins/${pluginName}/resources`
export const cfgPath = pluginPath + '/config'
export const _CfgPath = `${process // 绝对目录
  .cwd()
  .replace(/\\/g, '/')}/plugins/${pluginName}/config`
export const mcGachaDataPath = dataPath + '/gachaData/mc'

// 其它信息
export const pluginThemeColor = chalk.rgb(57, 197, 187)

// 鸣潮历史 up 池时间和物品 id
export const mcGachaUpPools = [
  { // 1.0 上半
    startTime: '1716429600', // 2024.05.23 10:00
    endTime: '1717639200', // 2024.06.06 10:00
    itemId: '1404',
    itemName: '忌炎',
    itemType: 1, // 1 为角色, 2 为武器
  },
  { // 1.0 上半
    startTime: '1716429600', // 2024.05.23 10:00
    endTime: '1717639200', // 2024.06.06 10:00
    itemId: '21010016',
    itemName: '苍鳞千嶂',
    itemType: 2,
  },
]
