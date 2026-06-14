# 开发日志

## 阶段 1：Electron + React 基础框架

**日期**：2026-06-08  
**状态**：✅ 完成

### 目标

- 可运行的 Electron + Vite + React + TypeScript 脚手架
- 透明无边框置顶桌宠窗口（右下角）
- IPC 骨架 + Zustand 状态壳
- Tailwind 深色主题基础

### 完成内容

| 模块 | 文件 | 职责 |
|------|------|------|
| 主进程入口 | `electron/main.ts` | 应用生命周期、创建窗口 |
| 窗口管理 | `electron/windowManager.ts` | 透明窗配置、右下角定位、bounds API |
| IPC | `electron/ipc/channels.ts` | 通道常量与类型 |
| IPC | `electron/ipc/handlers.ts` | `getAppInfo`、鼠标穿透、bounds |
| Preload | `electron/preload.ts` | `contextBridge` → `window.electronAPI` |
| 渲染入口 | `src/main.tsx` | React 挂载 |
| 应用壳 | `src/App.tsx` | 模式切换路由 |
| 桌宠占位 | `src/app/modes/PetMode.tsx` | 毛玻璃占位 + hover 反馈 |
| 状态 | `src/stores/appStore.ts` | `mode` / `isHovered` / `version` |
| 构建 | `vite.config.ts` | vite-plugin-electron 联调 |

### 设计决策

1. **vite-plugin-electron/simple** — 单命令 `npm run dev` 同时启动 Vite 与 Electron，降低联调成本。
2. **220×220 初始窗口** — 足够展示小桌宠，阶段 3 展开时通过 `setWindowBounds` 放大。
3. **DevTools detach 模式** — 开发时自动打开 detached DevTools，不遮挡透明窗调试。
4. **IPC 提前预留 bounds / ignoreMouse** — 避免阶段 2–3 重构主进程。

### 验收标准

- [x] `npm install` 成功
- [x] `npm run dev` 启动 Electron 透明窗
- [x] 窗口位于屏幕右下角
- [x] 占位 UI 有 hover 缩放与发光反馈
- [x] `window.electronAPI.getAppInfo()` 返回版本号

### 已知限制

- 尚未实现点击穿透（阶段 2 结合 `-webkit-app-region` 或动态 ignoreMouse）
- 尚未集成 Three.js / Tone.js / MediaPipe
- 生产打包脚本留待阶段 8

### 下一步：阶段 2 — 桌宠 UI

1. 引入 `@react-three/fiber` + `three`，桌宠 3D 精灵或精致 2.5D
2. Framer Motion 完善 idle / hover / click 动画
3. 环境粒子与呼吸灯边缘
4. 点击触发 expand 预备动画（可先不切 mode）

### 踩坑记录

- **PowerShell 不支持 `&&`**：在本机 PowerShell 中需用 `;` 分隔命令。
- **Electron 首次安装较慢**：`npm install` 需下载 Chromium 二进制，约 5–10 分钟。
- **tsconfig project references**：简化为单 `tsconfig.json`，`typecheck` 使用 `tsc --noEmit`。
- **preload 与 vite-env.d.ts 类型冲突**：全局 `Window.electronAPI` 仅在 `src/vite-env.d.ts` 声明。
- **DevTools Autofill 报错**：Electron 内置 DevTools 无害警告，可忽略。

---

## 阶段 2：桌宠 UI

**日期**：2026-06-08  
**状态**：✅ 完成

### 目标

- 简易小钢琴 SVG 图标作为桌宠主体
- Framer Motion idle / hover / click / expanding 动画
- 呼吸辉光 + R3F 环境粒子
- 点击展开预备动画（阶段 3 再切换 piano 模式）

### 完成内容

