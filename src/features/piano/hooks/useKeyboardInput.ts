/**
 * 键盘输入 Hook
 *
 * 监听电脑键盘按键，映射到 piano 音符。
 * 使用 e.code 追踪物理键，支持同键快速连打（retrigger）。
 * 回调与 keyboardMap 走 ref，避免八度切换时反复卸载监听器。
 */
import { useEffect, useRef } from 'react'

interface UseKeyboardInputOptions {
  enabled: boolean
  keyboardMap: Record<string, string>
  onNoteOn: (note: string) => void
  onNoteOff: (note: string) => void
}

export function useKeyboardInput({
  enabled,
  keyboardMap,
  onNoteOn,
  onNoteOff,
}: UseKeyboardInputOptions) {
  /** 物理键 code → 当前映射的音符 */
  const activeKeysRef = useRef(new Map<string, string>())
  const keyboardMapRef = useRef(keyboardMap)
  const onNoteOnRef = useRef(onNoteOn)
  const onNoteOffRef = useRef(onNoteOff)

  keyboardMapRef.current = keyboardMap
  onNoteOnRef.current = onNoteOn
  onNoteOffRef.current = onNoteOff

  // 八度切换：释放仍按住的键，但不重建监听器
  useEffect(() => {
    for (const note of activeKeysRef.current.values()) {
      onNoteOffRef.current(note)
    }
    activeKeysRef.current.clear()
  }, [keyboardMap])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略系统组合键
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const note = keyboardMapRef.current[e.key.toLowerCase()]
      if (!note) return

      // 阻止浏览器默认行为（如滚动、重复选字），减少丢键
      e.preventDefault()

      const prevNote = activeKeysRef.current.get(e.code)
      if (prevNote && prevNote !== note) {
        onNoteOffRef.current(prevNote)
      }

      // 同键连打：先释放再触发，确保 Sampler 能再次发声
      if (activeKeysRef.current.has(e.code)) {
        onNoteOffRef.current(note)
      }

      activeKeysRef.current.set(e.code, note)
      onNoteOnRef.current(note)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const note = activeKeysRef.current.get(e.code)
      if (!note) return
      activeKeysRef.current.delete(e.code)
      onNoteOffRef.current(note)
    }

    const handleBlur = () => {
      for (const note of activeKeysRef.current.values()) {
        onNoteOffRef.current(note)
      }
      activeKeysRef.current.clear()
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    window.addEventListener('keyup', handleKeyUp, { capture: true })
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
      window.removeEventListener('keyup', handleKeyUp, { capture: true })
      window.removeEventListener('blur', handleBlur)
      for (const note of activeKeysRef.current.values()) {
        onNoteOffRef.current(note)
      }
      activeKeysRef.current.clear()
    }
  }, [enabled])
}
