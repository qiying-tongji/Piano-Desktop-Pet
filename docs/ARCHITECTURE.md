# 架构说明

> 随开发阶段持续更新。当前版本：**阶段 8（打包发布）**

## 进程模型

```
┌─────────────────────────────────────────┐
│           Electron Main Process          │
│  main.ts → windowManager → ipc/handlers  │
└──────────────────┬──────────────────────┘
                   │ contextBridge (preload)
┌──────────────────▼──────────────────────┐
│         Renderer (React + Vite)          │
│  App → PetMode / PianoMode (future)      │
│  Zustand stores                          │
└─────────────────────────────────────────┘
```

## 窗口策略（阶段 1）

- **尺寸**：220 × 220 px（桌宠模式）
- **位置**：主显示器工作区右下角，边距 24 px
- **属性**：`transparent` + `frame: false` + `alwaysOnTop` + `skipTaskbar`
- **点击穿透**：IPC 预留 `setIgnoreMouseEvents`，阶段 2 用于非交互区域穿透

## 状态机（规划）

```
pet (默认) ──click──▶ expanding ──▶ piano (展开)
                         │
                         └── 阶段 2–3 实现
```

当前 Zustand `appStore.mode`: `'pet' | 'piano'`

## 统一事件模型（阶段 3 起）

所有输入源（鼠标 / 键盘 / 手势）产出 `NoteEvent`，由 `AudioEngine` 与视觉层订阅。

## 目录约定

- `electron/` — 仅主进程代码，不引用 React
- `src/features/` — 阶段 2 起按业务垂直拆分
- `shared/types/note.ts` — 阶段 3 引入

## 生产构建（阶段 8）

```
npm run build          → dist/（渲染） + dist-electron/（主进程 + preload.cjs）
npm run dist:win       → release/（NSIS 安装包 + 便携版 + win-unpacked）
```

- 渲染进程通过 `mainWindow.loadFile(dist/index.html)` 加载，`base: './'` 保证相对资源路径。
- MediaPipe WASM / 手势模型打入 `dist/`，经 `asarUnpack` 解出供运行时读取。

详见项目规划中的完整目录树。