| 模块 | 文件 | 职责 |
|------|------|------|
| 小钢琴图标 | `features/pet/components/MiniPianoIcon.tsx` | 7 白键 + 5 黑键 SVG，霓虹琴体 |
| 桌宠主体 | `features/pet/components/DesktopPet.tsx` | 动效容器、点击交互 |
| 呼吸辉光 | `features/pet/components/PetGlow.tsx` | 径向光晕 + 边框发光 |
| 环境粒子 | `features/pet/components/PetParticles.tsx` | R3F Points 漂浮粒子 |
| 动画逻辑 | `features/pet/hooks/usePetAnimation.ts` | idle→hover→pressed→expanding |
| 状态 | `stores/appStore.ts` | 新增 `petPhase` |

### 设计决策

1. **SVG 钢琴 + R3F 粒子分层** — 图标清晰可缩放，粒子仅作氛围，控制 GPU 开销。
2. **点击 expanding 不切换 mode** — 阶段 3 再接入 `setMode('piano')` + 窗口放大。
3. **low-power WebGL** — 桌宠常驻，粒子数 36、dpr 上限 1.5。

### 验收标准

- [x] 桌宠主体为简易小钢琴图标（非文字占位）
- [x]  idle 浮动 + 呼吸光
- [x] hover 缩放 + 辉光增强
- [x] click 展开波纹 + 「展开中…」提示
- [x] 环境粒子随交互变亮

### 下一步：阶段 3 — 钢琴系统

1. Tone.js 音频引擎 + 钢琴采样
2. 2 octaves 键盘 UI
3. 鼠标 / 键盘演奏
4. expanding 结束时真正展开 piano 模式

---

## 阶段 3：钢琴系统

**日期**：2026-06-08  
**状态**：✅ 完成

### 完成内容

| 模块 | 说明 |
|------|------|
| `features/audio/AudioEngine.ts` | Tone.js Sampler（Salamander 钢琴）+ 混响 + 音量 |
| `features/piano/PianoKeyboard` | 2 octaves（C3–B4），鼠标点击演奏 |
| `useKeyboardInput` | 电脑键盘映射（Z–M 低区，Q–U 高区） |
| `PianoMode` | 展开面板：音量 / 混响 / 延音 / 收起 |
| IPC `setAppWindowMode` | 桌宠 220² ↔ 钢琴 720×460 |

### 开发体验调整

- `vite.config.ts` → `server.hmr.overlay: false`（关闭错误遮罩）
- `electron/main.ts` → 移除自动打开 DevTools

### 下一步：阶段 4 — MediaPipe 手势识别

---

## 阶段 4：MediaPipe 手势识别

**日期**：2026-06-08  
**状态**：✅ 完成

### 目标

- 钢琴模式开启摄像头，MediaPipe 检测最多 2 只手
- 实时绘制 21 关键点骨架 overlay
- 预留左右手虚拟键区（阶段 5 映射）

### 完成内容

| 模块 | 文件 | 职责 |
|------|------|------|
| 类型 | `features/gesture/types.ts` | `HandFrame`、`GestureStatus` |
| 常量 | `features/gesture/lib/constants.ts` | WASM / 模型 URL、手部连线 |
| 绘制 | `features/gesture/lib/drawHands.ts` | 骨架 + 虚拟键区占位 |
| 摄像头 | `features/gesture/hooks/useCamera.ts` | `getUserMedia` 生命周期 |
| 检测 | `features/gesture/hooks/useMediaPipeHands.ts` | `HandLandmarker` VIDEO 模式 |
| UI | `features/gesture/components/GesturePanel.tsx` | 预览区、FPS、开关 |
| 状态 | `stores/gestureStore.ts` | enabled / status / metrics |
| 主进程 | `electron/main.ts` | 摄像头权限 `setPermissionRequestHandler` |
| 集成 | `app/modes/PianoMode.tsx` | 「手势 ON/OFF」+ 预览条 |

### 设计决策

1. **按需加载模型** — 仅在手势开关打开时初始化 MediaPipe，关闭时释放摄像头。
2. **单例 HandLandmarker** — 避免重复下载 WASM / 模型。
3. **镜像 canvas** — 与用户自拍视角一致；骨架绘制 `mirror: true`。
4. **窗口高度 460** — 在 340 基础上增加 108px 手势预览条。

