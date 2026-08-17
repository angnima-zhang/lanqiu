# Godot 2D Shader 效果清单 & 迁移评估

> 来源：https://github.com/gdquest-demos/godot-shaders  
> 分析日期：2026-08-11  
> 项目目标引擎：Cocos Creator（Effect 系统）

---

## 一、2D Sprite / Canvas Item Shader（可直接作用于 Sprite 节点）

### 1. dissolve2D — 2D 溶解
- **描述**：基于噪声纹理的溶解效果，物体边缘燃烧后消失
- **参数**：
  - `dissolve_texture` — 溶解用的噪声贴图
  - `burn_color` — 燃烧边缘颜色
  - `burn_size` (0~2) — 燃烧边缘宽度
  - `dissolve_amount` (0~1) — 溶解进度（0=完整，1=消失）
  - `emission_amount` — 发光强度
- **核心算法**：用噪声贴图的 R 通道做 smoothstep 控制 alpha + emissive 燃烧边
- **迁移难度**：⭐ (低) — 纯 GLSL 片段着色器，逻辑清晰，Cocos Effect 直接翻译
- **适用场景**：角色/道具出场消失、死亡特效、场景切换过渡

### 2. dissolve2D_mask — 2D 遮罩溶解
- **描述**：溶解的简化版本，仅用遮罩控制消失（白色像素）调，无燃烧边发光
- **参数**：
  - `dissolve_texture` — 溶解遮罩
  - `burn_size` (0~2) — 过渡边缘宽度
  - `dissolve_amount` (0~1) — 溶解进度
- **迁移难度**：⭐
- **适用场景**：更简洁的消失效果，适合偏写实或不需要自发光的技术风格

### 3. outline2D_outer — 外描边
- **描述**：8 方向采样，在 sprite 透明区域外缘画出描边
- **参数**：
  - `line_color` — 描边颜色
  - `line_thickness` (0~10) — 描边粗细
- **核心算法**：对周围 8 个像素采样 alpha 并求和，alpha 差值为描边区域
- **迁移难度**：⭐ (低) — 标准 2D 描边算法
- **适用场景**：角色选中高亮、道具可交互提示、UI 按钮悬停/按下状态

### 4. outline2D_inner — 内描边
- **描述**：在 sprite 不透明区域内部边缘画描边
- **参数**：同上（`line_color` + `line_thickness`）
- **核心算法**：周围 8 像素 alpha 全部 > 0 则视为内部，乘积为 0 处为内边缘
- **迁移难度**：⭐
- **适用场景**：与 outer 配合或单独使用，适合需要"压边"效果的风格化美术

### 5. outline2D_inner_outer — 内外双描边
- **描述**：内描边 + 外描边合二为一
- **参数**：同上
- **迁移难度**：⭐
- **适用场景**：极简风格/扁平化美术路线，一个 shader 搞定所有描边需求

### 6. PalettSwap2D — 调色板换色
- **描述**：基于调色板纹理的像素颜色重映射，用原图 R 通道值做 U 坐标采样调色板
- **参数**：
  - `palette` — 调色板纹理（横向是替换色，纵向可有多套）
  - `palette_count` — 调色板套数
  - `palette_index` — 当前使用第几套（0 开始）
- **迁移难度**：⭐ (低)
- **适用场景**：皮肤系统、阵营颜色区分、角色换装、赛季主题色快速替换——**这个非常实用**

### 7. baked_sprite_glow — 烘焙发光
- **描述**：要求 sprite 图片自带辉光信息，shader 通过双重渲染 + alpha 衰减 + 色彩混合来强化/控制自发光效果
- **参数**：
  - `alpha_falloff_front/back` — 前后层辉光 alpha 衰减
  - `tint_front/back` — 前后层辉光颜色
  - `blend_amount` — 前后层混合比例
  - `falloff_max_alpha` — 超过此 alpha 不参与衰减（防止主体也被衰减）
