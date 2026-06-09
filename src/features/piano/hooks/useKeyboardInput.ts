import { useEffect, useRef } from 'react'
import { KEYBOARD_MAP } from '../constants/keys'

interface UseKeyboardInputOptions {
  enabled: boolean
  onNoteOn: (note: string) => void
  onNoteOff: (note: string) => void
}

export function useKeyboardInput({ enabled, onNoteOn, onNoteOff }: UseKeyboardInputOptions) {
  const pressedRef = useRef(new Set<string>())

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      const note = KEYBOARD_MAP[e.key.toLowerCase()]
      if (!note || pressedRef.current.has(note)) return
      pressedRef.current.add(note)
      onNoteOn(note)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const note = KEYBOARD_MAP[e.key.toLowerCase()]
      if (!note) return
      pressedRef.current.delete(note)
      onNoteOff(note)
    }

    const handleBlur = () => {
      for (const note of pressedRef.current) {
        onNoteOff(note)
      }
      pressedRef.current.clear()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [enabled, onNoteOn, onNoteOff])
}