### 验收标准

- [x] 钢琴模式可开关「手势」
- [x] 摄像头预览 + 双手骨架 overlay
- [x] 显示手数 / FPS / 状态
- [x] Electron 自动授予 media 权限

### 下一步：阶段 5 — 空气钢琴映射

1. 指尖 X 坐标 → 音符（左右手各 7 键）
2. 敲击判定（Y 轴阈值 + 防抖）
3. 接入 `AudioEngine.playNote`

详见 [GESTURE-MAPPING.md](./GESTURE-MAPPING.md)

---

## 阶段 5：空气钢琴（已废弃）

**状态**：⛔ 已拆除，转向 Gesture Intent Music System

原键位映射方案见 [GESTURE-MAPPING.md](./GESTURE-MAPPING.md)（废弃说明）。

---

## 阶段 5b：Gesture Intent Music System

**日期**：2026-06-08  
**状态**：🔄 PR-1 完成

### PR-1：拆除 + Analyzer 骨架

- 删除空气钢琴映射/校准/useAirPiano
- 新增 `GestureAnalyzer`（One Euro + 速度/张开度/轨迹）
- 视觉：`drawEnergyOverlay` 能量场 + 速度向量
- 新增 `musicIntentStore` 默认 musicState
- HUD 实时显示 |v|、openness、stable

详见 [GESTURE-INTENT.md](./GESTURE-INTENT.md)

### 下一步：PR-2

- IntentDetector：Tap / Hold / Swipe
- MusicGenerator + pentatonic quantize
- 右手 Tap → 旋律

---

## 阶段 6–8

### 阶段 6：音乐场 R3F 粒子

**日期**：2026-06-08  
**状态**：✅ 完成

- `MusicFieldParticles` — 钢琴面板全屏透明 Canvas
- 环境粒子随 `energy` / `ambience` / `loopActive` 漂移变色
- 手势意图触发时按类型着色爆发粒子
- 键盘/鼠标演奏时粒子密度随 `activeNotes` 微增

### 阶段 7：性能优化

**日期**：2026-06-08  
**状态**：✅ 完成

- **三档画质**：高 / 平衡 / 省电（控制栏「性能」下拉，localStorage 记忆）
- **MediaPipe 节流**：按档位限制检测间隔（~50fps / ~24fps / ~15fps）
- **减少 React 更新**：手势 metrics / HUD 快照不再每帧写 store
- **摄像头分辨率**：随档位降低采集尺寸
- **R3F 粒子**：环境/爆发粒子数与 DPR 随档位缩放
- **Canvas 省电模式**：低画质简化骨架绘制、关闭能量场与 shadowBlur

### 阶段 8：打包发布

**日期**：2026-06-09  
**状态**：✅ 完成

| 模块 | 文件 | 职责 |
|------|------|------|
| 打包配置 | `electron-builder.yml` | NSIS 安装包 + 便携版、asar 解包 wasm/task |
| 应用图标 | `build/icon.png` | Windows 图标源图 |
| 资源同步 | `scripts/sync-gesture-assets.mjs` | `--require-model` 强制离线模型 |
| Vite | `vite.config.ts` | `base: './'` 适配 `loadFile` |

**脚本**

- `npm run build` — TypeScript 检查 + Vite 生产构建
- `npm run dist` / `dist:win` — 构建 + electron-builder
- `npm run pack` — 仅生成 `release/win-unpacked/` 解包目录

**设计决策**

1. **不打包 node_modules** — 渲染层由 Vite 全量打包，主进程仅依赖 Electron 内置模块。
2. **asarUnpack** — `.wasm` 与 `.task` 从 asar 解出，避免 MediaPipe 在 file 协议下加载失败。
3. **双目标产物** — Setup 安装器 + Portable 便携版，artifact 名称分开避免覆盖。