- **核心思路**：同一纹理渲染两次（一个作为 front glow，一个作为 back glow），alpha 衰减 + 调色后 blend
- **迁移难度**：⭐⭐ (中) — 逻辑稍复杂，需要美术配合产出带辉光的素材
- **适用场景**：技能图标发光、道具稀有度品质光效、UI 高亮状态

### 8. glow_prepass — 发光预通道
- **描述**：仅替换 RGB 为 glow 色、保留原始 alpha，通常配合 compose/blur 使用
- **参数**：`glow_color` — 发光颜色
- **迁移难度**：⭐
- **适用场景**：后处理发光管线的一个环节

---

## 二、屏幕后处理 / Screen Shader（全屏效果或叠加层）

### 9. shockwave — 2D 冲击波/屏幕扭曲
- **描述**：基于遮罩纹理对屏幕 UV 做偏移，产生冲击波扭曲效果
- **参数**：
  - `mask_texture` — 遮罩纹理（R 通道控制扭曲强度）
  - `displacement_amount` — 最大位移量
- **迁移难度**：⭐⭐ (中) — 需要把屏幕渲染到纹理再处理，Cocos 需要后处理管线或 RenderTexture
- **适用场景**：得分震动、爆炸冲击屏、大招全屏震撼效果

### 10. gaussian_blur — 高斯模糊
- **描述**：单方向高斯模糊（71 采样点），通过 `blur_scale` 控制方向，两次不同方向 pass 获得二维模糊
- **参数**：`blur_scale` (vec2) — 模糊方向向量
- **迁移难度**：⭐ — 标准算法
- **适用场景**：暂停菜单背景、景深效果、UI 毛玻璃

### 11. pointilism — 点彩画风
- **描述**：后处理点彩艺术风格（类似修拉的点彩派），基于灰度值控制方块大小，带 hash 随机抖动避免机械感
- **参数**：无（硬编码 `SQUARE_SIZE_MAX = 8.0`）
- **迁移难度**：⭐ — 算法简单，适合做风格化尝试
- **适用场景**：特殊关卡/活动主题、回忆/梦境/艺术化滤镜

### 12. invert — 反色
- **描述**：最简单的反色效果，RGB 用 `1.0 - color` 反转
- **迁移难度**：⭐（一行代码）
- **适用场景**：短暂负面状态、受击闪白辅助

### 13. compose — 发光合成
- **描述**：将原始通道与模糊通道做差值得到辉光，叠加回原始画面
- **参数**：
  - `prepass_texture` — 原始预通道纹理
  - `blur_texture` — 高斯模糊后的纹理
  - `glow_intensity` — 发光强度
- **迁移难度**：⭐⭐ — 需要多 pass 纹理传递
- **适用场景**：完整的后处理发光管线（glow_prepass → gaussian_blur → compose）

---

## 三、2D 环境/场景效果

### 14. clouds2D — 2D 动态云影
- **描述**：两层噪声纹理混合滚动 + 渐变纹理映射，产生浮云投影飘过场景的效果。使用 `blend_mul` 模式叠加
- **参数**：
  - `tint` — 云影颜色
  - `noise_texture_2` — 第二层噪声纹理
  - `gradient_texture` — 渐变映射纹理
  - `scroll_direction_1/2` — 两层云滚动方向
  - `time_scale_1/2` — 滚动速度
  - `tile_factor_1/2` — 噪声平铺密度
- **迁移难度**：⭐⭐⭐ (中高) — 需要多张噪声纹理配合，但逻辑清晰。blend_mul 对应 Cocos 的混合模式
- **适用场景**：篮球场地的光影变化、云彩飘过效果——**和篮球项目匹配度很高**

### 15. water_2D — 2D 水面
- **描述**：侧视角水面效果，正弦波 + 噪声纹理叠加产生波浪位移，同时输出 NORMAL_MAP 用于光照
- **参数**：
  - `shadow_color` — 阴影/深水颜色
  - `tile_factor` — 水面纹理平铺密度
  - `aspect_ratio` — 纵横比拉伸
  - `texture_offset_uv` — 噪声偏移纹理
  - `sine_time_scale` / `sine_offset_scale` / `sine_wave_size` — 正弦波控制
