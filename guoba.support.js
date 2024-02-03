import path from 'path'
import { pluginName, pluginNameReadable, pluginAuthor, pluginRepo, pluginDesc, pluginThemeColor, resPath } from './data/system/pluginConstants.js'

// 支持锅巴
export function supportGuoba() {
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
      iconPath: path.join(resPath, 'resources/img/common/icon/kuro.png'),
    },
    // 配置项信息
    configInfo: {
      // 配置项 schemas
      schemas: [
        {
          field: 'logger.loggerLevel',
          label: '日志等级',
          helpMessage: '库洛插件的日志等级, 与 Yunzai 的独立',
          bottomHelpMessage: '填写日志等级',
          component: 'Input',
          componentProps: {
            placeholder: '请输入日志等级',
          },
        },
      ],
      // 获取配置数据方法（用于前端填充显示数据）
      getConfigData() {
        config.logger.loggerLevel = 'info'
        return config
      },
      // 设置配置的方法（前端点确定后调用的方法）
      setConfigData(data, {Result}) {
        return Result.ok({}, '保存成功辣ε(*´･ω･)з')
      },
    },
  }
}
