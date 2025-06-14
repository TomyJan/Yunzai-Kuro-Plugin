import fs from 'fs'
import chalk from 'chalk'
import process from 'node:process'

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
export const _McGachaDataPath = `${process // 绝对目录
  .cwd()
  .replace(/\\/g, '/')}/plugins/${pluginName}/data/gachaData/mc`

// 其它信息
export const pluginThemeColor = chalk.rgb(57, 197, 187)

// 鸣潮卡池类型 id 和对应名称
export const mcGachaType = [
  '未知',
  '角色活动唤取',
  '武器活动唤取',
  '角色常驻唤取',
  '武器常驻唤取',
  '新手唤取',
  '新手自选唤取',
  '新手自选唤取（感恩定向唤取）',
]

// 鸣潮历史 up 池时间和物品 id
// 注意, 解包得到 IconRup 中的 id 自 1.1 版本开始并不与角色 id 对应, 需要在 roleinfo 中找到相应 id
// 注意, 解包得到 IconWeapon 中的新五星武器 id 自 1.3 版本开始并不与武器 id 对应, 新四星武器 id 自 ~2.1 版本开始不对应, 需要在 weaponconf 中找到相应 id
export const mcGachaUpPools = [
  {
    // 1.0 上半, 提前开服故时间提前
    startTime: '1716393600', // 2024.05.23 00:00
    endTime: '1718243940', // 2024.06.13 09:59
    itemId: '1404',
    itemName: '忌炎',
    itemType: 1, // 1 为角色, 2 为武器
    cardPoolName: '夜将寒色去',
  },
  {
    // 1.0 上半, 提前开服故时间提前
    startTime: '1716393600', // 2024.05.23 00:00
    endTime: '1718243940', // 2024.06.13 09:59
    itemId: '21010016',
    itemName: '苍鳞千嶂',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 1.0 下半, 卡池提前
    startTime: '1717639200', // 2024.06.06 10:00
    endTime: '1719374340', // 2024.06.26 11:59
    itemId: '1302',
    itemName: '吟霖',
    itemType: 1,
    cardPoolName: '惊霆雨时节',
  },
  {
    // 1.0 下半, 卡池提前
    startTime: '1717639200', // 2024.06.06 10:00
    endTime: '1719374340', // 2024.06.26 11:59
    itemId: '21050016',
    itemName: '掣傀之手',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 1.1 上半
    startTime: '1719540000', // 2024.06.28 10:00
    endTime: '1721613540', // 2024.07.22 09:59
    itemId: '1304',
    itemName: '今汐',
    itemType: 1,
    cardPoolName: '寒尽觉春生',
  },
  {
    // 1.1 上半
    startTime: '1719540000', // 2024.06.28 10:00
    endTime: '1721613540', // 2024.07.22 09:59
    itemId: '21010026',
    itemName: '时和岁稔',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 1.1 下半
    startTime: '1721613600', // 2024.07.22 10:00
    endTime: '1723687140', // 2024.08.15 09:59
    itemId: '1205',
    itemName: '长离',
    itemType: 1,
    cardPoolName: '炽羽策阵星',
  },
  {
    // 1.1 下半
    startTime: '1721613600', // 2024.07.22 10:00
    endTime: '1723687140', // 2024.08.15 09:59
    itemId: '21020016',
    itemName: '赫奕流明',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 1.2 上半
    startTime: '1723687200', // 2024.08.15 10:00
    endTime: '1725674340', // 2024.09.07 09:59
    itemId: '1105',
    itemName: '折枝',
    itemType: 1,
    cardPoolName: '赋彩作长吟',
  },
  {
    // 1.2 上半
    startTime: '1723687200', // 2024.08.15 10:00
    endTime: '1725674340', // 2024.09.07 09:59
    itemId: '21050026',
    itemName: '琼枝冰绡',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 1.2 下半
    startTime: '1725674400', // 2024.09.07 10:00
    endTime: '1727495940', // 2024.09.28 11:59
    itemId: '1305',
    itemName: '相里要',
    itemType: 1,
    cardPoolName: '千机逐星野',
  },
  {
    // 1.2 下半
    startTime: '1725674400', // 2024.09.07 10:00
    endTime: '1727495940', // 2024.09.28 11:59
    itemId: '21040016',
    itemName: '诸方玄枢',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 1.3 上半
    startTime: '1727575200', // 2024.09.29 10:00
    endTime: '1729735140', // 2024.10.24 09:59
    itemId: '1505',
    itemName: '守岸人',
    itemType: 1,
    cardPoolName: '直至海水褪色',
  },
  {
    // 1.3 上半
    startTime: '1727575200', // 2024.09.29 10:00
    endTime: '1729735140', // 2024.10.24 09:59
    itemId: '21050036',
    itemName: '星序协响',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 1.3 下半
    startTime: '1729735200', // 2024.10.24 10:00
    endTime: '1731470340', // 2024.11.13 11:59
    itemId: '1404',
    itemName: '忌炎',
    itemType: 1,
    cardPoolName: '夜将寒色去',
  },
  {
    // 1.3 下半
    startTime: '1729735200', // 2024.10.24 10:00
    endTime: '1731470340', // 2024.11.13 11:59
    itemId: '21010016',
    itemName: '苍鳞千嶂',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 1.4 上半, 为给新年版本让时间版本时间延长
    startTime: '1731549600', // 2024.11.14 10:00
    endTime: '1733968740', // 2024.12.12 09:59
    itemId: '1603',
    itemName: '椿',
    itemType: 1,
    cardPoolName: '徘徊迷宫尽处',
  },
  {
    // 1.4 上半, 为给新年版本让时间版本时间延长
    startTime: '1731549600', // 2024.11.14 10:00
    endTime: '1733968740', // 2024.12.12 09:59
    itemId: '21020026',
    itemName: '裁春',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 1.4 下半, 为给新年版本让时间版本时间延长, 双复刻
    startTime: '1733968800', // 2024.12.12 10:00
    endTime: '1735703940', // 2025.01.01 11:59
    itemId: '1302',
    itemName: '吟霖',
    itemType: 1,
    cardPoolName: '惊霆雨时节',
  },
  {
    // 1.4 下半, 为给新年版本让时间版本时间延长, 双复刻
    startTime: '1733968800', // 2024.12.12 10:00
    endTime: '1735703940', // 2025.01.01 11:59
    itemId: '21050016',
    itemName: '掣傀之手',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 1.4 下半, 为给新年版本让时间版本时间延长, 双复刻
    startTime: '1733968800', // 2024.12.12 10:00
    endTime: '1735703940', // 2025.01.01 11:59
    itemId: '1305',
    itemName: '相里要',
    itemType: 1,
    cardPoolName: '千机逐星野',
  },
  {
    // 1.4 下半, 为给新年版本让时间版本时间延长, 双复刻
    startTime: '1733968800', // 2024.12.12 10:00
    endTime: '1735703940', // 2025.01.01 11:59
    itemId: '21040016',
    itemName: '诸方玄枢',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.0 上半
    startTime: '1735783200', // 2025.01.02 10:00
    endTime: '1737597540', // 2025.01.23 09:59
    itemId: '1107',
    itemName: '珂莱塔',
    itemType: 1,
    cardPoolName: '另一种喧嚣',
  },
  {
    // 2.0 上半
    startTime: '1735783200', // 2025.01.02 10:00
    endTime: '1737597540', // 2025.01.23 09:59
    itemId: '1105',
    itemName: '折枝',
    itemType: 1,
    cardPoolName: '赋彩作长吟',
  },
  {
    // 2.0 上半
    startTime: '1735783200', // 2025.01.02 10:00
    endTime: '1737597540', // 2025.01.23 09:59
    itemId: '21030016',
    itemName: '死与舞',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.0 上半
    startTime: '1735783200', // 2025.01.02 10:00
    endTime: '1737597540', // 2025.01.23 09:59
    itemId: '21050026',
    itemName: '琼枝冰绡',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.0 下半
    startTime: '1737597600', // 2025.01.23 10:00
    endTime: '1739332740', // 2025.02.12 11:59
    itemId: '1606',
    itemName: '洛可可',
    itemType: 1,
    cardPoolName: '箱中舞台',
  },
  {
    // 2.0 下半
    startTime: '1737597600', // 2025.01.23 10:00
    endTime: '1739332740', // 2025.02.12 11:59
    itemId: '1304',
    itemName: '今汐',
    itemType: 1,
    cardPoolName: '寒尽觉春生',
  },
  {
    // 2.0 下半
    startTime: '1737597600', // 2025.01.23 10:00
    endTime: '1739332740', // 2025.02.12 11:59
    itemId: '21040026',
    itemName: '悲喜剧',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.0 下半
    startTime: '1737597600', // 2025.01.23 10:00
    endTime: '1739332740', // 2025.02.12 11:59
    itemId: '21010026',
    itemName: '时和岁稔',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.1 上半
    startTime: '1739412000', // 2025.02.13 10:00
    endTime: '1741226340', // 2025.03.06 09:59
    itemId: '1506',
    itemName: '菲比',
    itemType: 1,
    cardPoolName: '于静谧呢喃',
  },
  {
    // 2.1 上半
    startTime: '1739412000', // 2025.02.13 10:00
    endTime: '1741226340', // 2025.03.06 09:59
    itemId: '21050046',
    itemName: '和光回唱',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.1 下半
    startTime: '1741226400', // 2025.03.06 10:00
    endTime: '1742961540', // 2025.03.26 11:59
    itemId: '1206',
    itemName: '布兰特',
    itemType: 1,
    cardPoolName: '燃焰于海',
  },
  {
    // 2.1 下半
    startTime: '1741226400', // 2025.03.06 10:00
    endTime: '1742961540', // 2025.03.26 11:59
    itemId: '1205',
    itemName: '长离',
    itemType: 1,
    cardPoolName: '炽羽策阵星',
  },
  {
    // 2.1 下半
    startTime: '1741226400', // 2025.03.06 10:00
    endTime: '1742961540', // 2025.03.26 11:59
    itemId: '21020036',
    itemName: '不灭航路',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.1 下半
    startTime: '1741226400', // 2025.03.06 10:00
    endTime: '1742961540', // 2025.03.26 11:59
    itemId: '21020016',
    itemName: '赫奕流明',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.2 上半
    startTime: '1743040800', // 2025.03.27 10:00
    endTime: '1744855140', // 2025.04.17 09:59
    itemId: '1607',
    itemName: '坎特蕾拉',
    itemType: 1,
    cardPoolName: '映海之梦',
  },
  {
    // 2.2 上半
    startTime: '1743040800', // 2025.03.27 10:00
    endTime: '1744855140', // 2025.04.17 09:59
    itemId: '1603',
    itemName: '椿',
    itemType: 1,
    cardPoolName: '徘徊迷宫尽处',
  },
  {
    // 2.2 上半
    startTime: '1743040800', // 2025.03.27 10:00
    endTime: '1744855140', // 2025.04.17 09:59
    itemId: '21050056',
    itemName: '海的呢喃',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.2 上半
    startTime: '1743040800', // 2025.03.27 10:00
    endTime: '1744855140', // 2025.04.17 09:59
    itemId: '21020026',
    itemName: '裁春',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.2 下半, 追赶周年庆时间卡池缩短
    startTime: '1744855200', // 2025.04.17 10:00
    endTime: '1745812740', // 2025.04.28 11:59
    itemId: '1505',
    itemName: '守岸人',
    itemType: 1,
    cardPoolName: '直至海水褪色',
  },
  {
    // 2.2 下半, 追赶周年庆时间卡池缩短
    startTime: '1744855200', // 2025.04.17 10:00
    endTime: '1745812740', // 2025.04.28 11:59
    itemId: '21050036',
    itemName: '星序协响',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.3 上半
    startTime: '1745892000', // 2025.04.29 10:00
    endTime: '1747879140', // 2025.05.22 09:59
    itemId: '1507',
    itemName: '赞妮',
    itemType: 1,
    cardPoolName: '行于光影之间',
  },
  {
    // 2.3 上半 周年复刻角色池 (1/5)
    startTime: '1745892000', // 2025.04.29 10:00
    endTime: '1747879140', // 2025.05.22 09:59
    itemId: '1404',
    itemName: '忌炎',
    itemType: 1,
    cardPoolName: '夜将寒色去',
  },
  {
    // 2.3 上半 周年复刻角色池 (2/5)
    startTime: '1745892000', // 2025.04.29 10:00
    endTime: '1747879140', // 2025.05.22 09:59
    itemId: '1302',
    itemName: '吟霖',
    itemType: 1,
    cardPoolName: '惊霆雨时节',
  },
  {
    // 2.3 上半 周年复刻角色池 (3/5)
    startTime: '1745892000', // 2025.04.29 10:00
    endTime: '1747879140', // 2025.05.22 09:59
    itemId: '1105',
    itemName: '折枝',
    itemType: 1,
    cardPoolName: '赋彩作长吟',
  },
  {
    // 2.3 上半 周年复刻角色池 (4/5)
    startTime: '1745892000', // 2025.04.29 10:00
    endTime: '1747879140', // 2025.05.22 09:59
    itemId: '1305',
    itemName: '相里要',
    itemType: 1,
    cardPoolName: '千机逐星野',
  },
  {
    // 2.3 上半 周年复刻角色池 (5/5)
    startTime: '1745892000', // 2025.04.29 10:00
    endTime: '1747879140', // 2025.05.22 09:59
    itemId: '1506',
    itemName: '菲比',
    itemType: 1,
    cardPoolName: '于静谧呢喃',
  },
  {
    // 2.3 上半
    startTime: '1745892000', // 2025.04.29 10:00
    endTime: '1747879140', // 2025.05.22 09:59
    itemId: '21040036',
    itemName: '焰光裁定',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.3 上半 周年复刻武器池 (1/5)
    startTime: '1745892000', // 2025.04.29 10:00
    endTime: '1747879140', // 2025.05.22 09:59
    itemId: '21010016',
    itemName: '苍鳞千嶂',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.3 上半 周年复刻武器池 (2/5)
    startTime: '1745892000', // 2025.04.29 10:00
    endTime: '1747879140', // 2025.05.22 09:59
    itemId: '21050016',
    itemName: '掣傀之手',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.3 上半 周年复刻武器池 (3/5)
    startTime: '1745892000', // 2025.04.29 10:00
    endTime: '1747879140', // 2025.05.22 09:59
    itemId: '21050026',
    itemName: '琼枝冰绡',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.3 上半 周年复刻武器池 (4/5)
    startTime: '1745892000', // 2025.04.29 10:00
    endTime: '1747879140', // 2025.05.22 09:59
    itemId: '21040016',
    itemName: '诸方玄枢',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.3 上半 周年复刻武器池 (5/5)
    startTime: '1745892000', // 2025.04.29 10:00
    endTime: '1747879140', // 2025.05.22 09:59
    itemId: '21050046',
    itemName: '和光回唱',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.3 下半
    startTime: '1747879200', // 2025.05.22 10:00
    endTime: '1749614340', // 2025.06.11 11:59
    itemId: '1407',
    itemName: '夏空',
    itemType: 1,
    cardPoolName: '诗与乐的交响',
  },
  {
    // 2.3 下半 周年复刻角色池 (1/5)
    startTime: '1747879200', // 2025.05.22 10:00
    endTime: '1749614340', // 2025.06.11 11:59
    itemId: '1304',
    itemName: '今汐',
    itemType: 1,
    cardPoolName: '寒尽觉春生',
  },
  {
    // 2.3 下半 周年复刻角色池 (2/5)
    startTime: '1747879200', // 2025.05.22 10:00
    endTime: '1749614340', // 2025.06.11 11:59
    itemId: '1205',
    itemName: '长离',
    itemType: 1,
    cardPoolName: '炽羽策阵星',
  },
  {
    // 2.3 下半 周年复刻角色池 (3/5)
    startTime: '1747879200', // 2025.05.22 10:00
    endTime: '1749614340', // 2025.06.11 11:59
    itemId: '1107',
    itemName: '珂莱塔',
    itemType: 1,
    cardPoolName: '另一种喧嚣',
  },
  {
    // 2.3 下半 周年复刻角色池 (4/5)
    startTime: '1747879200', // 2025.05.22 10:00
    endTime: '1749614340', // 2025.06.11 11:59
    itemId: '1606',
    itemName: '洛可可',
    itemType: 1,
    cardPoolName: '箱中舞台',
  },
  {
    // 2.3 下半 周年复刻角色池 (5/5)
    startTime: '1747879200', // 2025.05.22 10:00
    endTime: '1749614340', // 2025.06.11 11:59
    itemId: '1206',
    itemName: '布兰特',
    itemType: 1,
    cardPoolName: '燃焰于海',
  },
  {
    // 2.3 下半
    startTime: '1747879200', // 2025.05.22 10:00
    endTime: '1749614340', // 2025.06.11 11:59
    itemId: '21030026',
    itemName: '林间的咏叹调',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.3 下半 周年复刻武器池 (1/5)
    startTime: '1747879200', // 2025.05.22 10:00
    endTime: '1749614340', // 2025.06.11 11:59
    itemId: '21010026',
    itemName: '时和岁稔',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.3 下半 周年复刻武器池 (2/5)
    startTime: '1747879200', // 2025.05.22 10:00
    endTime: '1749614340', // 2025.06.11 11:59
    itemId: '21020016',
    itemName: '赫奕流明',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.3 下半 周年复刻武器池 (3/5)
    startTime: '1747879200', // 2025.05.22 10:00
    endTime: '1749614340', // 2025.06.11 11:59
    itemId: '21030016',
    itemName: '死与舞',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.3 下半 周年复刻武器池 (4/5)
    startTime: '1747879200', // 2025.05.22 10:00
    endTime: '1749614340', // 2025.06.11 11:59
    itemId: '21040026',
    itemName: '悲喜剧',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.3 下半 周年复刻武器池 (5/5)
    startTime: '1747879200', // 2025.05.22 10:00
    endTime: '1749614340', // 2025.06.11 11:59
    itemId: '21020036',
    itemName: '不灭航路',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.4 上半
    startTime: '1749780000', // 2025.06.13 10:00
    endTime: '1751507940', // 2025.07.03 09:59
    itemId: '1409',
    itemName: '卡提希娅',
    itemType: 1,
    cardPoolName: '却也在风潮后轻舞',
  },
  {
    // 2.4 上半
    startTime: '1749780000', // 2025.06.13 10:00
    endTime: '1751507940', // 2025.07.03 09:59
    itemId: '21020056',
    itemName: '不屈命定之冠',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
  {
    // 2.4 下半
    startTime: '1751508000', // 2025.07.03 10:00
    endTime: '1753243140', // 2025.07.23 11:59
    itemId: '1207',
    itemName: '露帕',
    itemType: 1,
    cardPoolName: '胜利为我喝彩',
  },
  {
    // 2.4 下半
    startTime: '1751508000', // 2025.07.03 10:00
    endTime: '1753243140', // 2025.07.23 11:59
    itemId: '21010036',
    itemName: '焰痕',
    itemType: 2,
    cardPoolName: '浮声沉兵',
  },
]
