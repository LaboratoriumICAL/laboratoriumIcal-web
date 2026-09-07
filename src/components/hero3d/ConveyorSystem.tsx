'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface ConveyorSystemProps {
  revealPhase: number
  motorHovered: boolean
  onHoverMotor: (hovered: boolean) => void
  onWorkpieceProximity: (isNear: boolean) => void
  motorSpeedMultiplier?: number
  onToggleMotorSpeed?: () => void
}

interface Workpiece {
  progress: number // 0 to 1 along conveyor length
  id: number
}

export default function ConveyorSystem({
  revealPhase,
  motorHovered,
  onHoverMotor,
  onWorkpieceProximity,
  motorSpeedMultiplier = 1.0,
  onToggleMotorSpeed,
}: ConveyorSystemProps) {
  const motorShaftRef = useRef<THREE.Mesh>(null)
  const roller1Ref = useRef<THREE.Mesh>(null)
  const roller2Ref = useRef<THREE.Mesh>(null)

  // Motor RPM display
  const [motorRpm, setMotorRpm] = useState(1450)

  // Workpieces traveling along the conveyor
  const [workpieces, setWorkpieces] = useState<Workpiece[]>([
    { progress: 0.1, id: 1 },
    { progress: 0.45, id: 2 },
    { progress: 0.8, id: 3 },
  ])

  // Conveyor path geometry:
  // Starts at X = -1.5, Z = 0.85 (Motor drive end) -> Ends at X = 1.6, Z = 0.85 (Discharge end)
  const conveyorStart = -1.5
  const conveyorEnd = 1.6
  const conveyorLength = conveyorEnd - conveyorStart
  const conveyorY = 0.28
  const conveyorZ = 0.85

  useFrame((_, delta) => {
    if (revealPhase < 3) return

    const clampedDelta = Math.min(delta, 0.1)
    const effectiveSpeed = 0.22 * motorSpeedMultiplier

    // 1. Rotate motor shaft and conveyor rollers
    const rotDelta = clampedDelta * 12 * motorSpeedMultiplier
    if (motorShaftRef.current) motorShaftRef.current.rotation.z -= rotDelta
    if (roller1Ref.current) roller1Ref.current.rotation.z -= rotDelta
    if (roller2Ref.current) roller2Ref.current.rotation.z -= rotDelta

    // 2. Advance workpieces
    let anyNearProximity = false

    setWorkpieces((prev) =>
      prev.map((wp) => {
        let newProgress = wp.progress + (clampedDelta * effectiveSpeed)
        if (newProgress > 1.0) {
          newProgress = 0.0
        }

        // Calculate world X position
        const currentX = conveyorStart + newProgress * conveyorLength
        // Proximity sensor is located around X = 1.35
        if (Math.abs(currentX - 1.35) < 0.22) {
          anyNearProximity = true
        }

        return { ...wp, progress: newProgress }
      })
    )

    onWorkpieceProximity(anyNearProximity)
    setMotorRpm(Math.round(1450 * motorSpeedMultiplier))
  })

  const conveyorOpacity = revealPhase < 3 ? 0 : Math.min(1, (revealPhase - 2.8) * 2)

  // Slats on conveyor belt to show visible motion
  const slatCount = 20
  const slatOffsets = useMemo(() => Array.from({ length: slatCount }, (_, i) => i / slatCount), [])

  return (
    <group visible={revealPhase >= 2.5}>
      {/* ========================================================
          1. CONVEYOR SUPPORT FRAME & LEGS
         ======================================================== */}
      {/* Left and Right Extruded Aluminum Guide Rails */}
      <mesh position={[0.05, conveyorY + 0.03, conveyorZ - 0.16]}>
        <boxGeometry args={[conveyorLength + 0.2, 0.06, 0.03]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.9}
          roughness={0.2}
          transparent
          opacity={conveyorOpacity}
        />
      </mesh>
      <mesh position={[0.05, conveyorY + 0.03, conveyorZ + 0.16]}>
        <boxGeometry args={[conveyorLength + 0.2, 0.06, 0.03]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.9}
          roughness={0.2}
          transparent
          opacity={conveyorOpacity}
        />
      </mesh>

      {/* Main Belt Bed Plate */}
      <mesh position={[0.05, conveyorY - 0.01, conveyorZ]}>
        <boxGeometry args={[conveyorLength, 0.02, 0.28]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.7}
          roughness={0.4}
          transparent
          opacity={conveyorOpacity}
        />
      </mesh>

      {/* Conveyor Support Legs (4 Stanchions) */}
      {[-1.3, -0.4, 0.5, 1.4].map((x, idx) => (
        <group key={`leg-${idx}`} position={[x, 0.12, conveyorZ]}>
          <mesh position={[0, 0, -0.13]}>
            <cylinderGeometry args={[0.02, 0.02, 0.28, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.13]}>
            <cylinderGeometry args={[0.02, 0.02, 0.28, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
          </mesh>
          {/* Leveling Foot */}
          <mesh position={[0, -0.14, -0.13]}>
            <cylinderGeometry args={[0.035, 0.035, 0.02, 8]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, -0.14, 0.13]}>
            <cylinderGeometry args={[0.035, 0.035, 0.02, 8]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      ))}

      {/* End Rollers */}
      <mesh
        ref={roller1Ref}
        position={[conveyorStart, conveyorY, conveyorZ]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.05, 0.05, 0.3, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
      </mesh>
      <mesh
        ref={roller2Ref}
        position={[conveyorEnd, conveyorY, conveyorZ]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.05, 0.05, 0.3, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Moving Conveyor Belt Surface with Grooves */}
      <mesh position={[0.05, conveyorY + 0.015, conveyorZ]}>
        <boxGeometry args={[conveyorLength, 0.01, 0.27]} />
        <meshStandardMaterial
          color="#09182b"
          metalness={0.5}
          roughness={0.6}
          emissive="#0284c7"
          emissiveIntensity={0.08}
          transparent
          opacity={conveyorOpacity}
        />
      </mesh>

      {/* ========================================================
          2. INDUSTRIAL AC SERVO MOTOR DRIVE
          Position: [-1.75, 0.28, 0.85]
         ======================================================== */}
      <group
        position={[-1.75, 0.28, conveyorZ]}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHoverMotor(true)
        }}
        onPointerOut={() => onHoverMotor(false)}
        onClick={(e) => {
          e.stopPropagation()
          if (onToggleMotorSpeed) onToggleMotorSpeed()
        }}
      >
        {/* Motor Mounting Flange Bracket */}
        <mesh position={[0.12, 0, 0]}>
          <boxGeometry args={[0.06, 0.26, 0.26]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Main Servo Cylindrical Body */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.11, 0.11, 0.22, 24]} />
          <meshStandardMaterial
            color={motorHovered ? '#0284c7' : '#0a1d36'}
            metalness={0.8}
            roughness={0.25}
            emissive={motorHovered ? '#0369a1' : '#00142f'}
            emissiveIntensity={motorHovered ? 0.6 : 0.05}
            transparent
            opacity={conveyorOpacity}
          />
        </mesh>

        {/* Motor Cooling Fins */}
        {[-0.06, 0, 0.06].map((x, i) => (
          <mesh key={`fin-${i}`} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.125, 0.125, 0.018, 24]} />
            <meshStandardMaterial color="#0f2b48" metalness={0.85} roughness={0.2} />
          </mesh>
        ))}

        {/* Optical Encoder Rear Housing Cap */}
        <mesh position={[-0.14, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.07, 16]} />
          <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Terminal Junction Box on Motor Top */}
        <mesh position={[0, 0.13, 0]}>
          <boxGeometry args={[0.12, 0.08, 0.1]} />
          <meshStandardMaterial color="#0f2744" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Drive Shaft & Timing Pulley */}
        <mesh ref={motorShaftRef} position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.08, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>

        {/* Status Indicator LED on Motor Box */}
        <mesh position={[0, 0.175, 0.02]}>
          <sphereGeometry args={[0.016, 8, 8]} />
          <meshBasicMaterial color={revealPhase >= 3 ? '#10b981' : '#065f46'} />
        </mesh>

        {/* Motor Holographic Tooltip */}
        {motorHovered && (
          <Html position={[0, 0.42, 0]} center distanceFactor={8} zIndexRange={[100, 0]}>
            <div className="pointer-events-none select-none px-3 py-1.5 rounded-lg text-left backdrop-blur-md border border-cyan-400/40 shadow-[0_0_20px_rgba(56,189,248,0.4)] bg-[#020b18]/90 text-white font-mono min-w-[190px] animate-fadeIn">
              <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1 mb-1">
                <span className="text-[10px] font-bold text-sky-400">SERVO MOTOR</span>
                <span className="text-[8px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-1 py-0.2 rounded">
                  RUNNING
                </span>
              </div>
              <div className="text-[9px] text-slate-300">
                <div className="flex justify-between">
                  <span>Speed:</span>
                  <span className="font-bold text-cyan-200">{motorRpm} RPM</span>
                </div>
                <div className="flex justify-between">
                  <span>Torque:</span>
                  <span className="text-sky-300">3.2 Nm (Nominal)</span>
                </div>
                <div className="flex justify-between">
                  <span>Drive:</span>
                  <span className="text-indigo-300">PWM Closed-Loop</span>
                </div>
                <div className="text-[8px] text-cyan-400 pt-0.5">(Click to toggle speed preset)</div>
              </div>
            </div>
          </Html>
        )}
      </group>

      {/* ========================================================
          3. MOVING INDUSTRIAL WORKPIECES / PRODUCTS
         ======================================================== */}
      {workpieces.map((wp) => {
        const xPos = conveyorStart + wp.progress * conveyorLength
        const isNearSensor = Math.abs(xPos - 1.35) < 0.25

        return (
          <group key={`wp-${wp.id}`} position={[xPos, conveyorY + 0.05, conveyorZ]}>
            {/* Precision Aluminum Pallet Base */}
            <mesh>
              <boxGeometry args={[0.16, 0.04, 0.16]} />
              <meshStandardMaterial
                color={isNearSensor ? '#38bdf8' : '#1e3a5f'}
                metalness={0.9}
                roughness={0.2}
                emissive={isNearSensor ? '#0284c7' : '#000000'}
                emissiveIntensity={isNearSensor ? 0.8 : 0}
                transparent
                opacity={conveyorOpacity}
              />
            </mesh>

            {/* Machined Workpiece Core Component */}
            <mesh position={[0, 0.035, 0]}>
              <boxGeometry args={[0.1, 0.03, 0.1]} />
              <meshStandardMaterial
                color={isNearSensor ? '#e0f2fe' : '#94a3b8'}
                metalness={0.95}
                roughness={0.15}
              />
            </mesh>

            {/* IC Chip Accent */}
            <mesh position={[0, 0.052, 0]}>
              <planeGeometry args={[0.06, 0.06]} />
              <meshBasicMaterial color={isNearSensor ? '#7dd3fc' : '#38bdf8'} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
