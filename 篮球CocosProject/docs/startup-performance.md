# TapTap 冷启动排查：第一轮

## 本轮变更

- Loading 启动后，并行进行云存档恢复、Homepage 场景预加载和静态 JSON 加载。
- 静态预加载只读取资源，不读取阵容、管理层等级或初始化预算。
- 云恢复结束（或现有服务安全降级为本地存档）后，才读取最新阵容并预热头像等资源。
- 所有启动依赖就绪后才进入主页；资源加载完成但存档未确认时，进度不会显示为100%。
- 保留云存档冲突确认、失败时禁用云同步、超时后禁止晚到恢复等原有保护。
- 保留现有 resources/main 启动依赖、字体和图片；大分包拆分是下一轮工作，不在本轮更改。

## 重新构建

本轮改动了 TapTap 转换扩展，需保存编辑器工作并完整退出、重开 Cocos Creator，然后通过原有官方构建任务重新构建并转换。不要直接改旧 ZIP。

新生成的 `build/TapBuild/game.zip` 内 `game.json` 应包含 `convertScriptVersion: 2.0.8-ts`。
本地测试和编辑器导入不代表新包已生成，也不代表 PCEM00 准入已通过。

转换器修改位于 `extensions/taptap-minigame-tools/dist/converter-ts.js` 和 `extensions/taptap-minigame-tools/converter/wx_unity_converter/wx_unity.js`。当前仓库忽略整个 extensions 目录，后续上传 Git 时需要显式纳入这两个文件，不能只提交 assets 代码。

## 日志读取

筛选设备日志中的 `[StartupTiming]`。所有 `+Nms` 是相对同一时间起点的累计时间，不要把并行阶段直接相加。

| 标记 | 含义 |
| --- | --- |
| game-entry | TapTap 开始执行 game.js；不包含此前的宿主启动和首包下载 |
| engine-module-ready | cc 模块可用，尚未完成引擎初始化 |
| engine-initialized | Cocos 引擎初始化完成 |
| project-preload-start / ready | Cocos 项目初始化区间，包含启动 Bundle 加载、项目脚本及渲染准备，不是纯网络下载时间 |
| loading-scene-onload | Loading 场景开始执行 onLoad |
| cloud-restore-start / ready | 云存档初始化等待区间；ready 也可能是已按原逻辑降级本地，结合 TapCloudSave 错误日志判断 |
| homepage-static-start / ready | 静态配置预加载区间，含失败重试等待 |
| homepage-scene-preload-start / ready | Homepage 场景文件预加载区间，含失败重试等待 |
| homepage-roster-warmup-start / ready | 云存档确认后的阵容资源预热区间 |
| homepage-dependencies-ready | 启动依赖全部完成 |
| homepage-activation-start / scene-activated | Homepage 场景加载、激活区间 |
| homepage-recruitment-ready | 主页招募初始化完成、相关按钮刷新；不是伪造的平台“可交互”上报 |

微信和 Creator 预览没有 TapTap 转换入口，日志会显示 `from game-script`，不能用于测量进入游戏脚本之前的耗时。

## 验证重点

1. 在 PCEM00 重跑准入，保留平台总冷启动耗时和上述日志；未重测前不承诺具体优化秒数。
2. 新账号、云端有存档的新设备、已有本地存档分别验证预算和阵容，无错误重置或晚到覆盖。
3. 云请求失败/超时、资源失败重试时仍能正确降级或提示，不重复恢复、不重复进入主页。
4. 若 cloud 区间接近10秒，优先排查云接口返回；若 project-preload 区间占主导，下一轮拆分启动必载 resources 大包。
