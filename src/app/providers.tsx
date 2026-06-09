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
