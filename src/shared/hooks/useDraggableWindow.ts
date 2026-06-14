/**
 * 窗口拖拽 Hook
 *
 * 通过 IPC 通知主进程开始/结束指针轮询拖拽；展开钢琴由双击单独处理。
 * 注：当前项目主要使用 CSS -webkit-app-region: drag，本 Hook 为备用方案。
 */
import { useCallback, useRef } from 'react'

interface UseDraggableWindowOptions {
  onRelease?: (wasDrag: boolean) => void
  disabled?: boolean
}

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
        // 部分环境 setPointerCapture 可能失败，下方 document 级监听作为兜底
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
