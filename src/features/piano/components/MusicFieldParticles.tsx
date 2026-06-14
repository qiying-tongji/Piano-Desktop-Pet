/**
 * 音乐场域粒子效果
 *
 * 基于 Three.js 的环境粒子与手势意图触发的爆发粒子，随音乐状态动态变化。
 */
import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { IntentType, SwipeDirection } from '@/features/gesture/lib/intent/types'
import { useAudioStore } from '@/stores/audioStore'
import { useMusicIntentStore } from '@/stores/musicIntentStore'
import { usePerformanceStore } from '@/stores/performanceStore'

interface BurstParticle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  maxLife: number
  hue: number
}

function intentHue(type: IntentType): number {
  switch (type) {
    case 'swipe':
      return 0.62
    case 'expand':
      return 0.82
    case 'compress':
      return 0.48
    case 'chord_select':
      return 0.58
    case 'chord_release':
      return 0.48
    default:
      return 0.72
  }
}

function swipeFlow(dir?: SwipeDirection): { vx: number; vy: number } {
  switch (dir) {
    case 'right':
      return { vx: 2.2, vy: -0.8 }
    case 'left':
      return { vx: -2.2, vy: -0.6 }
    case 'up':
      return { vx: 0.4, vy: 2.4 }
    case 'down':
      return { vx: -0.3, vy: -2.0 }
    default:
      return { vx: 1.2, vy: -0.5 }
  }
}

