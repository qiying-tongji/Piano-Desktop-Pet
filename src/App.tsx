import { PetMode } from '@/app/modes/PetMode'
import { PianoMode } from '@/app/modes/PianoMode'
import { ElectronGate } from '@/app/ElectronGate'
import { useAppStore } from '@/stores/appStore'

export default function App() {
  const mode = useAppStore((s) => s.mode)

  return (
    <ElectronGate>
      <main className="h-full w-full">
        {mode === 'pet' && <PetMode />}
        {mode === 'piano' && <PianoMode />}
      </main>
    </ElectronGate>
  )
}
