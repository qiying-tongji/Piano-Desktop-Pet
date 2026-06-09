import { useCallback, useRef } from 'react'

interface UseDraggableWindowOptions {
  onRelease?: (wasDrag: boolean) => void
  disabled?: boolean
}

/** Full-surface drag via main-process cursor polling. Expand is handled via double-click separately. */
export function useDraggableWindow({ onRelease, disabled = false }: UseDraggableWindowOptions = {}) {
  const activeRef = useRef(false)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return
      e.preventDefault()

      const api = window.electronAPI
      if (!api) return

      if (activeRef.current) return
      activeRef.current = true

      const target = e.currentTarget as HTMLElement
      const pointerId = e.pointerId

      try {
        target.setPointerCapture(pointerId)
      } catch {
        // ignore — document fallback below
      }

      api.beginWindowInteraction()

      const finish = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return

        activeRef.current = false
        target.removeEventListener('pointerup', finish)
        target.removeEventListener('pointercancel', finish)
        document.removeEventListener('pointerup', finish, true)
        document.removeEventListener('pointercancel', finish, true)

        try {
          target.releasePointerCapture(pointerId)
        } catch {
          // ignore
        }

        const wasDrag = api.endWindowInteraction()
        onRelease?.(wasDrag)
      }

      target.addEventListener('pointerup', finish)
      target.addEventListener('pointercancel', finish)
      document.addEventListener('pointerup', finish, true)
      document.addEventListener('pointercancel', finish, true)
    },
    [disabled, onRelease],
  )

  return { onPointerDown }
}
