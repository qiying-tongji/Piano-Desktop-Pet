# 手势识别标准（实现规格）

> 本文档描述当前代码中**实际生效**的手势识别逻辑，供开发、调试与后续调参参考。  
> 架构概览见 [GESTURE-INTENT.md](./GESTURE-INTENT.md)；和声映射见 [DEVELOPMENT.md](./DEVELOPMENT.md) 阶段 10。

**最后更新**：2026-06-12

---

## 1. 数据流

```
摄像头
  → MediaPipe Hand Landmarker（每手 21 个归一化关键点）
  → GestureAnalyzer（滤波、速度、张合度、伸指数）
      ├─ computeFingerStates（单帧逐指几何）
      └─ FingerCountSmoother（7 帧投票 + 迟滞 + 4↔5 仲裁）
  → IntentDetector（意图 FSM + 防抖）
  → intentResponses / 琴键高亮 / 音频
```

| 阶段 | 源文件 |
|------|--------|
| 关键点 | `gesture/hooks/useMediaPipeHands.ts` |
| 特征提取 | `gesture/lib/analyzer/extractHandFeatures.ts` |
| 逐指几何 | `gesture/lib/analyzer/fingerAnalysis.ts` |
| 时间平滑 | `gesture/lib/analyzer/fingerCountSmoother.ts` |
| 意图 FSM | `gesture/lib/intent/intentDetector.ts` |
| 阈值常量 | `gesture/lib/intent/config.ts` |
| 左右手角色 | `gesture/lib/intent/handRole.ts` |

---

## 2. 坐标与关键点

### 2.1 镜像

所有用于判定的 X 坐标经 **`mirrorX(x) = 1 - x`** 处理，与自拍预览方向一致。

### 2.2 MediaPipe 21 点索引

| 索引 | 关节 |
|------|------|
| 0 | 腕 WRIST |
| 1–4 | 拇指 CMC → TIP |
| 5–8 | 食指 MCP → TIP |
| 9–12 | 中指 |
| 13–16 | 无名指 |
| 17–20 | 小指 |

判定使用的关节对：

| 手指 | TIP | PIP | MCP |
|------|-----|-----|-----|
| 食指 | 8 | 6 | 5 |
| 中指 | 12 | 10 | 9 |
| 无名指 | 16 | 14 | 13 |
| 小指 | 20 | 18 | 17 |
| 拇指 | 4 (TIP) | 3 (IP) | 2 (MCP)，参考 5 (食指 MCP) |

### 2.3 屏幕坐标系

- **Y 轴向下增大**（越大越靠画面下方）
- 「指尖高于 PIP」⇒ `tipY < pipY`（指尖在 PIP 上方）

---

## 3. 左右手分工

由 MediaPipe 的 `Left` / `Right` 标签决定，**与摄像头中可见手数量无关**：

| MediaPipe 标签 | 角色 | 检测项 |
|----------------|------|--------|
| **Left** | 左手 · 和弦 | 1–5 指 → `chord_select` / `chord_release` |
| **Right** | 右手 · 旋律 | 四向挥动 → `swipe` |
| **双手** | — | 张开/收拢 → `expand` / `compress` |

实现：`handRole.ts` — `isWorldHand(left)` / `isExpressionHand(right)`。

---

## 4. 左手伸指检测（核心）

### 4.1 总体原则

1. **逐指独立**判定，再求和得 0–5。
2. **食/中/无** 用标准阈值；**小指**略宽松；**拇指**分场景（见 4.3）。
3. **单帧几何** 再经 **7 帧平滑** 输出最终 `extendedFingerCount`。
4. 意图层对稳定计数再做 **70ms / 140ms** 防抖后才触发和弦。

### 4.2 非拇指手指（食/中/无/小）

函数：`isNonThumbExtended(landmarks, tip, pip, mcp, relaxed?)`

**全部满足**则该指计为「伸出」：

| # | 条件 | 标准模式 | 宽松模式（仅小指） |
|---|------|----------|-------------------|
| A | 指尖–PIP 距离 vs PIP–MCP 距离 | `tipPip ≥ pipMcp × 0.72` | `× 0.65` |
| B | 指尖–腕 vs PIP–腕 | `tipWrist > pipWrist × 1.08` | `× 1.05` |
| C | 指尖–腕 vs MCP–腕 | `tipWrist > mcpWrist × 1.04` | `× 1.02` |
| D | 指尖高于 PIP | `tipY < pipY - 0.012` | `tipY < pipY - 0.006` |

### 4.3 拇指（分场景）

#### 4.3.1 贴掌判定 `isThumbTucked`

以下**任一**成立 ⇒ 拇指视为贴掌（不计入伸指）：

