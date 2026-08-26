'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float, Stars, useTexture } from '@react-three/drei'
import * as THREE from 'three'

function LabLogoCore() {
  const logoTexture = useTexture('/images/logo-lab.png')
  const coreRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.25
    }
  })

  return (
    <group ref={coreRef}>
      {/* 3D Volumetric Circular Disc Medallion Base */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.42, 1.42, 0.12, 64]} />
        <meshStandardMaterial
          color="#00142F"
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* Front 3D Lab Logo with True Colors */}
      <mesh position={[0, 0, 0.065]}>
        <planeGeometry args={[2.3, 2.3]} />
        <meshStandardMaterial
          map={logoTexture}
          transparent
          alphaTest={0.01}
          metalness={0.15}
          roughness={0.35}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Back 3D Lab Logo with True Colors */}
      <mesh position={[0, 0, -0.065]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.3, 2.3]} />
        <meshStandardMaterial
          map={logoTexture}
          transparent
          alphaTest={0.01}
          metalness={0.15}
          roughness={0.35}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  )
}

function AutomationCore() {
  const groupRef = useRef<THREE.Group>(null)
  const ring1 = useRef<THREE.Mesh>(null)
  const ring2 = useRef<THREE.Mesh>(null)
  const ring3 = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12
    }
    if (ring1.current) ring1.current.rotation.x += delta * 0.4
    if (ring2.current) ring2.current.rotation.y += delta * 0.3
    if (ring3.current) ring3.current.rotation.z += delta * 0.2
  })

  return (
    <group ref={groupRef}>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* 3D Pure Lab Logo Emblem */}
        <LabLogoCore />

        {/* Gyroscopic Mechanical Rings (Automation) */}
        <mesh ref={ring1}>
          <torusGeometry args={[2.8, 0.08, 16, 64]} />
          <meshStandardMaterial color="#BAE6FD" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh ref={ring2} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[3.6, 0.05, 16, 64]} />
          <meshStandardMaterial color="#38BDF8" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh ref={ring3} rotation={[0, Math.PI / 4, 0]}>
          <torusGeometry args={[4.4, 0.06, 16, 64]} />
          <meshStandardMaterial color="#0284C7" metalness={0.9} roughness={0.15} />
        </mesh>

        {/* Distributed Control Nodes (Sensors/Actuators) */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          const radius = 5.5
          const x = Math.cos(angle) * radius
          const z = Math.sin(angle) * radius
          return (
            <group key={i} position={[x, Math.sin(angle * 2) * 1.5, z]}>
              <mesh rotation={[angle, angle, angle]}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#00142F" metalness={0.85} roughness={0.2} />
              </mesh>
              {/* Node Indicator Light */}
              <mesh position={[0, 0, 0.26]}>
                <planeGeometry args={[0.3, 0.3]} />
                <meshBasicMaterial color={i % 2 === 0 ? "#38BDF8" : "#0284C7"} />
              </mesh>
            </group>
          )
        })}
      </Float>
    </group>
  )
}

export default function ControlSystem3D() {
  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 2, 8.5], fov: 45 }}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[10, 10, 5]} intensity={2.2} color="#FFFFFF" />
        <pointLight position={[-10, -10, -5]} intensity={1.8} color="#38BDF8" />
        
        {/* Flowing Data Particles */}
        <Stars radius={50} depth={20} count={1400} factor={4} saturation={0.8} fade speed={1.5} />
        
        <Suspense fallback={null}>
          <AutomationCore />
        </Suspense>
        
        {/* Allow user to inspect the industrial system */}
        <OrbitControls 
          enableZoom={false} 
          autoRotate 
          autoRotateSpeed={0.8} 
          maxPolarAngle={Math.PI / 1.6} 
          minPolarAngle={Math.PI / 4} 
        />
      </Canvas>
    </div>
  )
}
