<div align=center>

[![State-of-the-art Shitcode](https://img.shields.io/static/v1?label=State-of-the-art&message=Shitcode&color=7B5804)](https://github.com/TomyJan/Yunzai-Kuro-Plugin)

# Yunzai-Kuro-Plugin

</div>

[Yunzai-Kuro-Plugin (库洛插件)](https://github.com/TomyJan/Yunzai-Kuro-Plugin) 是 [Yunzai-Bot](https://github.com/yoimiya-kokomi/Miao-Yunzai) 的 一个插件, 主要提供 库洛游戏 相关功能, 具体介绍见 [功能介绍](#功能介绍) 

> 库洛插件是这样的, 库洛插件只要执行代码就行了, 可是玩家就很辛苦了, 什么时候绑定, 什么时候清体力, 什么时候秀抽卡记录, 都是要经过深思熟虑的

## 安装与维护

安装前请先点一下右上角的 Star, 这对我非常重要, 谢谢喵~

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

如是通过 Git 安装, 在 Yunzai 根目录运行以下命令即可

```shell
git -C ./plugins/Yunzai-Kuro-Plugin/ pull
```

如为手动安装, 需要先备份插件 [数据目录](#数据目录) , 删除旧插件并解压新的插件后, 再将插件 [数据目录](#数据目录) 恢复进去, 即可完成更新

### 数据目录

`./config` 为插件配置目录

`./data` 为插件用户数据目录. 其中, `./data/system` 为插件系统数据, 不用备份

## 功能介绍

插件帮助信息 `#库洛帮助` `kurohelp` 

### 登录相关

- [x] 提交验证码登录库街区 `#库洛验证码登录` 同一个验证码有效期内可以多次使用
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

- [x] 库街区角色墙信息及 UID 切换 `#战双卡片` `#鸣潮卡片2` (鸣潮卡片样式仍在施工中)
- [x] 鸣潮抽卡记录 `#鸣潮抽卡记录帮助` `鸣潮角色记录` `鸣潮常驻武器记录` (记录网页样式仍在施工中)

### 小工具

- [x] ~~库街区自定义头像 `库洛头像帮助` 上传自定义头像~~ 跳脸被橄榄了

### 增强功能

- [x] 支持通过 [锅巴插件](https://gitee.com/guoba-yunzai/guoba-plugin) 进行配置

### 咕咕咕

- [ ] 完善鸣潮卡片

- [ ] 优化战双抽卡分析卡片样式

- [ ] 游戏签到获得物品和特殊奖励的显示

- [ ] 鸣潮抽卡记录获取及分析

  - [x] 通过链接上传抽卡记录
  - [ ] 从本地上传抽卡记录
  - [ ] [UIGF](https://uigf.org/) 格式的抽卡记录的导入与导出

- [ ] 鸣潮 / 战双体力查询, 通知

- [ ] 战双签到 指令的时间估计的修复 / 延时方法的修复

- [ ] 增加 游戏签到 补签功能

- [ ] 自动任务运行中记录运行进度, 以便重启后/第一次起洞时继续运行

- [ ] 修复失效的库街区一键活动功能

- [ ] 鸣潮, 战双卡片多样式

- [ ] 使用账号 uid, 为每个账号生成独有的, 固定的请求头, 以增强安全性

- [ ] 库街区 Wiki 数据查询

  - [ ] 鸣潮
  - [ ] 战双

- [ ] 库街区战双游戏信息查询你

  - [ ] 角色信息

  - [ ] 资源月报

  - [ ] 囚笼数据

- [ ] 库洛账号删除

## 关于

### 免责声明

- 功能仅限内部交流与小范围使用，请勿将 Yunzai-Kuro-Plugin 及其组件和衍生项目用于任何以盈利为目的的场景
- 图片与其他素材均来自于网络，仅供交流学习使用，如有侵权请联系处理

### 贡献/帮助

[提交 issue](https://github.com/TomyJan/Yunzai-Kuro-Plugin/issues/new) | [提交 pr](https://github.com/TomyJan/Yunzai-Kuro-Plugin/compare) | 如果插件有帮到你, 欢迎 [给我打赏](https://donate.tomys.top) 

### 一起玩

[TG](https://t.me/TomyJan) | [Q 战双群](https://qun-pgr.tomys.top) | [Q 闲聊群](https://qun.tomys.top) 

### 链接

- [Miao-Yunzai](https://github.com/yoimiya-kokomi/Miao-Yunzai)
- [Yunzai-Bot 索引库](https://gitee.com/yhArcadia/Yunzai-Bot-plugins-index)

### 致谢

- [xiaoyao-cvs-plugin](https://github.com/ctrlcvs/xiaoyao-cvs-plugin) 插件部分代码来源
- [yenai-plugin](https://github.com/yeyang52/yenai-plugin) 插件部分代码来源
- [Kuro-API-Collection](https://github.com/TomyJan/Kuro-API-Collection) 库街区 API 文档
