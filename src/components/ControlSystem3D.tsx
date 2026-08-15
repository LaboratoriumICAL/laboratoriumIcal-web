'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei'
import * as THREE from 'three'

function AutomationCore() {
  const groupRef = useRef<THREE.Group>(null)
  const ring1 = useRef<THREE.Mesh>(null)
  const ring2 = useRef<THREE.Mesh>(null)
  const ring3 = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15
    }
    if (ring1.current) ring1.current.rotation.x += delta * 0.4
    if (ring2.current) ring2.current.rotation.y += delta * 0.3
    if (ring3.current) ring3.current.rotation.z += delta * 0.2
  })

  return (
    <group ref={groupRef}>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* Core Processor (PLC/Microcontroller representation) */}
        <mesh>
          <octahedronGeometry args={[1.5, 0]} />
          <meshStandardMaterial 
            color="#0ea5e9" 
            metalness={0.8} 
            roughness={0.2} 
            emissive="#0284c7"
            emissiveIntensity={0.4}
          />
        </mesh>
        <mesh>
          <octahedronGeometry args={[1.8, 0]} />
          <meshBasicMaterial color="#a5eef2" wireframe transparent opacity={0.2} />
        </mesh>

        {/* Gyroscopic Mechanical Rings (Automation) */}
        <mesh ref={ring1}>
          <torusGeometry args={[2.8, 0.08, 16, 64]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh ref={ring2} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[3.6, 0.05, 16, 64]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh ref={ring3} rotation={[0, Math.PI / 4, 0]}>
          <torusGeometry args={[4.4, 0.06, 16, 64]} />
          <meshStandardMaterial color="#06aeb7" metalness={0.8} roughness={0.2} />
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
                <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.2} />
              </mesh>
              {/* Node Indicator Light */}
              <mesh position={[0, 0, 0.26]}>
                <planeGeometry args={[0.3, 0.3]} />
                <meshBasicMaterial color={i % 2 === 0 ? "#10b981" : "#38bdf8"} />
              </mesh>
            </group>
          )
        })}

        {/* Digital Factory Floor / Circuit Grid */}
        <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[25, 25, 25, 25]} />
          <meshBasicMaterial color="#015c61" wireframe transparent opacity={0.2} />
        </mesh>
      </Float>
    </group>
  )
}

export default function ControlSystem3D() {
  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 2, 8.5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#d6f8fa" />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#06aeb7" />
        
        {/* Flowing Data Particles */}
        <Stars radius={50} depth={20} count={1000} factor={3} saturation={0.5} fade speed={1.5} />
        
        <AutomationCore />
        
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
