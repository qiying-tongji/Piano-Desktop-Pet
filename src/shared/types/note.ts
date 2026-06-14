/**
 * 音符与输入事件类型
 *
 * 定义音符触发来源（鼠标/键盘/手势）及 noteOn/noteOff 事件结构。
 */
export type InputSource = 'mouse' | 'keyboard' | 'gesture'

export type NoteEvent =
  | { type: 'noteOn'; note: string; velocity: number; source: InputSource }
  | { type: 'noteOff'; note: string; source: InputSource }
