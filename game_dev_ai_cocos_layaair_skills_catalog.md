# 游戏开发、AI 工作方式、Cocos 与 LayaAir Agent Skills 调研

> 调研日期：2026-07-04  
> 范围：Codex / Claude Code / GitHub Copilot 等采用 `SKILL.md` 结构的 Agent Skills，以及可迁移到 Codex 的公开技能库。

## 结论先行

1. **游戏设计与游戏编程**已有质量较高的完整技能套装，首选 `gstack-game`、`game-development` 和 `game-developer`。
2. **AI 工具思考方式**适合组合安装，而不是寻找一个“大而全”的提示词：需求澄清、压力测试、架构观察、诊断、测试和复盘应拆成独立 Skill。
3. **Cocos Creator**能找到专项移动端优化 Skill，但数量和成熟度明显低于 Unity、Godot。
4. **LayaAir**暂未找到来源清晰、内容可审计、持续维护的专用 Agent Skill。
5. 对当前篮球经理项目，最实用的路线是：通用游戏设计套装＋Web/2D 游戏技能＋Cocos 专项优化；如果最终选择 LayaAir，则基于官方文档自建项目专用 Skill。
6. 第三方 Skill 可能包含可执行脚本。安装前必须查看 `SKILL.md`、脚本、依赖、网络访问和许可证，不应根据榜单一键批量安装。

## 一、当前环境已经可用的游戏开发 Skills

这些技能来自当前 Codex 的 `game-studio` 插件，可直接使用，不需要另行搜索或安装。

| Skill | 主要能力 | 适用阶段 | 对篮球经理项目的价值 |
|---|---|---|---|
| `game-studio:game-studio` | 游戏项目早期路由、技术栈与工作流选择 | 立项 | 判断 Phaser、Three.js 或 React Three Fiber 是否合适 |
| `game-studio:web-game-foundations` | 游戏循环、渲染边界、输入、存档、调试和性能架构 | 架构 | 规划模拟逻辑与 UI 表现的分离 |
| `game-studio:game-ui-frontend` | HUD、菜单、覆盖层和响应式布局 | UI 设计 | 制作球员、阵容、比赛和经营界面 |
| `game-studio:phaser-2d-game` | Phaser＋TypeScript＋Vite 的 2D 游戏实现 | 开发 | 很适合像素风篮球经理及比赛演出 |
| `game-studio:three-webgl-game` | 原生 Three.js 游戏运行时 | 3D 开发 | 仅在需要 3D 球场时考虑 |
| `game-studio:react-three-fiber-game` | React 状态与 3D 场景结合 | 3D/UI 混合 | 适合 React 管理界面＋3D 比赛 |
| `game-studio:sprite-pipeline` | 精灵序列生成、锚点与缩放规范化 | 美术管线 | 批量处理球员像素动画 |
| `game-studio:web-3d-asset-pipeline` | GLB/glTF 清理、压缩、碰撞、LOD | 3D 资产 | 仅在项目采用 3D 时使用 |
| `game-studio:game-playtest` | 浏览器实机、截图验证、HUD 与问题检查 | 测试 | 自动检查比赛模拟、菜单和覆盖层 |

## 二、游戏设计与完整制作流程

