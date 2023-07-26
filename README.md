<div align=center>
[![State-of-the-art Shitcode](https://img.shields.io/static/v1?label=State-of-the-art&message=Shitcode&color=7B5804)](https://github.com/TomyJan/Yunzai-Kuro-Plugin)

# Yunzai-Kuro-Plugin

</div>

[Yunzai-Kuro-Plugin(库洛插件)](https://github.com/TomyJan/Yunzai-Kuro-Plugin) 是 [Yunzai-Bot](https://github.com/yoimiya-kokomi/Miao-Yunzai) 的 一个插件, 主要提供 库洛游戏 相关功能

> js真你妈难写, 操

## 安装教程

1. 下载插件压缩包, 解压至Yunzai `./plugin` 目录并重命名文件夹为 `Yunzai-Kuro-Plugin`

   (推荐) 或通过 Git 在 Yunzai 根目录运行命令拉取插件: 
   ```shell
   git clone https://github.com/TomyJan/Yunzai-Kuro-Plugin.git ./plugins/Yunzai-Kuro-Plugin/
   ```
   
   也可使用 Gitee 镜像(可能会滞后): 
   ```shell
   git clone https://gitee.com/TomyJan/Yunzai-Kuro-Plugin.git ./plugins/Yunzai-Kuro-Plugin/
   ```
   
2. 安装依赖
   ```shell
   pnpm install
   ```

## 功能介绍

插件帮助信息 `#库洛帮助` `kurohelp` 

### 登录相关

- [x] 提交验证码登录库街区 `#库洛验证码登录` 同一个验证码有效期内可以多次使用
- [x] 提交 token 登录库街区 `#库洛token登录` [token 获取教程](https://blog.tomys.top/2023-07/kuro-token/)

注意, 由于库街区 APP 和他的垃圾游戏一样只允许单设备登录, 新生成 token 后老 token 会失效, 所以如果使用验证码登录, 那么在你每次登录过 APP 后都需要重新登录机器人

### 签到相关

- [x] 库街区游戏签到(暂仅支持战双) `#战双签到`
- [x] 库街区游戏签到定时任务(暂仅支持战双) 每天 00:02 自动开始签到并向用户私聊推送签到结果
- [ ] 库街区库洛币任务 `#库街区每日`

### 查询相关

- [ ] 库街区角色墙信息

### 小工具

- [x] 库街区自定义头像 `库洛头像帮助` 上传自定义头像

### 咕咕咕

- [x] 代码重构: 将所有fetch请求提取到一个方法
- [ ] 代码重构: logger 套娃

## 关于

### 贡献/帮助

[提交 issue](https://github.com/TomyJan/Yunzai-Kuro-Plugin/issues/new) | [提交 pr](https://github.com/TomyJan/Yunzai-Kuro-Plugin/compare)

### 致谢

- [xiaoyao-cvs-plugin](https://github.com/ctrlcvs/xiaoyao-cvs-plugin) 插件部分代码来源
- [yenai-plugin](https://github.com/yeyang52/yenai-plugin) 插件部分代码来源
- [Kuro-API-Collection](https://github.com/TomyJan/Kuro-API-Collection) 库街区 API 文档
