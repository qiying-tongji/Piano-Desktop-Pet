/**
 * 娱乐全屏窗口 Hook（与 usePianoWindowMode 相同逻辑，供娱乐壳层使用）
 */
import { useEffect } from 'react'
import { hasElectronAPI } from '@/shared/lib/electron'
import { useAppStore } from '@/stores/appStore'

export function useEntertainmentWindowMode(): void {
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
    const t1 = window.setTimeout(() => void apply(), 100)
    const t2 = window.setTimeout(() => void apply(), 500)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [setWindowError])
}
