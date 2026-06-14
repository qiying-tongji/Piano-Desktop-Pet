# Piano Desktop Pet

桌面沉浸式「钢琴主题 AI 桌宠」—— 透明置顶小精灵，展开为音乐法阵面板，支持鼠标/键盘演奏 + 摄像头手势意图操控音乐。

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面 | Electron |
| 前端 | React 19 + TypeScript + Vite |
| 样式 | TailwindCSS |
| 状态 | Zustand |
| 3D | Three.js + React Three Fiber |
| 动画 | Framer Motion |
| 音频 | Tone.js |
| 手势 | MediaPipe Hand Landmarker (`@mediapipe/tasks-vision`) |

## 当前进度

| 阶段 | 状态 | 说明 |
|------|------|------|
| 1 基础框架 | ✅ 完成 | Electron 透明窗 + React + IPC |
| 2 桌宠 UI | ✅ 完成 | 小钢琴图标 + 动效 + 粒子 |
| 3 钢琴系统 | ✅ 完成 | Tone.js + 2 octaves + 鼠标/键盘 |
| 4 手势识别 | ✅ 完成 | MediaPipe 双手 + 骨架 |
| 5 空气钢琴 | ⛔ 废弃 | 已转向手势意图系统 |
| 5b 意图音乐 | ✅ 完成 | AI Piano Phrase + 左手和弦 |
| 6 粒子动效 | ✅ 完成 | R3F 音乐场粒子 + 意图爆发 |
| 7 性能优化 | ✅ 完成 | 三档画质 + 检测节流 + 减载 |
| 8 打包发布 | ✅ 完成 | electron-builder · NSIS + 便携版 |

## 环境要求

- Node.js ≥ 18
- npm ≥ 9
- Windows 10/11（当前主开发平台）

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式（Vite + Electron 热更新）
npm run dev

# 类型检查
npm run typecheck

# 生产构建（编译到 dist/ + dist-electron/）
npm run build

# Windows 安装包 + 便携版（输出到 release/）
npm run dist:win

# 仅解包目录（release/win-unpacked/，便于快速验证）
npm run pack
```

### 发布产物

`npm run dist:win` 会在 `release/` 生成：

| 文件 | 说明 |
|------|------|
| `Piano Desktop Pet-Setup-0.1.0-win-x64.exe` | NSIS 安装程序（可选安装目录、桌面快捷方式） |
| `Piano Desktop Pet-Portable-0.1.0-win-x64.exe` | 绿色便携版，免安装 |
| `win-unpacked/` | 解包目录，可直接运行 `Piano Desktop Pet.exe` |

首次打包会自动同步 MediaPipe WASM 并下载手势模型（约 7.5 MB），需联网。模型会缓存在 `public/models/`。

若 `release/` 打包报 `EPERM`，先删除 `release/` 目录后重试。

开发模式下会：

1. 启动 Vite 开发服务器
2. 自动打开 **透明、无边框、置顶** 的桌宠窗口（右下角 220×220）
3. 双击桌宠展开钢琴面板；**请用自动弹出的透明桌宠窗口，不要打开浏览器里的 localhost:5173**

## 项目结构

```
piano-desktop-pet/
├── electron/          # 主进程：窗口管理、IPC
├── src/               # 渲染进程：React 应用
│   ├── app/           # 应用壳、模式视图
│   ├── stores/        # Zustand 状态
│   └── styles/        # 全局样式
├── docs/              # 架构与开发文档
└── public/            # 静态资源（后续采样、MediaPipe）
```

## IPC 接口（渲染进程）

通过 `window.electronAPI` 调用：

| 方法 | 说明 |
|------|------|
| `getAppInfo()` | 版本、平台、是否开发模式 |
| `setIgnoreMouseEvents(ignore, forward?)` | 透明区域点击穿透 |
| `setWindowBounds(bounds)` | 调整窗口位置/大小（展开模式用） |
| `getWindowBounds()` | 获取当前窗口 bounds |
| `setAppWindowMode('pet' \| 'piano')` | 切换桌宠/钢琴窗口尺寸 |

开发提示：Vite HMR 错误遮罩已关闭；Electron DevTools 不会自动打开。需要调试时可按 `F12` 或在代码中临时开启。

## 文档

- [架构说明](./docs/ARCHITECTURE.md)
- [开发日志](./docs/DEVELOPMENT.md)
- [手势意图系统](./docs/GESTURE-INTENT.md)
- [右手意图设计说明](./docs/RIGHT-HAND-INTENT-DESIGN.md)
- [项目解析](./docs/项目解析.md)

## License

Private — 创意交互作品项目