### 验收标准

- [x] `npm run build` 成功
- [x] `npm run dist:win` 生成 NSIS + Portable
- [x] `win-unpacked/Piano Desktop Pet.exe` 可启动
- [x] asar.unpacked 内含 MediaPipe wasm 与 hand_landmarker.task

### 踩坑记录

- **Desktop 目录 EPERM**：`release/win-unpacked.tmp` 重命名失败时，删除整个 `release/` 后重试；或临时改输出目录到 `%LOCALAPPDATA%`。
- **preload 必须保持 `.cjs`**：已在 `vite.config.ts` 中固定 `preload.cjs` 文件名。

---

## 阶段 9：死代码治理 + 音乐可配置 + 键盘扩展

**日期**：2026-06-12  
**状态**：✅ 完成

### 目标

1. 清理遗留未使用的音乐/音频 API
2. 音阶与 MusicMode 可在 UI 配置并持久化
3. 左手和弦支持三/七和弦、转位、自定义映射
4. 钢琴键盘支持滚轮/分页切换八度（C2–B6 范围内两八度可见）
5. 补充右手意图设计文档

### 完成内容

| 模块 | 文件 | 职责 |
|------|------|------|
| 死代码清理 | 删除 `melodyPicker.ts`、`loopNotes.ts` | 移除未接入意图系统的旧旋律/循环逻辑 |
| 音频精简 | `features/audio/AudioEngine.ts` | 移除 pad/arpeggio/loop/lead 合成器与相关 API |
| 和弦 Voicing | `music-intent/lib/chordVoicing.ts` | 三/七和弦、转位、八度锚点 |
| 和弦映射 | `music-intent/lib/chordMapping.ts` | 1–5 指槽位配置 + localStorage |
| 音乐设置 | `music-intent/lib/musicSettings.ts` | 音阶/MusicMode 持久化 |
| 状态 | `stores/musicIntentStore.ts` | `setScale`/`setMode`/`chordSlots`/`updateChordSlot` |
| 八度视图 | `stores/pianoStore.ts` | `startOctave` 滚动，C2–C5 起始 |
| 动态键位 | `piano/constants/keys.ts` | `buildPianoKeys`/`buildKeyboardMap` 按八度生成 |
| UI | `MusicSettingsSelect`、`ChordMappingPanel`、`OctaveNavigator` | 控制栏与键盘区新控件 |
| 和弦同步 | `piano/hooks/useHeldChordOctaveSync.ts` | 八度切换时重算按住和弦 |
| MusicMode 落地 | `aiPiano/phraseRhythm.ts`、`aiPianoEngine.ts` | dream/pulse/drift/ritual 影响节奏与音区 |
| 文档 | `docs/RIGHT-HAND-INTENT-DESIGN.md` | 右手意图设计与「扫键感」分析 |

### 设计决策

1. **和弦映射与音阶分离** — 槽位只管 voicing，短语量化仍走 `musicState.scale`。
2. **八度滚动不改变手势检测** — 仅影响键盘显示、电脑键映射与和弦锚点。
3. **MusicMode 首版轻量接入** — 调节 gap/velocity/noteCount，不做独立音色 preset。
4. **右手架构暂不改** — 先写设计文档，P0 感知层改进留待阶段 10。

### 验收标准

- [x] `npm run typecheck` 通过
- [x] 控制栏可选音阶（4 种）与调式（4 种）
- [x] 「和弦映射」面板可编辑 1–5 指：和弦 ID / 三·七 / 转位
- [x] 键盘区 ◀▶ 与滚轮切换八度，电脑键盘映射随动
- [x] ConductGuideCard 显示当前映射
- [x] 无 melodyPicker / loopNotes / pad API 引用

### 下一步：阶段 10 — 右手意图体验（P0）

1. 短语高亮改为「流动光标」单音高亮
2. 意图标签 HUD（上行/收句/升起/缓和）
3. 同一 behavior 多套 phrase 模板

