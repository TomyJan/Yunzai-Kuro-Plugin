import path from 'path'
import fs from 'fs'
import { pluginName, pluginNameReadable, pluginAuthor, pluginRepo, pluginDesc, pluginThemeColor, _ResPath, _CfgPath, _DataPath } from './data/system/pluginConstants.js'
import kuroLogger from './components/logger.js'

// 支持锅巴
export function supportGuoba() {
  const configPath = path.join(_CfgPath, 'config.json');
  const defaultConfigPath = path.join(_DataPath, 'system/default_config.json');

  let configJson;
  getConfigFromFile();
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
      iconPath: _ResPath + '/img/common/icon/pns.png',
    },
    // 配置项信息
    configInfo: {
      // 配置项 schemas
      schemas: [
        {
          field: 'logger.logLevel',
          label: '日志等级',
          helpMessage: '库洛插件的日志等级, 与 Yunzai 的独立',
          bottomHelpMessage: '请选择日志等级, 通常应选择 info',
          component: 'Select',
          componentProps: {
            options: [
              { label: 'debug', value: 'debug' },
              { label: 'info', value: 'info' },
              { label: 'warn', value: 'warn' },
              { label: 'error', value: 'error' }
            ],
            placeholder: '读取失败'
          }
        },
      ],
      // 获取配置数据方法（用于前端填充显示数据）
      getConfigData() {
        return configJson
      },
      // 设置配置的方法（前端点确定后调用的方法）
      setConfigData(data, {Result}) {
        kuroLogger.info('设置配置数据:', JSON.stringify(data))
        configJson = flattenObject(data)
        kuroLogger.info('展开后的配置数据:', JSON.stringify(configJson))
        let saveRst = updateConfigFile()
        if(saveRst)
          return Result.error(saveRst)
        else
          return Result.ok({}, '保存成功辣ε(*´･ω･)з')
      },
    },
  }

  function getConfigFromFile() {
    try {
      // 尝试读取config.json
      const rawData = fs.readFileSync(configPath);
      configJson = JSON.parse(rawData);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 如果config.json不存在，则从default_config.json复制一份
        kuroLogger.warn('config.json 不存在, 生成默认配置...');
        const defaultRawData = fs.readFileSync(defaultConfigPath);
        fs.writeFileSync(configPath, defaultRawData);
        configJson = JSON.parse(defaultRawData);
      } else {
        // 处理其他可能的读取错误
        kuroLogger.error('读取 config.json 出错:', error.message);
      }
    }
  }

/**
 * 更新配置文件
 * @returns {string | null} 返回错误信息，如果成功则返回null
 */
  function updateConfigFile() {
    try {
      fs.writeFileSync(configPath, JSON.stringify(configJson, null, 2));
      kuroLogger.info('更新配置文件成功');
      return null;
    } catch (error) {
      let errMsg = '更新配置文件失败: ' + error.message;
      kuroLogger.error(errMsg);
      return errMsg;
    }
  }

/**
 * 展开 json
 * @param {Object} inputJson 输入的 json
 * @returns {Object} 展开后的 json
 */
  function flattenObject(inputJson) {
    const outputJson = {};

    for (const key in inputJson) {
        const keys = key.split('.');
        let currentObject = outputJson;

        for (let i = 0; i < keys.length; i++) {
            const currentKey = keys[i];
            if (!currentObject[currentKey]) {
                currentObject[currentKey] = {};
            }

            if (i === keys.length - 1) {
                // 最后一个键，赋予值
                currentObject[currentKey] = inputJson[key];
            } else {
                // 还不是最后一个键，继续进入下一层对象
                currentObject = currentObject[currentKey];
            }
        }
    }

    return outputJson;
  }

}
