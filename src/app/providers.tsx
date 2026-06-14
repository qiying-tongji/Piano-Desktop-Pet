/**
 * 全局 Provider 层
 *
 * 启动时从主进程拉取应用版本等信息写入 appStore。
 */
import { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'

export function AppProviders({ children }: { children: React.ReactNode }) {
  const setVersion = useAppStore((s) => s.setVersion)

  useEffect(() => {
    window.electronAPI?.getAppInfo().then((info) => {
      setVersion(info.version)
    })
  }, [setVersion])

  return <>{children}</>
}