详见 [RIGHT-HAND-INTENT-DESIGN.md](./RIGHT-HAND-INTENT-DESIGN.md)

---

## 阶段 9b：键盘响应 + 右手八度同步

**日期**：2026-06-12  
**状态**：✅ 完成

### 问题

1. 电脑键盘连按同键时延迟大、时响时不响
2. 右手 swipe 短语音区固定 C3 附近，不随八度滚动

### 修复

| 模块 | 改动 |
|------|------|
| `useKeyboardInput` | 用 `e.code` 追踪物理键；回调/map 走 ref，八度切换不重建监听器；同键连打先 release 再 attack |
| `usePianoPlay` | `playNote` 改为同步路径，去掉每次 `await init()` |
| `AudioEngine.noteOn` | 同音已 held 时先 `triggerRelease` 再 attack |
| `aiPianoEngine` | `PhraseRequest.octaveStart` → `registerRange` 随可见八度平移 |
| `intentResponses` | 传入 `usePianoStore.startOctave` |
| `useHeldChordOctaveSync` | 八度切换时 `resetPhraseMemory()` |

---

## 阶段 9c：琴键整键高亮

**日期**：2026-06-12  
**状态**：✅ 完成

### 改动

- `PianoKey`：激活时整键渐变 + 内发光 + inset ring，替代顶部细条动画
- 白键/黑键分别使用高对比紫色系全表面高亮
- **修复**：黑键不再使用 `relative`（与 `absolute` 在 Tailwind 中冲突导致黑键消失）；黑键独立 `z-[15]` 层

---

## 阶段 10：调性和声映射 + 旋律联动

**日期**：2026-06-12  
**状态**：✅ 完成

### 目标

用 **调性 + I–V 级数 + 和弦类型** 替代固定 C/Dm/Em/F/G 映射；右手短语生成参考当前左手和弦音与调内音阶。

### 完成内容

| 模块 | 文件 | 职责 |
|------|------|------|
| 调性和声核心 | `music-intent/lib/diatonicHarmony.ts` | 12 种常见大小调、triad/seventh/power、I–V 级数解析、预览表 |
| 映射兼容层 | `music-intent/lib/chordMapping.ts` | `resolveLeftHandVoicing(fingerCount, octave, settings)` |
| 状态 | `stores/musicIntentStore.ts` | `harmonicSettings`（keyId / harmonyMode / inversion），持久化 `piano-harmonic-settings` |
| 旋律引力 | `aiPiano/melodicGravity.ts` | `buildGravityPoolForHarmony`：和弦音加权 + 调内经过音 |
| 短语引擎 | `aiPiano/aiPianoEngine.ts` | `PhraseRequest.harmonicKey` + `chordNotes` 驱动路径与和弦音判定 |
| 意图响应 | `intentResponses.ts` | 右手短语读取按住和弦或 I 级；左手 `chord_select` 走 diatonic |
| UI | `ChordMappingPanel.tsx` | 调性 / 和弦类型 / 转位 + I–V 预览表 |
| HUD | `ConductGuideCard.tsx`、`GesturePanel.tsx` | 显示当前调性级数映射与和弦标签 |
| 八度同步 | `useHeldChordOctaveSync.ts` | 随 `harmonicSettings` 重算按住和弦 |

### 手势映射规则

| 手指数 | 级数 |
|--------|------|
| 1 | I |
| 2 | ii |
| 3 | iii |
| 4 | IV |
| 5 | V |

和弦符号随调性自动计算（如 G Major + Triad → G, Am, Bm, C, D）。

### 旋律联动

- 按住左手时：右手短语优先使用 `activeChordNotes` 作为 chord tone
- 未按住时：回退到当前调 I 级和弦音
- 经过音来自当前调性音阶（`buildKeyScaleNotes`）

### 验收标准

