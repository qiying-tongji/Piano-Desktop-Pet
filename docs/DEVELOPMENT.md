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