| # | 条件 |
|---|------|
| T1 | 拇指尖到食指 MCP 距离 ≤ 拇指 IP 到食指 MCP × **1.08** |
| T2 | 横向展开不足：`lateralSpread < 0.022`（见下） |
| T3 | `thumbTipY ≥ thumbIpY + 0.004` |

**横向展开**（依赖 Left/Right 标签）：

- Left：`lateralSpread = thumbTipX - indexMcpX`
- Right：`lateralSpread = indexMcpX - thumbTipX`

#### 4.3.2 四指已全部伸出时（`fourUp = 食∧中∧无∧小`）

使用 **`isThumbExtendedForOpenPalm`**（宽松，用于 5 指张掌）：

- 先排除 `isThumbTucked`
- 拇指尖–腕 > 拇指 MCP–腕 × **1.06**
- 拇指尖–食指 MCP > 拇指 IP–食指 MCP × **1.06**
- `lateralSpread ≥ 0.018`
- `thumbTipY ≤ thumbIpY + 0.012`

#### 4.3.3 四指未全伸时（1–3 指场景）

使用 **`isThumbExtendedStandalone`**：非贴掌且满足 `isThumbExtendedForOpenPalm` 同一套宽松条件。

#### 4.3.4 单帧计数汇总

```text
fourUp = index ∧ middle ∧ ring ∧ pinky
thumb  = fourUp ? OpenPalm规则 : Standalone规则
count  = thumb + index + middle + ring + pinky  （布尔求和，上限 5）
```

**设计意图**：

- **4 指手势**（食中无小伸、拇指贴掌）⇒ `fourUp=true`，拇指贴掌 ⇒ **count=4**
- **5 指张掌** ⇒ `fourUp=true`，拇指宽松规则通过 ⇒ **count=5**

---

## 5. 时间平滑（FingerCountSmoother）

### 5.1 参数

| 参数 | 值 |
|------|-----|
| 历史帧数 `HISTORY_LEN` | **7** |
| 每手独立状态 | `handIndex` 为键 |

### 5.2 逐指投票 + 迟滞

每指维护最近 7 帧 true/false 序列：

- **上升沿**（未伸出 → 伸出）：需达到 `needTrue` 帧为 true
- **下降沿**（已伸出 → 收回）：允许 `needFalse` 帧为 false 后收回

| 手指 | 条件 | needTrue（约） | needFalse（约） |
|------|------|----------------|-----------------|
| 拇指 | 四指已伸（本帧或已稳定） | ≥38% 帧 | ≥55% 帧为 false 才收回 |
| 拇指 | 其他 | ≥55% 帧 | ≥45% 帧为 false |
| 小指 | — | 略宽松（48%/50%） | — |
| 食/中/无 | — | 52%/40%（迟滞） | 48% |

「四指已伸」判定：

```text
(frame.index ∧ frame.middle ∧ frame.ring ∧ frame.pinky)
∨ (stable[1] ∧ stable[2] ∧ stable[3] ∧ stable[4])
```

### 5.3 4↔5 仲裁 `resolveAmbiguousFourFive`

当本帧四指均伸出时：

| 平滑结果 | 本帧 raw | 处理 |
|----------|----------|------|
| 4 | 5 | **采用 5**（优先本帧几何，加快张掌） |
| 5 | 4 且 `!frame.thumb` | **采用 4**（拇指明确贴掌） |
| 其他 | — | 采用平滑结果 |

输出写入 `HandFeatures.extendedFingerCount`，供 HUD 显示 `f=` 与意图层使用。

---

## 6. 左手和弦意图（IntentDetector）

### 6.1 触发条件

仅 **MediaPipe Left** 手进入 `detectLeftChord`。

| 事件 | 条件 |
|------|------|
| `chord_select` | 平滑后 `count ∈ [1, 5]`，且与当前锁定指法不同 |
| `chord_release` | `count` 为 0 或 >5（握拳/离开检测逻辑），或手丢失 |

### 6.2 稳定时间防抖

| 场景 | 常量 | 时长 |
|------|------|------|
| 一般切换（如 1→3、2→4） | `CHORD_FINGER_STABLE_MS` | **140 ms** |
| **与当前已锁定指法相差 1**（如 4↔5、3↔4） | `CHORD_FINGER_ADJACENT_STABLE_MS` | **70 ms** |

逻辑：计数变化时重置 `pendingSince`；持续同一 `pendingFingerCount` 达到 `stableMs` 后才发出 `chord_select`。

### 6.3 手指数 → 和声级数

与 UI「和弦映射」一致（见 `diatonicHarmony.ts`）：

