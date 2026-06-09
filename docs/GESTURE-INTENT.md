# Gesture Intent Music System

> Gesture → Phrase Behavior → AI Piano Phrase（非单音/非电子琶音）

## 架构

```
MediaPipe → Analyzer → IntentDetector → AI Piano Engine → Salamander 采样
                                      ↘ intentResponses → 琴键高亮
                                      ↘ visualFxManager / MusicFieldParticles
```

## 双手分工

| 手 | 输入 | 效果 |
|----|------|------|
| **左手** | 1–5 指 | 三和弦 + 琴键按下 |
| **右手** | 大幅挥动 →/←/↑/↓ | AI 钢琴短句（0.5–1.5s） |
| **双手** | 张开 Expand | 电影感高潮 phrase + 空间混响 |
| **双手** | 收拢 Compress | 亲密 felt phrase + 干燥近距离感 |

## 右手 Phrase 映射

| 手势 | 行为 | 音乐意图 |
|------|------|----------|
| Swipe → | `ascend` | 上行短句，旋律推进 |
| Swipe ← | `descend` | 回落收句，解决到和弦音 |
| Swipe ↑ | `lift` | 高音区 accent，情绪提升 |
| Swipe ↓ | `settle` | 稀疏低音，段落缓和 |
| Expand ✦ | `climax` | 八度加倍 + 更宽动态 + 混响 |
| Compress ● | `intimate` | 稀疏弱奏 + 更干声场 |

## AI Piano Engine

`src/features/music-intent/lib/aiPiano/`

| 模块 | 职责 |
|------|------|
| `aiPianoEngine.ts` | 短语生成入口 |
| `melodicGravity.ts` | 和弦音引力、经过音 |
| `phraseRhythm.ts` | 挥动速度 → 密度/力度/呼吸 |
| `types.ts` | PhraseMemory、PianoPhrase |

### 核心原则

- **Melody Gravity** — 优先当前和弦音（C/E/G…），少量经过音
- **Phrase Memory** — `previousNote` / `previousBehavior` / `registerBias` 保持句法连续
- **Rhythm** — 慢挥 = 稀疏 cinematic；快挥 = 密集 jazz-like

## 文件

| 路径 | 职责 |
|------|------|
| `gesture/lib/intent/intentDetector.ts` | 四向 swipe + 双手 expand/compress |
| `music-intent/lib/intentResponses.ts` | phrase 播放 + 琴键高亮 |
| `audio/AudioEngine.ts` | `playPianoPhrase` / cinematic / intimate |
| `gesture/lib/visualFx/visualFxManager.ts` | 方向性粒子流 |

## 左手和弦

见 `leftHandChords.ts` — 1=C, 2=Dm, 3=Em, 4=F, 5=G
