import { isElectron } from '@/shared/lib/electron'

export function ElectronGate({ children }: { children: React.ReactNode }) {
  if (typeof window.electronAPI !== 'undefined') return <>{children}</>

  const inElectronShell = isElectron()

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#07070d] p-8 text-center text-white">
      <div className="max-w-md space-y-4">
        {inElectronShell ? (
          <>
            <h1 className="text-lg font-semibold text-red-300">桌面窗口已启动，但接口加载失败</h1>
            <p className="text-sm leading-relaxed text-white/70">
              Preload 脚本未正确加载（已在日志中修复）。请<strong className="text-white">完全关闭</strong>
              当前窗口后，在 cmd 中重新运行：
            </p>
            <code className="block rounded bg-black/40 px-3 py-2 text-sm text-pet-accent">npm run dev</code>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-pet-accent">请使用桌面窗口，不要打开浏览器</h1>
            <p className="text-sm leading-relaxed text-white/70">
              你在浏览器里打开了 <code className="text-pet-accent">localhost:5173</code>
              。在 cmd 运行 <code className="text-white/80">npm run dev</code>{' '}
              后，请用<strong className="text-white/80">自动弹出的透明小窗</strong>，不要点终端里的链接。
            </p>
            <ol className="space-y-2 text-left text-sm text-white/60">
              <li>1. 关闭此浏览器标签页</li>
              <li>2. 在 cmd 运行 <code className="text-white/80">npm run dev</code></li>
              <li>3. 找屏幕上的透明桌宠小窗（不是 Chrome/Edge）</li>
              <li>4. 双击桌宠展开钢琴</li>
            </ol>
          </>
        )}
      </div>
    </div>
  )
}
