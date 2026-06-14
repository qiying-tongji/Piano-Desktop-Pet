/**
 * 宠物环境粒子
 *
 * 在桌面宠物周围渲染轻量 Three.js 漂浮粒子，活跃时密度与亮度略增。
 */
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 36

function AmbientParticles({ active }: { active: boolean }) {
  const pointsRef = useRef<THREE.Points>(null)
  const speeds = useMemo(
    () =>
      Float32Array.from({ length: PARTICLE_COUNT }, () => 0.15 + Math.random() * 0.35),
    [],
  )

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const col = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3.2
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3.2
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5
      col[i * 3] = 0.72 + Math.random() * 0.2
      col[i * 3 + 1] = 0.62 + Math.random() * 0.15
      col[i * 3 + 2] = 1
    }
    return [pos, col]
  }, [])

  useFrame((state) => {
    const pts = pointsRef.current
    if (!pts) return
    const t = state.clock.elapsedTime
    const arr = pts.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3 + 1
      arr[idx] += Math.sin(t * speeds[i] + i) * 0.002 * (active ? 1.6 : 1)
      if (arr[idx] > 1.6) arr[idx] = -1.6
      if (arr[idx] < -1.6) arr[idx] = 1.6
    }
    pts.geometry.attributes.position.needsUpdate = true
    pts.rotation.z = Math.sin(t * 0.15) * 0.05
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={active ? 0.055 : 0.04}
        vertexColors
        transparent
        opacity={active ? 0.85 : 0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

interface PetParticlesProps {
  active?: boolean
}

export function PetParticles({ active = false }: PetParticlesProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <Canvas
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <AmbientParticles active={active} />
      </Canvas>
    </div>
  )
}