- **迁移难度**：⭐⭐ (中) — 使用了 NORMAL_MAP 输出（Cocos Effect 管线可能需要适配）
- **适用场景**：2D 篮球场景中的水面/反射效果

### 16. xray_2d_mask — 2D X光透视遮罩
- **描述**：用遮罩纹理在局部显示另一个 viewport 的内容，未遮罩区域变暗，类似 X 光透视效果
- **参数**：
  - `alternate_viewport` — 要显示的另一个画面
  - `mask_viewport` — 遮罩纹理
  - `dimness` (0~1) — 未遮罩区域的暗度
- **迁移难度**：⭐⭐⭐ (中高) — 需要两个 viewport 纹理传入
- **适用场景**：技能范围指示器、透视墙后目标、特殊的 reveal 机制

---

## 四、噪声纹理生成器（canvas_item，常用于生成噪声贴图）

| 文件 | 说明 | 迁移价值 |
|---|---|---|
| perlin_noise | 经典 Perlin 噪声 | 噪声纹理贴图生成 |
| random_noise | 随机白噪声 | 基础噪声源 |
| value_noise | Value 噪声 | 更简单的噪声 |
| value_noise_layered | 多层 Value 噪声（FBM） | 分形噪声，云/火焰细节 |
| voronoi_noise | Voronoi/细胞噪声 | 水渍/龟裂/细胞质效 |

这些噪声 shader 可作为 dissolve、clouds 等效果的噪声源纹理生成工具。

---

## 五、迁移建议（按实用优先级排序）

### 🔴 高优先级（强烈建议迁移）

| 效果 | 原因 |
|---|---|
| **PalettSwap2D** | 极低迁移成本，极高美术灵活度 — 皮肤系统、阵营色一劳永逸 |
| **outline2D_outer / inner_outer** | 选中高亮、交互反馈刚需，2D 描边是棋牌/体育类标配 |
| **dissolve2D** | 出场/消失/死亡通用效果，几乎所有游戏都能用 |
| **clouds2D** | 与篮球场景天然匹配，场地光影提升沉浸感 |

### 🟡 中优先级（视需求选做）

| 效果 | 原因 |
|---|---|
| **shockwave** | 得分/大招震动，节奏感提升，但需要后处理管线 |
| **gaussian_blur** | 通用后处理基础，配合其他效果使用 |
| **baked_sprite_glow** | 品质感提升，但需要美术配合改素材 |
| **water_2D** | 如果场景有水元素则直接可用 |

### 🟢 低优先级（锦上添花）

| 效果 | 原因 |
|---|---|
| **pointilism** | 纯风格化，特殊活动才用 |
| **invert** | 太简单，需要时随时写 |
| **xray_2d_mask** | 特殊机制，按需迁移 |

---

## 六、技术迁移注意事项

1. **Godot shader_type canvas_item → Cocos Creator Effect**：Cocos 的 Effect 系统基于 GLSL，与 Godot 的 shader 语法高度相似，主要差异在：
   - `texture(TEXTURE, UV)` → Cocos 的 `texture(mainTexture, v_uv0)`
   - `TEXTURE_PIXEL_SIZE` → Cocos 的 `cc_screenSize` 或手动传入
   - `TIME` → Cocos 的 `cc_time.x`
   - `SCREEN_UV` → 需要 RenderTexture 或后处理 pass

2. **多 Pass 效果**（compose、glow 管线）：Cocos Creator 支持 RenderTexture + 自定义渲染管线，可以实现

3. **blend_mul 模式**（clouds2D）：Cocos Effect 支持自定义混合模式，`blend src: ONE dst: ONE` 可实现乘法叠加

4. **噪声纹理**：建议预生成好 PNG 噪声贴图放入资源，比运行时用 shader 生成更可控