- [x] `npm run typecheck` 通过
- [x] 面板可选 7 大调 + 6 小调、三和弦 / 七和弦 / Power
- [x] I–V 预览表与 ConductGuideCard 同步
- [x] 右手短语引用 `harmonicKey` + `chordNotes`

### 下一步：阶段 14 — 右手意图体验（P0）

1. 短语高亮改为「流动光标」单音高亮
2. 意图标签 HUD（上行/收句/升起/缓和）
3. 同一 behavior 多套 phrase 模板

详见 [RIGHT-HAND-INTENT-DESIGN.md](./RIGHT-HAND-INTENT-DESIGN.md)

---

## 阶段 11：伸指检测重构 + 手势识别规格文档

**日期**：2026-06-12  
**状态**：✅ 完成

### 目标

1. 逐指独立判定 + 时间平滑，解决 4↔5 指切换不灵敏、四指误判五指
2. 将完整识别标准写入文档，便于调试与后续调参

### 完成内容

| 模块 | 文件 | 职责 |
|------|------|------|
| 逐指几何 | `gesture/lib/analyzer/fingerAnalysis.ts` | 食/中/无/小标准 + 小指宽松 + 拇指分场景 |
| 时间平滑 | `gesture/lib/analyzer/fingerCountSmoother.ts` | 7 帧投票、迟滞、4↔5 仲裁 |
| 意图防抖 | `gesture/lib/intent/config.ts` | 140ms 一般 / 70ms 相邻指法切换 |
| 文档 | `docs/GESTURE-RECOGNITION.md` | 几何阈值、FSM、swipe/expand 全规格 |

### 文档

- [GESTURE-RECOGNITION.md](./GESTURE-RECOGNITION.md) — **手势识别实现规格（主文档）**
- [GESTURE-INTENT.md](./GESTURE-INTENT.md) — 已更新 I–V 映射与文档链接

---

## 阶段 12：左右手手势分工 + 双手并行

**日期**：2026-06-12  
**状态**：✅ 完成

### 目标

1. 控制栏新增「手势分工」菜单：MediaPipe 左/右手各自可选 **手势和弦 / 手势意图 / 关闭**
2. 当两只手配置为**相同模式**时，两只手应能**同时**响应（而非仅最后一只手生效）

### 完成内容

| 模块 | 文件 | 职责 |
|------|------|------|
| 分工配置 | `gesture/lib/handGestureSettings.ts` | 模式类型、默认值、localStorage 持久化 |
| 状态 | `stores/gestureStore.ts` | `handAssignment` / `setHandMode` |
| 角色路由 | `gesture/lib/intent/handRole.ts` | 按配置判断 `handSupportsChord` / `handSupportsIntent` |
| UI | `HandAssignmentPanel.tsx` | 控制栏「手势分工」下拉 |
| 多手和弦 | `music-intent/lib/handChordState.ts` | `handChordHolds` 按 `handIndex` 合并高亮 |
| 音频 | `AudioEngine.ts` | `setGestureChordForHand` / `releaseGestureChordForHand`，多手和弦叠加、共享音不重复 attack |
| 意图响应 | `intentResponses.ts` | 和弦按手独立 hold/release；短语高亮 `phraseHighlightsByHand` 按手并行 |
| 检测 | `intentDetector.ts` | 双手均为和弦模式时跳过 expand/compress，避免干扰伸指 |
| 同步 | `useHeldChordOctaveSync.ts` | 视口滑动时重算所有按住手的 voicing |

### 行为说明

- **双手和弦**：左手 3 指 + 右手 5 指可同时按住不同级数和弦，琴键高亮为并集
- **双手意图**：各手独立 swipe 冷却与短语播放；高亮按手合并显示
- **双手张合**：仅在至少一只手非「纯和弦模式」时触发（双手都和弦时不触发）
- 切换分工配置时重置 FSM 并松开所有手势和弦

### 验收标准

