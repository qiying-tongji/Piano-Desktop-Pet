/**
 * 钢琴模式窗口 Hook
 *
 * 挂载时通过 IPC 确保 Electron 窗口展开为全屏钢琴尺寸。
 */
import { useEffect } from 'react'
import { hasElectronAPI } from '@/shared/lib/electron'
import { useAppStore } from '@/stores/appStore'

export function usePianoWindowMode(): void {
  const setWindowError = useAppStore((s) => s.setWindowError)

  useEffect(() => {
    if (!hasElectronAPI()) return

    const apply = async () => {
      const bounds = await window.electronAPI!.setAppWindowMode('piano')
      if (!bounds) {
        setWindowError('窗口缩放失败，请重启 npm run dev')
        return
      }
      if (bounds.width < 640 || bounds.height < 480) {
        setWindowError(`窗口尺寸异常 ${bounds.width}×${bounds.height}，请重启应用`)
        return
      }
      setWindowError(null)
    }

    void apply()
    // Windows 透明窗 resize 偶发延迟，100ms/500ms 重试
    const t1 = window.setTimeout(() => void apply(), 100)
    const t2 = window.setTimeout(() => void apply(), 500)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [setWindowError])
}
