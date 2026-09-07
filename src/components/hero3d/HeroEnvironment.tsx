'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface HeroEnvironmentProps {
  revealPhase: number
}

export default function HeroEnvironment({ revealPhase }: HeroEnvironmentProps) {
  const particlesRef = useRef<THREE.Points>(null)

  // Generate floating data dust particles
  const particleCount = 180
  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const sc = new Float32Array(particleCount)
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16
      pos[i * 3 + 1] = Math.random() * 7 - 1.5
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12
      sc[i] = Math.random() * 0.04 + 0.015
    }
    return [pos, sc]
  }, [])

  useFrame((_, delta) => {
    if (!particlesRef.current) return
    const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute
    const array = posAttr.array as Float32Array

    for (let i = 0; i < particleCount; i++) {
      // Gently drift upwards
      array[i * 3 + 1] += delta * 0.15
      // Drift slightly in X and Z
      array[i * 3] += Math.sin(Date.now() * 0.001 + i) * 0.002
      if (array[i * 3 + 1] > 5.5) {
        array[i * 3 + 1] = -1.5
      }
    }
    posAttr.needsUpdate = true
  })

  const gridOpacity = Math.min(0.65, revealPhase * 0.2)
  const baseOpacity = Math.min(0.95, Math.max(0, (revealPhase - 0.5) * 0.8))

  return (
    <group>
      {/* 1. Industrial Laboratory Anodized Base Pedestal */}
      <group position={[0, -0.05, 0.2]}>
        {/* Main Base Table Plate */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[4.8, 0.1, 3.2]} />
          <meshStandardMaterial
            color="#07172c"
            metalness={0.88}
            roughness={0.2}
            transparent
            opacity={baseOpacity}
          />
        </mesh>

        {/* Base Bevel Rim Trim */}
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[4.84, 0.02, 3.24]} />
          <meshStandardMaterial
            color="#1e3a5f"
            metalness={0.9}
            roughness={0.15}
            transparent
            opacity={baseOpacity}
          />
        </mesh>

        {/* Perimeter Neon Underglow Ring */}
        <mesh position={[0, -0.06, 0]}>
          <boxGeometry args={[4.9, 0.01, 3.3]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={Math.min(0.5, revealPhase * 0.15)}
          />
        </mesh>

        {/* Laser Etched Bench Marking Lines */}
        <mesh position={[0, 0.052, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.6, 3.0]} />
          <meshBasicMaterial
            color="#0ea5e9"
            wireframe
            transparent
            opacity={Math.min(0.25, revealPhase * 0.08)}
          />
        </mesh>
      </group>

      {/* 2. Large Cyber Circuit Grid Ground Plane */}
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[28, 28, 32, 32]} />
        <meshBasicMaterial
          color="#0284c7"
          wireframe
          transparent
          opacity={gridOpacity}
        />
      </mesh>

      {/* 3. Volumetric Floating Glowing Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#7dd3fc"
          transparent
          opacity={Math.min(0.85, revealPhase * 0.3)}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