- [x] `npm run typecheck` 通过
- [x] 双手同为和弦：各手独立 I–V 选择，松开一手不影响另一手
- [x] 双手同为意图：各手可独立挥动触发短语
- [x] 默认仍为左和弦 / 右意图

---

## 阶段 13：演奏录制

**日期**：2026-06-12  
**状态**：✅ 完成

### 目标

用户可按需开始/停止录制，捕获钢琴模式下的完整混音输出（键盘、手势和弦、手势短语），并导出常见音频格式。

### 完成内容

| 模块 | 文件 | 职责 |
|------|------|------|
| 录制总线 | `AudioEngine.ts` | 音量节点并联 `MediaStreamDestination`，暴露 `getRecordStream()` |
| 录制器 | `performanceRecorder.ts` | `MediaRecorder` 采集、停止后触发下载 |
| 格式 | `recordingFormats.ts` | WebM / WAV 选项、文件名时间戳、格式持久化 |
| WAV 编码 | `wavEncode.ts` | 解码 WebM → `AudioBuffer` → 16-bit PCM WAV |
| 状态 | `stores/recordStore.ts` | 录制中 / 导出中 / 计时 / 格式 |
| Hook | `useAudioRecorder.ts` | 开始、停止、导出流程 |
| UI | `RecordingPanel.tsx` | 控制栏「录制」按钮 + 格式下拉 |

### 行为说明

- **按需录制**：点击「录制」开始，再次点击「停止」结束并自动下载
- **录制范围**：混音后总线（含混响），覆盖键盘、鼠标、手势和弦与短语
- **格式**：WebM（Opus，默认，体积小）/ WAV（无损，停止时由 WebM 转码）
- 文件名：`music-field-YYYYMMDD-HHMMSS.{webm|wav}`
- 格式选择写入 `localStorage`（`piano-record-format`）

### 验收标准

- [x] `npm run typecheck` 通过
- [x] 音频就绪后可开始/停止录制
- [x] 支持 WebM 与 WAV 导出

### 下一步：阶段 15 — 右手意图体验（P0）

1. 短语高亮改为「流动光标」单音高亮
2. 意图标签 HUD（上行/收句/升起/缓和）
3. 同一 behavior 多套 phrase 模板

详见 [RIGHT-HAND-INTENT-DESIGN.md](./RIGHT-HAND-INTENT-DESIGN.md)

---

## 阶段 14：娱乐方式 · 万花筒视图切换

**日期**：2026-06-12  
**状态**：✅ 完成

### 目标

1. 应用启动默认进入**钢琴娱乐视图**（全屏）
2. 钢琴等视图可通过**万花筒 hub** 切换娱乐方式
3. 预留音乐小游戏等子视图扩展位

### 完成内容

| 模块 | 文件 | 职责 |
|------|------|------|
| 路由状态 | `stores/entertainmentStore.ts` | `route` / `lastView`、hub、持久化 |
| 视图注册 | `entertainment/lib/viewRegistry.ts` | 钢琴 / 节奏挑战 / 旋律记忆（占位） |
| 万花筒 hub | `KaleidoscopeHub.tsx` | 旋转背景 + 视图卡片 |
| 娱乐壳层 | `EntertainmentMode.tsx` | 全屏窗口 + 子视图路由 |
| 占位小游戏 | `RhythmGameView.tsx` | 节奏挑战占位 |
| 钢琴入口 | `PianoMode.tsx` | 「✦ 万花筒」按钮 |
| 启动 | `electron/main.ts` | 默认全屏娱乐窗 |
| 全局模式 | `appStore` | `pet` \| `entertainment`，默认 `entertainment` |

### 行为说明

- 启动 → 全屏 **MUSIC FIELD**
- **✦ 万花筒** → 选择娱乐方式；**收起** → 桌宠小窗
- 新增方式：在 `viewRegistry.ts` 登记 + `EntertainmentMode` 路由

### 验收标准

- [x] `npm run typecheck` 通过
- [x] 默认启动为钢琴视图
- [x] 万花筒可切换子视图

---
