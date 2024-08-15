<div align=center>

[![State-of-the-art Shitcode](https://img.shields.io/static/v1?label=State-of-the-art&message=Shitcode&color=7B5804)](https://github.com/TomyJan/Yunzai-Kuro-Plugin)

# Yunzai-Kuro-Plugin

</div>

[Yunzai-Kuro-Plugin (库洛插件)](https://github.com/TomyJan/Yunzai-Kuro-Plugin) 是 [Yunzai-Bot](https://github.com/yoimiya-kokomi/Miao-Yunzai) 的 一个插件, 主要提供 库洛游戏 相关功能, 具体介绍见 [功能介绍](#功能介绍)

> 库洛插件是这样的, 库洛插件只要执行代码就行了, 可是玩家就很辛苦了, 什么时候绑定, 什么时候清体力, 什么时候秀抽卡记录, 都是要经过深思熟虑的

## 安装与维护

项目只在 GitHub 提供支持, Gitee 仅作为镜像仓库
安装前请先 [前往GitHub](https://github.com/TomyJan/Yunzai-Kuro-Plugin/) 点一下右上角的 Star, 这对我非常重要, 谢谢喵~

### 安装插件

插件更新强依赖 Git, 建议通过 Git 安装

#### 通过 Git 安装

在 Yunzai 根目录运行命令拉取插件:
```shell
git clone https://github.com/TomyJan/Yunzai-Kuro-Plugin.git ./plugins/Yunzai-Kuro-Plugin/
```

也可使用 Gitee 镜像(可能会滞后):
```shell
git clone https://gitee.com/TomyJan/Yunzai-Kuro-Plugin.git ./plugins/Yunzai-Kuro-Plugin/
```

#### 自行下载安装

下载插件包, 解压至 Yunzai `./plugins` 目录内并重命名文件夹为 `Yunzai-Kuro-Plugin`

### 安装依赖

```shell
pnpm install
```
### 更新插件

[更新日志](/CHANGELOG.md)

如通过 Git 安装, 在 Yunzai 根目录运行以下命令即可

```shell
git -C ./plugins/Yunzai-Kuro-Plugin/ pull
```

如为手动安装, 需要先备份插件 [数据目录](#数据目录) , 删除旧插件并解压新的插件后, 再将插件 [数据目录](#数据目录) 恢复进去, 即可完成更新

### 数据目录

`./config` 为插件配置目录

`./data` 为插件用户数据目录. 其中, `./data/system` 为插件系统数据, 不用备份

### 插件配置

建议通过 [锅巴插件](https://gitee.com/guoba-yunzai/guoba-plugin) 进行配置. 当然, 你也可以自己配置, 默认配置文件位置 `./data/system/default_config.json`, 配置文件位置 `./config/config.json`, 配置项作用:

```json
// 此处的 json 可能忘记更新, 如果和实际的配置文件字段不同, 请及时反馈
{
  "logger": { // 插件的日志器配置
    "logLevel": "info", // 日志等级, 可选值: trace, debug, info, warn, error, fatal
    "saveToFile": false // 是否保存日志到文件
  },
  "autoTask": { // 自动任务配置, 暂时只支持统一配置所有任务
    "enabled": true, // 是否启用自动任务
    "execTime": "0 2 0 * * ? " // 任务执行时间, cron 表达式, 默认每天 0 点 2 分 0 秒执行, 检查更新任务不受此配置影响
  },
  "useRandomBgInCard": true, // 卡片是否使用随机背景图
  "attemptSendNonFriend": true, // 即使非好友也尝试推送消息
  "botQQ": 0 // 机器人 QQ 号, 使用第三方适配器或者其他多账号框架时可能需要配置
}
```

## 功能介绍

插件帮助信息 `#库洛帮助` `kurohelp` , 所有指令的 `#` 前缀均可省略

### 登录相关

- [x] 通过服务器在线获取 token 登录库街区 `#库洛在线登录`
- [x] 提交验证码登录库街区 `#库洛验证码登录` **注意同一个验证码有效期内可以多次使用**
- [x] 提交 token 登录库街区 `#库洛token登录` [token 获取教程](https://blog.tomys.top/2023-07/kuro-token/)

注意, 由于库街区 APP 和他的垃圾游戏一样只允许单设备登录, 新生成 token 后老 token 会失效, 所以如果使用验证码登录, 那么你的帐号的 APP 和 机器人 的登录会互顶

### 签到相关

- [x] 库街区游戏签到 `#战双签到` `#鸣潮签到`
- [x] 库街区游戏签到定时任务 默认每天 00:02 自动开始签到并向用户私聊推送签到结果
- [x] 库街区库洛币任务 `#库街区每日`
- [x] 库街区社区任务定时任务 默认每天 00:02 自动开始签到并向用户私聊推送签到结果

### 活动相关

- [x] ~~一键活动任务 `#库街区一键活动`~~
- [x] ~~一键活动任务定时任务 每天 05:02 自动开始执行并向用户私聊推送签到结果~~

功能已失效, 后续修复

### 查询相关

- [x] 战双血清查询 `#战双体力` `#血清`, 血清恢复自动推送
- [x] 鸣潮结晶波片查询 `#鸣潮体力` `#结晶波片` `#波片`, 波片恢复自动推送
- [x] 库街区角色墙信息及 UID 切换 `#战双卡片` `#鸣潮卡片2` (鸣潮卡片样式仍在施工中)
- [x] 鸣潮抽卡记录(兼容国际服) `#鸣潮抽卡帮助` `#鸣潮角色记录` `鸣潮常驻武器记录`  `#鸣潮导出抽卡`([WWGF](https://uigf.org/))

### 小工具

- [x] ~~库街区自定义头像 `库洛头像帮助` 上传自定义头像~~ 跳脸被橄榄了

### 增强功能

- [x] 支持通过 [锅巴插件](https://gitee.com/guoba-yunzai/guoba-plugin) 进行配置

### 咕咕咕

- [x] 完善鸣潮卡片

- [x] 优化鸣潮抽卡分析卡片样式

- [x] 游戏签到获得物品和特殊奖励的显示

- [ ] 鸣潮抽卡记录获取及分析

  - [x] 通过链接上传抽卡记录
  - [x] 抽卡记录分析的展示
  - [x] [WWGF](https://uigf.org/) 格式的抽卡记录的导出
  - [ ] ~~[WWGF](https://uigf.org/) 格式的抽卡记录的导入~~我的协议不支持, 不会写

- [x] 鸣潮 / 战双体力查询, 通知
  - [x] 体力查询
  - [x] 体力恢复通知

- [x] 战双签到 指令的时间估计的修复 / 延时方法的修复

- [ ] 增加 游戏签到 补签功能

- [ ] 自动任务运行中记录运行进度, 以便重启后/第一次起洞时继续运行

- [ ] 修复失效的库街区一键活动功能

- [ ] 鸣潮, 战双卡片多样式

- [x] 使用账号 uid, 为每个账号生成独有的, 固定的请求头, 以增强安全性

- [ ] 库街区 Wiki 数据查询

  - [ ] 鸣潮
  - [ ] 战双

- [ ] 库街区战双游戏信息查询

  - [ ] 角色信息

  - [ ] 资源月报

  - [ ] 囚笼数据

- [ ] 库洛账号删除

## 关于

### 免责声明

- 功能仅限内部交流与小范围使用，请勿将 Yunzai-Kuro-Plugin 及其组件和衍生项目用于任何以盈利为目的的场景
- 图片与其他素材均来自于网络，仅供交流学习使用，如有侵权请联系处理

### 贡献/帮助

有 bug? 要新功能? [提交 Issue](https://github.com/TomyJan/Yunzai-Kuro-Plugin/issues/new)

帮助我开发? [提交 PR](https://github.com/TomyJan/Yunzai-Kuro-Plugin/compare)

插件有帮到你? [给我打赏](https://donate.tomys.top)

### 一起玩

[TG](https://t.me/TomyJan) | [Q 战双群](https://qun-pgr.tomys.top) | [Q 闲聊群](https://qun.tomys.top)

### 链接

- [Miao-Yunzai](https://github.com/yoimiya-kokomi/Miao-Yunzai)
- [Yunzai-Bot 索引库](https://gitee.com/yhArcadia/Yunzai-Bot-plugins-index)

### 致谢

- [xiaoyao-cvs-plugin](https://github.com/ctrlcvs/xiaoyao-cvs-plugin) 插件部分代码来源
- [yenai-plugin](https://github.com/yeyang52/yenai-plugin) 插件部分代码来源
- [Kuro-API-Collection](https://github.com/TomyJan/Kuro-API-Collection) 库街区 API 文档
- [WutheringWaves-UIResources](https://github.com/TomyJan/WutheringWaves-UIResources) 鸣潮 UI 资源解包
- [Gktwo](https://github.com/Gktwo) 佬的帮助
