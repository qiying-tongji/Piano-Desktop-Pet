/**
 * 应用根组件
 *
 * 根据 appStore.mode 在桌宠模式（PetMode）与钢琴模式（PianoMode）间切换。
 */
import { PetMode } from '@/app/modes/PetMode'
import { EntertainmentMode } from '@/app/modes/EntertainmentMode'
import { ElectronGate } from '@/app/ElectronGate'
import { useAppStore } from '@/stores/appStore'

export default function App() {
  const mode = useAppStore((s) => s.mode)

  return (
    <ElectronGate>
      <main className="h-full w-full">
        {mode === 'pet' && <PetMode />}
        {mode === 'entertainment' && <EntertainmentMode />}
      </main>
    </ElectronGate>
  )
}
