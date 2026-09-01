# TapTap 云存档

入口：`assets/scripts/loading/LoadingController.ts` 在预加载 Homepage 之前等待 `initializeTapCloudSave()`。无需在场景上再挂一个组件，也不需要填写广告 ID、密钥或存档 ID。

## 行为

- 仅在非 Creator 预览且存在 `tap.getCloudSaveManager` / `tap.getFileSystemManager` 时启用。微信和浏览器继续只使用原本的本地存档。
- 当前 TapTap 账号使用固定槽名 `basketball_auto_save_v1`。文件先写入 `tap.env.USER_DATA_PATH`，再创建/更新云存档。
- 收集本地 `basketball.*` 进度：预算、阵容、球队名称/缩写、球队等级/斗志、赛季、管理层、球员履历/问答、招募保底/概率加成、离线收益和音效设置。排除 `basketball.cloud.*` 同步元数据与本地预览重置标记。
- 新设备没有本地进度时自动恢复云端；云端版本与本机上次同步一致时保留本机后续进度；两端存在不同版本时弹窗选择「使用云端」或「保留本地」，不按预算大小判定进度新旧。
- 每 65 秒检查变化并上传，切后台/返回前台也尝试上传，但不能绕过限频。保存相同内容不会重复上传；同步时发生的新进度留到下一次保存。
- 本地写盘仍按原玩法即时执行。云端最多落后一个同步周期；退出过快、限频或系统挂起时，不保证最后一次后台上传成功。
- 读取失败、未知格式、损坏数据或备份失败时保留本地，本次运行不上传。原生 API 超时也暂停同步，防止尚未完成的调用与重试并发。重启游戏后重新读取云端。
- 每次上传前再次检查云端 `uuid/fileId`，发现其他设备更新则暂停上传并提示重启选择。平台接口不提供条件更新锁，因此不能保证两台设备同时写入的原子冲突处理；不要同时操作同一账号的两个设备。

## 文件与恢复

文件路径位于 `tap.env.USER_DATA_PATH`（通常为 `tapfile://usr`）：

- `basketball_auto_save.json`：本次准备上传的完整快照。
- `basketball_cloud_previous.json`：最近一次下载的云端版本，选择保留本地时仍保留该文件。
- `basketball_before_cloud_restore.json`：最近一次使用云端前的本地快照。

备份文件是本机最近一份恢复依据，不是云端版本历史；不要清理设备缓存后再尝试找回本机备份。不会删除平台上的其他存档槽。

格式为 `{ game: "basketball", version: 1, savedAt, data }`，`data` 保留各本地存储项的原始字符串。10 MB 上限按 UTF-8 字节检查。格式升级时需要显式迁移，不能把不识别的云端数据当作“没有存档”。

## 验证

在项目目录运行：

```powershell
node --test tests/tap-cloud-save.test.cjs
```

测试使用本机 Creator 扩展附带的 TypeScript，在内存里编译真实源文件并模拟平台接口，不连接真实 TapTap 账号。覆盖云端恢复、冲突选择、备份失败回滚、断网/超时、上传限频、重复调用、云端版本变化、微信隔离、生命周期和 Loading 启动顺序。

真机仍需重新用 Creator 构建 TapTap 包（本次未改旧 build 产物），从 Loading 场景启动，并检查 `[TapCloudSave]` 日志：

1. 首次运行/已有本地进度：游玩并等待 65 秒，确认出现 `Progress uploaded`。
2. 同一账号另一设备：确认预算、球员、球队等级、赛程、广告保底等整体恢复。
3. 两台设备有不同版本：重新启动，确认弹窗选本地/云端的行为和备份文件。
4. 断网启动、短时间切前后台、完整退出重开：确认本地进度保留，且没有超频上传或用新档覆盖旧云档。
5. 预览和微信包：确认没有调用 TapTap 云存档接口。

官方资料：[接入指南](https://developer.taptap.cn/minigameapidoc/dev/tutorial/open-capabilities/cloud-save-tutorial/)、[创建](https://developer.taptap.cn/minigameapidoc/dev/api/open-api/cloudsave/CloudSaveManager.createArchive/)、[更新](https://developer.taptap.cn/minigameapidoc/dev/api/open-api/cloudsave/CloudSaveManager.updateArchive/)、[下载](https://developer.taptap.cn/minigameapidoc/dev/api/open-api/cloudsave/CloudSaveManager.getArchiveData/)。云存档管理器要求基础库 2.0.0 起支持。