| 手指数 | 级数 | 示例（C Major 三和弦） |
|--------|------|------------------------|
| 1 | I | C |
| 2 | ii | Dm |
| 3 | iii | Em |
| 4 | IV | F |
| 5 | V | G |

具体符号随 **调性 + 和弦类型（三/七/Power）+ 转位** 自动计算；voicing 贴合当前可见键盘范围。

---

## 7. 右手挥动（Swipe）

仅 **MediaPipe Right** 手。基于掌心滤波后速度 `(vx, vy)`。

### 7.1 前置条件

| 条件 | 阈值 |
|------|------|
| 速度模长 | `magnitude ≥ 0.42` |
| 冷却 | 上次 swipe 后 **480 ms**（`SWIPE_COOLDOWN_MS`） |

### 7.2 方向判定

主轴占优比：`SWIPE_AXIS_RATIO = 1.15`

| 方向 | 条件 |
|------|------|
| **→ right** | `\|vx\| > 0.5` 且 `\|vx\| > \|vy\| × 1.15` 且 `vx > 0` |
| **← left** | 同上且 `vx < 0` |
| **↑ up** | `\|vy\| > 0.5` 且 `\|vy\| > \|vx\| × 1.15` 且 `vy < 0` |
| **↓ down** | 同上且 `vy > 0` |

### 7.3 音乐映射

| 方向 | PhraseBehavior |
|------|----------------|
| right | `ascend` |
| left | `descend` |
| up | `lift` |
| down | `settle` |

---

## 8. 双手张合（Expand / Compress）

需 **同时检测到两只手**。

### 8.1 度量

- `dist`：两手掌心距离
- `avgOpen`：两手 `openness` 均值（0=握拳，1=张开）
- `distDelta`：与上一帧距离差

### 8.2 Expand（张开）

冷却 **900 ms**。满足 **且非 compressing**：

- `dist > 0.22`，且
- `distDelta > 0.035`，**或**
- `avgOpen > 0.68` 且上一帧 `dualPrevAvgOpen < 0.52`

### 8.3 Compress（收拢）

冷却 **900 ms**：

- `distDelta < -0.03`，**或**
- `avgOpen < 0.38` 且上一帧 `dualPrevAvgOpen > 0.48`
- 且 `dist < 0.55`

### 8.4 音乐映射

| 事件 | 效果 |
|------|------|
| `expand` | `climax` 短语 + 混响 swell |
| `compress` | `intimate` 短语 + 干燥声场 |

---

## 9. 辅助特征（非直接触发和弦计数）

| 特征 | 说明 |
|------|------|
| `openness` | 指尖–掌心平均距离 + 拇食间距，用于双手张合 |
| `pinch` | 拇指尖–食指尖距离 |
| `velocity` | 掌心 One Euro 滤波后差分速度 |
| `isStable` | `\|velocity\| < STABLE_VELOCITY` |
| `trail` | 最近若干帧掌心轨迹（可视化） |

---

## 10. 调试

### 10.1 HUD

性能质量 **high** 时，手势叠加层显示：

```text
左手·和弦 (Left): |v|=… f=4 stable
```

- **`f=`** 即平滑后的 `extendedFingerCount`
- 若 `f` 正确但和弦不切换 → 查意图层 140/70 ms 防抖
- 若 `f` 本身不对 → 查 `fingerAnalysis.ts` 几何或 `fingerCountSmoother.ts`

### 10.2 调参入口

| 目标 | 文件 |
|------|------|
| 单指几何松紧 | `fingerAnalysis.ts` |
| 4↔5 灵敏度 | `fingerCountSmoother.ts` + `config.ts` 相邻 stable |
| 挥动灵敏度 | `config.ts` SWIPE_* |
| 双手张合 | `config.ts` DUAL_* |

---

## 11. 推荐手势姿势（用户）

| 意图 | 建议姿势 |
|------|----------|
| 1–3 指 | 对应数量的手指清晰竖起，其余握拳 |
| **4 指** | 食、中、无、小四指竖起，**拇指贴于掌心侧面** |
| **5 指** | 在上述基础上**自然张开拇指**，无需完全竖直 |
| 释放和弦 | 握拳或手移出画面 |
| 右手短语 | 右手大幅单向挥动，避免与左手混淆 |
| 双手高潮/亲密 | 双手进入画面，明显张开或收拢 |

---

## 12. 相关文档

- [GESTURE-INTENT.md](./GESTURE-INTENT.md) — 意图 → 音乐行为总览
- [RIGHT-HAND-INTENT-DESIGN.md](./RIGHT-HAND-INTENT-DESIGN.md) — 右手短语设计
- [DEVELOPMENT.md](./DEVELOPMENT.md) — 阶段开发记录
