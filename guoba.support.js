import path from 'path'
import fs from 'fs'
import {
  pluginName,
  pluginNameReadable,
  pluginAuthor,
  pluginRepo,
  pluginDesc,
  pluginThemeColor,
  _ResPath,
  _CfgPath,
  _DataPath,
} from './data/system/pluginConstants.js'
import kuroLogger from './components/logger.js'
import { sendMsgFriend } from './model/utils.js'
import cfg from '../../lib/config/config.js'

// 支持锅巴
export function supportGuoba() {
  const configPath = path.join(_CfgPath, 'config.json')
  const defaultConfigPath = path.join(_DataPath, 'system/default_config.json')

  let configJson
  getConfigFromFile()
  return {
    // 插件信息，将会显示在前端页面
    // 如果你的插件没有在插件库里，那么需要填上补充信息
    // 如果存在的话，那么填不填就无所谓了，填了就以你的信息为准
    pluginInfo: {
      name: pluginName,
      title: pluginNameReadable,
      author: pluginAuthor,
      authorLink: pluginRepo,
      link: pluginRepo,
      isV3: true,
      isV2: false,
      description: pluginDesc,
      // 显示图标，此为个性化配置
      // 图标可在 https://icon-sets.iconify.design 这里进行搜索
      icon: 'arcticons:kuro-reader',
      // 图标颜色，例：#FF0000 或 rgb(255, 0, 0)
      iconColor: pluginThemeColor,
      // 如果想要显示成图片，也可以填写图标路径（绝对路径）
      iconPath: _ResPath + '/img/common/icon/kuro.png',
    },
    // 配置项信息
    configInfo: {
      // 配置项 schemas
      schemas: [
        {
          component: 'Divider',
          label: '日志设置',
        },
        {
          field: 'logger.logLevel',
          label: '日志等级',
          helpMessage: '库洛插件内置的日志记录器的日志等级, 与 Yunzai 的独立',
          bottomHelpMessage: '更改即时生效, 通常应选择 info',
          component: 'Select',
          componentProps: {
            options: [
              { label: 'debug', value: 'debug' },
              { label: 'info', value: 'info' },
              { label: 'warn', value: 'warn' },
              { label: 'error', value: 'error' },
            ],
            placeholder: '配置项异常',
          },
        },
        {
          field: 'logger.saveToFile',
          label: '保存日志',
          helpMessage: '独立保存库洛插件的日志到 插件根目录/data/logs/',
          bottomHelpMessage: '更改即时生效, 通常不建议启用',
          component: 'Switch',
        },
        {
          component: 'Divider',
          label: '自动任务设置',
        },
        {
          field: 'autoTask.enabled',
          label: '启用自动任务',
          helpMessage:
            '若关闭, 将一同关闭插件的检查更新任务, 但是插件每次被载入仍会检查更新',
          bottomHelpMessage: '更改重启生效, 插件的游戏和社区自动签到任务',
          component: 'Switch',
        },
        {
          field: 'autoTask.execTime',
          label: '任务执行时间',
          helpMessage:
            '默认为每天 00:02:00 自动执行, 暂不可配置检查更新任务(默认每天 6/18 点检查)和游戏体力推送任务(默认每小时刷新一次)',
          bottomHelpMessage:
            '更改重启生效, 自动任务执行时间, 参考 https://www.runoob.com/linux/linux-comm-crontab.html',
          component: 'Input',
        },
        {
          component: 'Divider',
          label: '其他设置',
        },
        {
          field: 'useRandomBgInCard',
          label: '随机背景图',
          helpMessage:
            '卡片是否使用随机背景图, 获取失败会回退到最后一张图或者本地背景图, 本地默认背景图: 插件根目录/resources/img/common/bg/Alisa-Echo_0.jpg',
          bottomHelpMessage:
            '更改即时生效, 背景图 API: https://api.tomys.top/api/pnsWallPaper 均为战双官方壁纸',
          component: 'Switch',
        },
        {
          field: 'attemptSendNonFriend',
          label: '发送非好友',
          helpMessage: '自动任务推送等场景用到',
          bottomHelpMessage: '更改即时生效, 是否尝试向非好友发送消息',
          component: 'Switch',
        },
        {
          field: 'botQQ',
          label: '机器人QQ',
          helpMessage: '留空则为自动获取',
          bottomHelpMessage: '更改即时生效, 使用某些第三方适配器可能需要设置',
          component: 'Input',
        },
      ],
      // 获取配置数据方法（用于前端填充显示数据）
      getConfigData() {
        return configJson
      },
      // 设置配置的方法（前端点确定后调用的方法）
      setConfigData(data, { Result }) {
        configJson = flattenObject(data)
        kuroLogger.debug('欲保存的新配置数据:', JSON.stringify(configJson))
        let saveRst = updateConfigFile()
        if (saveRst) return Result.error(saveRst)
        else return Result.ok({}, '保存成功辣ε(*´･ω･)з')
      },
    },
  }

  function getConfigFromFile() {
    try {
      // 尝试读取config.json
      const rawData = fs.readFileSync(configPath)
      configJson = JSON.parse(rawData)

      // 读取 default_config.json
      const defaultRawData = fs.readFileSync(defaultConfigPath)
      const defaultConfigJson = JSON.parse(defaultRawData)

      // 比较配置文件更新
      let testConfigJson = mergeObjects(defaultConfigJson, configJson)
      if (JSON.stringify(testConfigJson) !== JSON.stringify(configJson)) {
        kuroLogger.warn('配置文件有更新, 建议检查是否有新的项目需要配置!')
        kuroLogger.debug('testConfigJson:', JSON.stringify(testConfigJson))
        kuroLogger.debug('configJson:', JSON.stringify(configJson))
        configJson = testConfigJson
        updateConfigFile()
        sendMsgFriend(
          cfg.masterQQ[0],
          `[库洛插件] 配置文件有更新, 建议检查是否有新的项目需要配置!`
        )
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 如果config.json不存在，则从default_config.json复制一份
        kuroLogger.warn('config.json 不存在, 生成默认配置...')
        const defaultRawData = fs.readFileSync(defaultConfigPath)
        fs.writeFileSync(configPath, defaultRawData)
        configJson = JSON.parse(defaultRawData)
      } else {
        // 处理其他可能的读取错误
        kuroLogger.error('读取 config.json 出错:', error.message)
      }
    }
  }

  /**
   * 更新配置文件
   * @returns {string | null} 返回错误信息，如果成功则返回null
   */
  function updateConfigFile() {
    try {
      fs.writeFileSync(configPath, JSON.stringify(configJson, null, 2))
      kuroLogger.info('更新配置文件成功')
      return null
    } catch (error) {
      let errMsg = '更新配置文件失败: ' + error.message
      kuroLogger.error('更新配置文件失败:', errMsg)
      return errMsg
    }
  }

  /**
   * 展开 json
   * @param {Object} inputJson 输入的 json
   * @returns {Object} 展开后的 json
   */
  function flattenObject(inputJson) {
    const outputJson = {}

    for (const key in inputJson) {
      const keys = key.split('.')
      let currentObject = outputJson

      for (let i = 0; i < keys.length; i++) {
        const currentKey = keys[i]

        if (i === keys.length - 1) {
          // 最后一个键，赋予值
          currentObject[currentKey] = inputJson[key]
        } else {
          // 还不是最后一个键，继续进入下一层对象
          if (!currentObject[currentKey]) {
            // 如果下一个值是数组（通过看key是否为数字判断），则初始化为数组，否则为对象
            const nextKey = keys[i + 1]
            const isNextKeyNumeric =
              !isNaN(parseInt(nextKey, 10)) &&
              nextKey.toString() === parseInt(nextKey, 10).toString()
            currentObject[currentKey] = isNextKeyNumeric ? [] : {}
          }
          currentObject = currentObject[currentKey]
        }
      }
    }

    return outputJson
  }

  /**
   * 使用 newObj 补充 oldObj 缺失的字段
   * @param {Object} newObj 新对象
   * @param {Object} oldObj 旧对象
   * @returns {Object} 合并后的对象
   */
  function mergeObjects(newObj, oldObj) {
    let mergedObj = { ...oldObj }

    // 如果是数组，直接返回旧数组或新数组
    if (Array.isArray(newObj)) {
      return Array.isArray(oldObj) ? oldObj : newObj
    }

    for (const key in newObj) {
      // 处理数组的情况
      if (Array.isArray(newObj[key])) {
        // 如果旧对象中不存在该键或者旧对象中该键不是数组，则使用新对象中的数组
        if (!(key in mergedObj) || !Array.isArray(mergedObj[key])) {
          mergedObj[key] = [...newObj[key]]
        }
        // 如果都是数组，保留旧数组
      }
      // 处理对象的情况
      else if (typeof newObj[key] === 'object' && newObj[key] !== null) {
        if (!(key in mergedObj)) {
          mergedObj[key] = {}
        }
        // 递归合并子对象
        mergedObj[key] = mergeObjects(newObj[key], mergedObj[key])
      }
      // 处理基本类型
      else if (!(key in mergedObj)) {
        mergedObj[key] = newObj[key]
      }
    }
    return mergedObj
  }
}
