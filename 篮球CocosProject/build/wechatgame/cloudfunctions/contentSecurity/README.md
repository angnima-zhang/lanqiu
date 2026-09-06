# 微信内容安全云函数

`contentSecurity` 必须部署到小游戏 AppID `wxa4508bb75a0e6f55` 关联的微信云开发环境，客户端不会保存 AppSecret 或 access_token。

## 部署

1. 用 Cocos Creator 重新构建微信小游戏；本构建模板会自动复制 `cloudfunctions` 并写入 `cloudfunctionRoot`。
2. 在微信开发者工具中为该小游戏开通云开发，并选定默认环境。
3. 右键 `cloudfunctions/contentSecurity`，选择上传并部署（云端安装依赖）。
4. 确认云函数拥有 `wxa.game.contentSpam.msgSecCheck` 和 `security.mediaCheckAsync` 两项 OpenAPI 权限。
5. 真机修改球队名称：正常名称应保存，风险名称和云函数失败均不得保存。

## 接口

- `checkText`：同步审核球队名称，使用 `scene: 1`，只有 `suggest: pass` 才允许客户端保存。
- `checkMedia`：提交图片或音频异步审核，返回 `traceId`。正式展示用户媒体前，还必须在微信公众平台配置消息接收服务器，按 `wxa_media_check` 推送结果决定通过、复核或拦截。

`mediaCheckAsync` 当前没有绑定游戏功能，因为项目暂未开放用户上传图片或音频；云函数和客户端提交方法已经预留完成。