function MusicFieldScene({
  ambientCount,
  burstCount,
}: {
  ambientCount: number
  burstCount: number
}) {
  const ambientRef = useRef<THREE.Points>(null)
  const burstRef = useRef<THREE.Points>(null)
  const lastIntentAt = useRef(0)
  const bursts = useRef<BurstParticle[]>([])

  const ambientSpeeds = useMemo(
    () => Float32Array.from({ length: ambientCount }, () => 0.12 + Math.random() * 0.55),
    [ambientCount],
  )

  const [ambientPos, ambientCol] = useMemo(() => {
    const pos = new Float32Array(ambientCount * 3)
    const col = new Float32Array(ambientCount * 3)
    for (let i = 0; i < ambientCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3
      col[i * 3] = 0.55 + Math.random() * 0.35
      col[i * 3 + 1] = 0.45 + Math.random() * 0.25
      col[i * 3 + 2] = 0.95 + Math.random() * 0.05
    }
    return [pos, col]
  }, [ambientCount])

  const [burstPos, burstCol] = useMemo(() => {
    const pos = new Float32Array(burstCount * 3)
    const col = new Float32Array(burstCount * 3)
    for (let i = 0; i < burstCount; i++) {
      pos[i * 3 + 1] = -99
      col[i * 3] = 0.7
      col[i * 3 + 1] = 0.55
      col[i * 3 + 2] = 1
    }
    return [pos, col]
  }, [burstCount])

  const spawnBurst = (type: IntentType, direction?: SwipeDirection) => {
    const hue = intentHue(type)
    const flow = type === 'swipe' ? swipeFlow(direction) : { vx: 0, vy: 0 }
    const scale = usePerformanceStore.getState().profile.visualFxScale
    const count = Math.floor((10 + Math.random() * 10) * scale)
    const cx = (Math.random() - 0.5) * 10
    const cy = (Math.random() - 0.5) * 5

    for (let i = 0; i < count && bursts.current.length < burstCount; i++) {
      const spread = 0.5 + Math.random() * 0.8
      bursts.current.push({
        x: cx,
        y: cy,
        z: (Math.random() - 0.5) * 1.2,
        vx: flow.vx * spread + (Math.random() - 0.5) * 0.8,
        vy: flow.vy * spread + (Math.random() - 0.5) * 0.8,
        vz: (Math.random() - 0.5) * 0.4,
        life: 0.55 + Math.random() * 0.45,
        maxLife: 1,
        hue,
      })
    }
  }

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const { musicState, recentIntents } = useMusicIntentStore.getState()
    const activeCount = useAudioStore.getState().activeNotes.size
    const { energy, ambience, pianoMood, isHolding, tension } = musicState
    const quality = usePerformanceStore.getState().quality
    const updateColors = quality !== 'low'

    const intent = recentIntents[0]
    if (intent && intent.timestamp > lastIntentAt.current) {
      lastIntentAt.current = intent.timestamp
      spawnBurst(intent.type, intent.direction)
    }

    const ambient = ambientRef.current
    if (ambient) {
      const arr = ambient.geometry.attributes.position.array as Float32Array
      const cols = ambient.geometry.attributes.color.array as Float32Array
      const drift = 0.003 + energy * 0.006 + activeCount * 0.0015
      const moodSpin = pianoMood === 'cinematic' ? 0.014 : pianoMood === 'intimate' ? 0.004 : 0.008

      for (let i = 0; i < ambientCount; i++) {
        const ix = i * 3
        const iy = ix + 1
        const iz = ix + 2
        arr[iy] += Math.sin(t * ambientSpeeds[i] + i * 0.17) * drift
        arr[ix] += Math.cos(t * 0.3 + i * 0.08) * drift * 0.35
        if (pianoMood === 'cinematic') {
          arr[ix] += Math.sin(t * 0.9 + i * 0.04) * moodSpin
          arr[iy] += Math.cos(t * 0.7 + i * 0.05) * moodSpin * 0.6
        }
        if (arr[iy] > 4.5) arr[iy] = -4.5
        if (arr[iy] < -4.5) arr[iy] = 4.5
        if (arr[ix] > 7.5) arr[ix] = -7.5
        if (arr[ix] < -7.5) arr[ix] = 7.5

        if (updateColors) {
          const pulse = 0.5 + Math.sin(t * 1.2 + i * 0.2) * 0.12 + energy * 0.25
          const moodBright = pianoMood === 'cinematic' ? 0.15 : pianoMood === 'intimate' ? -0.12 : 0
          cols[ix] = (0.45 + energy * 0.35 + moodBright) * pulse
          cols[iy] = (0.35 + ambience * 0.3 + (isHolding ? 0.15 : 0)) * pulse
          cols[iz] = 0.85 + tension * 0.15
        }
      }
      ambient.geometry.attributes.position.needsUpdate = true
      if (updateColors) ambient.geometry.attributes.color.needsUpdate = true
      ambient.rotation.z = Math.sin(t * 0.12) * 0.04 * (1 + energy)
    }

    const burstPts = burstRef.current
    if (burstPts) {
      const posArr = burstPts.geometry.attributes.position.array as Float32Array
      const colArr = burstPts.geometry.attributes.color.array as Float32Array

      bursts.current = bursts.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx * 0.016,
          y: p.y + p.vy * 0.016,
          z: p.z + p.vz * 0.016,
          vy: p.vy - 0.012,
          life: p.life - 0.016,
        }))
        .filter((p) => p.life > 0)

      for (let i = 0; i < burstCount; i++) {
        const ix = i * 3
        const p = bursts.current[i]
        if (p) {
          posArr[ix] = p.x
          posArr[ix + 1] = p.y
          posArr[ix + 2] = p.z
          const fade = p.life / p.maxLife
          colArr[ix] = (0.55 + p.hue * 0.35) * fade
          colArr[ix + 1] = (0.35 + (1 - p.hue) * 0.25) * fade
          colArr[ix + 2] = 0.95 * fade
        } else {
          posArr[ix + 1] = -99
          colArr[ix] = 0
          colArr[ix + 1] = 0
          colArr[ix + 2] = 0
        }
      }
      burstPts.geometry.attributes.position.needsUpdate = true
      burstPts.geometry.attributes.color.needsUpdate = true
    }
  })

  return (
    <>
      <points ref={ambientRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ambientPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[ambientCol, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.045}
          vertexColors
          transparent
          opacity={0.55}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points ref={burstRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[burstPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[burstCol, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  )
}

export function MusicFieldParticles() {
  const profile = usePerformanceStore((s) => s.profile)

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
      <Canvas
        key={`${profile.ambientParticles}-${profile.burstParticles}`}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        camera={{ position: [0, 0, 6], fov: 55 }}
        dpr={profile.r3fDpr}
        style={{ background: 'transparent' }}
      >
        <MusicFieldScene
          ambientCount={profile.ambientParticles}
          burstCount={profile.burstParticles}
        />
      </Canvas>
    </div>
  )
}