| 名称 | 来源 | 内容概览 | 优点 | 注意事项 | 推荐度 |
|---|---|---|---|---|---:|
| `gstack-game` | [fagemx/gstack-game](https://github.com/fagemx/gstack-game) | 27 个游戏制作 Skill，覆盖创意、方向、设计评审、平衡、玩家体验、UX、原型切片、实现交接、手感、QA、发布和复盘 | 流程完整，尤其擅长把模糊创意推进到可发布版本 | 安装与构建依赖 Bun；Windows 官方说明更推荐 Git Bash/WSL | ★★★★★ |
| `game-development` | [vudovn/ag-kit](https://github.com/vudovn/ag-kit/tree/main/.agent/skills/game-development) | 游戏开发路由 Skill，包含 Web、移动、PC、2D、3D、设计、多人、游戏美术和音频等子方向 | 原则清晰，强调固定时间步、对象池、事件系统、性能预算和输入抽象 | 属于大型技能库，建议只安装需要的部分 | ★★★★★ |
| `game-developer` | [Jeffallan/claude-skills](https://github.com/Jeffallan/claude-skills/tree/main/skills/game-developer) | ECS、物理、网络、性能、Shader、对象池、状态机和游戏 AI | 工程内容扎实，安装结构简单，MIT 许可 | Unity/Unreal 倾向较强，Web 引擎需自行迁移 | ★★★★☆ |
| `game-design` 子技能 | [vudovn/ag-kit](https://github.com/vudovn/ag-kit) | GDD、平衡、玩家心理、循环和设计原则 | 与 `game-development` 路由配套 | 安装前核对实际目录和版本 | ★★★★☆ |
| `balance-review` | [gstack-game](https://github.com/fagemx/gstack-game) | 经济、数值、难度和策略空间评审 | 很适合篮球经理的球员数值、薪资与成长曲线 | 它是评审工具，不代替数据模拟 | ★★★★★ |
| `player-experience` | [gstack-game](https://github.com/fagemx/gstack-game) | 从玩家视角检查节奏、反馈、挫败和理解成本 | 适合挂机/经理游戏的长线体验检查 | 需要配合真实玩家测试 | ★★★★★ |
| `prototype-slice-plan` | [gstack-game](https://github.com/fagemx/gstack-game) | 把大项目切成可玩的最小垂直切片 | 能防止一开始就制作完整赛季系统 | 需要先明确核心乐趣假设 | ★★★★★ |
| `feel-pass` | [gstack-game](https://github.com/fagemx/gstack-game) | 检查操作反馈、音效、特效、节奏与手感 | 可直接衔接本仓库的音效/特效触发表 | 经理游戏需把“手感”理解为反馈节奏 | ★★★★☆ |
| `game-qa` / `playtest` | [gstack-game](https://github.com/fagemx/gstack-game) | 游戏 QA、修复循环与可玩性验证 | 适合版本迭代和回归测试 | 浏览器自动化能力取决于本地工具 | ★★★★★ |

## 三、游戏编程与引擎专项 Skills

| 名称 | 引擎/平台 | 来源 | 主要能力 | 对本项目的适用性 |
|---|---|---|---|---|
| `phaser-2d-game` | Phaser | 当前 `game-studio` 插件 | Scene、相机、精灵动画、输入和 DOM HUD | **很高**：像素风 2D 篮球经理首选候选 |
| `web-game-foundations` | Web 通用 | 当前 `game-studio` 插件 | 模拟、渲染、输入、资产、存档和性能边界 | **很高**：无论选 Cocos/LayaAir/Phaser 都有价值 |
| `game-developer` | Unity/Unreal/通用 | [Jeffallan/claude-skills](https://github.com/Jeffallan/claude-skills/tree/main/skills/game-developer) | ECS、物理、多人、性能、Shader、设计模式 | 中：通用模式可迁移，引擎 API 不可直接照搬 |
| `unity-ecs-patterns` | Unity | [wshobson/agents](https://agentskills.me/skill/unity-ecs-patterns) | Unity ECS 架构与性能模式 | 低：可借鉴数据导向思路 |
| `godot-master` | Godot 4.5+ | [thedivergentai/gd-agentic-skills](https://github.com/thedivergentai/gd-agentic-skills) | 95+ 专项技能的总路由，覆盖 2D/3D/UI/玩法与多种游戏蓝图 | 中：内容丰富，但与 Cocos/LayaAir API 不同 |
| Godot Micro-Skills | Godot 4.5+ | [thedivergentai/gd-agentic-skills](https://github.com/thedivergentai/gd-agentic-skills/tree/main/skills) | 角色、背包、波次、生存、收集、计时、UI 等原子能力 | 中：适合查设计模式，不宜批量安装 |
| `game-playtest` | 浏览器游戏 | 当前 `game-studio` 插件 | 自动实机、截图 QA、HUD 检查 | **很高**：适合 Cocos、LayaAir 和 Phaser Web 构建 |

### Godot 技能库的重要警告

该仓库维护者明确不建议使用 `--all` 安装全部技能。一次安装 90 多个 Skill 会造成元数据拥挤、上下文消耗和指令冲突。应选择一个 `godot-master` 路由 Skill，或仅安装当前任务需要的 Micro-Skill。

## 四、Cocos Creator 相关 Skills

### 已找到的专用 Skill

| 名称 | 来源 | 能力 | 状态判断 | 推荐度 |
|---|---|---|---|---:|
| `cocos-mobile-optimizer` | [SkillsMP 页面](https://skillsmp.com/creators/terryma2024/happyword/agents-skills-cocos-mobile-optimizer) | iOS/Android 性能、触控、电池、温控、移动 GPU、网络、包体和平台能力优化 | 确有 `SKILL.md` 与 references；公开数据的 Star/Fork 很少，属于早期、小众 Skill | ★★★☆☆ |

### 适合与 Cocos 配套使用的通用 Skills

| 需求 | 推荐 Skill | 原因 |
|---|---|---|
| Cocos 项目架构 | `web-game-foundations` | Cocos Web/小游戏仍需要清晰的模拟、渲染和事件边界 |
| TypeScript 工程 | `diagnose`、`tdd` | 适合组件生命周期、资源加载和异步错误 |
| 移动端性能 | `cocos-mobile-optimizer` | 唯一搜索到的较明确 Cocos 专项 Skill |
| UI/菜单 | `game-ui-frontend` | 适合竖屏经理游戏的大量面板 |
| 实机验证 | `game-playtest` | 可测试 Cocos 导出的浏览器版本 |
| 资产处理 | `sprite-pipeline` | 可批量统一像素头像和动画资源 |

### 安装前检查

- 确认 Skill 对应的 Cocos Creator 主版本。
- 检查是否仍使用已废弃 API。
- 查看是否只包含说明，还是会执行脚本或修改项目设置。
- 不要把 Unity/Godot 的生命周期和组件模式原样套进 Cocos。

## 五、LayaAir 相关 Skills

### 搜索结果

截至调研日期，没有找到同时满足以下条件的 LayaAir 专用公开 Agent Skill：

- 有明确的 `SKILL.md`；
- 来源仓库和作者清晰；
- 内容可以在线审阅；
- 包含 LayaAir 3.x 的 API、生命周期、资源、UI、小游戏发布或性能实践；
- 近期仍有维护信号。

搜索结果中出现的大多是 LayaAir 引擎、Wiki、教程或普通提示词，并不是可安装的 Agent Skill，因此未列入推荐清单。

### 可用替代组合

| LayaAir 工作内容 | 可替代 Skill | 仍需补充的 LayaAir 专属知识 |
|---|---|---|
| TypeScript 游戏架构 | `web-game-foundations` | `Laya.Script`、Scene 生命周期、事件解绑 |
| 2D 像素游戏 | `phaser-2d-game` 作为模式参考 | Sprite、Animation、Timer、Tween 的 LayaAir 写法 |
| UI 系统 | `game-ui-frontend` | IDE UI、预制体、适配与层级规范 |
| 性能优化 | `game-developer` 的性能章节 | DrawCall、图集、资源释放、小游戏分包 |
| 浏览器测试 | `game-playtest` | LayaAir 构建和调试入口 |
| 资源管线 | `sprite-pipeline` | LayaAir 图集与资源路径约束 |

### 推荐：为项目自建 LayaAir Skill

比等待公开 Skill 更稳妥的方案，是制作一个 `layaair-basketball-manager` 项目 Skill，内容至少包括：

```text
layaair-basketball-manager/
├─ SKILL.md
├─ references/
│  ├─ architecture.md
│  ├─ layaair-3x-api-notes.md
│  ├─ scene-and-script-lifecycle.md
│  ├─ ui-and-resolution.md
│  ├─ asset-loading-and-release.md
│  ├─ performance-budget.md
│  └─ wechat-mini-game-build.md
├─ scripts/
│  ├─ validate-assets.*
│  └─ check-scene-references.*
└─ assets/
   └─ component-template.ts
```

Skill 应规定：

1. 只使用项目锁定版本中存在的 API。
2. 生成代码前先读取现有场景、脚本和资源组织。
3. 事件监听必须有对应解绑。
4. Timer、Tween 和异步加载在节点销毁时必须清理。
5. 频繁生成对象使用对象池。
6. UI 逻辑、比赛模拟和持久化数据分层。
7. 修改后必须构建并进行浏览器实机测试。

## 六、AI 工具“思考方式”Skills

这类 Skill 的价值不是让 AI “想得更久”，而是把不同认知任务拆成稳定流程。

| 名称 | 来源 | 思考方式 | 适合什么时候用 | 推荐度 |
|---|---|---|---|---:|
| `grill-me` | [akillness/jeo-skills](https://github.com/akillness/jeo-skills) | 沿决策树逐项追问，暴露未定义条件 | 立项、玩法规则尚模糊时 | ★★★★★ |
| `grill-with-docs` | [akillness/jeo-skills](https://github.com/akillness/jeo-skills) | 用领域文档压力测试设计，并回写上下文/ADR | 技术方案评审 | ★★★★★ |
| `zoom-out` | [akillness/jeo-skills](https://github.com/akillness/jeo-skills) | 从局部代码退后，观察模块、调用者和依赖 | 代码越来越乱但说不清原因时 | ★★★★★ |
| `diagnose` | [akillness/jeo-skills](https://github.com/akillness/jeo-skills) | 反馈回路→复现→假设→插桩→修复测试→清理 | Bug、性能和构建故障 | ★★★★★ |
| `tdd` | [akillness/jeo-skills](https://github.com/akillness/jeo-skills) | 红—绿—重构，以行为和公开接口为中心 | 比赛规则、经济系统和存档逻辑 | ★★★★☆ |
| `to-prd` | [akillness/jeo-skills](https://github.com/akillness/jeo-skills) | 把对话整理成问题、用户故事、模块和测试决策 | 需求冻结前 | ★★★★☆ |
| `to-issues` | [akillness/jeo-skills](https://github.com/akillness/jeo-skills) | 把计划拆为可独立领取的垂直切片任务 | 准备进入开发时 | ★★★★★ |
| `improve-codebase-architecture` | [akillness/jeo-skills](https://github.com/akillness/jeo-skills) | 用可测试性、局部性和删除测试寻找浅模块 | 中期架构治理 | ★★★★☆ |
| `notion-spec-to-implementation` | [OpenAI curated skills](https://github.com/openai/skills) | 从规格到实现计划和执行 | 团队使用 Notion 管需求时 | ★★★☆☆ |
| `define-goal` | [OpenAI curated skills](https://github.com/openai/skills) | 把开放任务收敛为持续目标 | 长期开发目标 | ★★★★☆ |
| `skill-creator` | [OpenAI skills](https://github.com/openai/skills/tree/main/skills/.system/skill-creator) | 创建、验证和改进自己的 Skill | Cocos/LayaAir 专项知识缺失时 | ★★★★★ |

## 七、推荐安装组合

### 组合 A：当前篮球经理 Web 版本

```text
game-studio:web-game-foundations
game-studio:game-ui-frontend
game-studio:phaser-2d-game
game-studio:sprite-pipeline
game-studio:game-playtest
gstack-game 中的 game-direction / balance-review / player-experience / game-qa
diagnose
to-issues
```

特点：2D 像素风、浏览器运行、快速迭代，和当前项目最匹配。

### 组合 B：Cocos Creator 小游戏

```text
web-game-foundations
game-ui-frontend
game-playtest
sprite-pipeline
cocos-mobile-optimizer
gstack-game 的设计与 QA Skills
diagnose
tdd
```

特点：保留通用游戏流程，用一个 Cocos 专项 Skill 补足移动端优化。

### 组合 C：LayaAir 小游戏

```text
web-game-foundations
game-ui-frontend
game-playtest
sprite-pipeline
gstack-game 的设计与 QA Skills
diagnose
tdd
自建 layaair-basketball-manager
```

特点：第三方专用 Skill 缺失，因此把官方文档、项目规范和已验证代码沉淀成自有 Skill。

## 八、不建议的做法

- 不要一次安装几十或上百个 Skill。
- 不要只看 Skill 市场页面的标题就安装。
- 不要安装无许可证、无仓库、无法查看 `SKILL.md` 的条目。
- 不要让 Skill 自动执行未知的 `curl | sh`、安装全局依赖或读取密钥。
- 不要混装多个职责重叠的“大师级”Skill。
- 不要让通用 Skill 猜测 Cocos/LayaAir API；应以锁定版本的官方文档和项目代码为准。
- 不要把 Prompt 合集误认为 Agent Skill；至少应存在结构清晰的 `SKILL.md`。

## 九、安装前安全检查表

| 检查项 | 通过标准 |
|---|---|
| 来源 | GitHub 仓库、作者和提交历史可见 |
| 许可证 | 明确允许使用和修改 |
| 内容 | 可完整查看 `SKILL.md` 与 references |
| 脚本 | 无未知下载、提权、密钥读取和破坏性操作 |
| 依赖 | 安装范围明确，不污染全局环境 |
| 版本 | 与当前引擎主版本兼容 |
| 触发描述 | 范围清晰，不会对无关任务误触发 |
| 重叠程度 | 不与现有 Skill 大量重复 |
| 验证流程 | 有构建、测试或实机检查要求 |
| 维护信号 | 近期提交、Issue 或版本记录合理 |

## 十、来源与目录

- [OpenAI Codex：Agent Skills 官方说明](https://developers.openai.com/codex/skills)
- [OpenAI 官方 Skills 仓库](https://github.com/openai/skills)
- [gstack-game：完整游戏制作流程](https://github.com/fagemx/gstack-game)
- [vudovn/ag-kit：game-development 路由 Skill](https://github.com/vudovn/ag-kit)
- [Jeffallan/claude-skills：game-developer](https://github.com/Jeffallan/claude-skills/tree/main/skills/game-developer)
- [Cocos Mobile Optimizer](https://skillsmp.com/creators/terryma2024/happyword/agents-skills-cocos-mobile-optimizer)
- [Godot Agentic Skills](https://github.com/thedivergentai/gd-agentic-skills)
- [akillness/jeo-skills：AI 开发工作流 Skills](https://github.com/akillness/jeo-skills)
- [Agent Skills 目录中的 Game Developer](https://agent-skills.md/skills/Jeffallan/claude-skills/game-developer)
- [Agent Skills 目录中的 Game Development](https://agent-skills.md/skills/vudovn/antigravity-kit/game-development)
- [GitHub Copilot：Custom Skills 结构说明](https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/skills)
