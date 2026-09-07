'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface PlcModuleProps {
  position?: [number, number, number]
  revealPhase: number
  isHovered: boolean
  onHover: (hovered: boolean) => void
  onClick: () => void
  pulseTrigger: number
}

export default function PlcModule({
  position = [0, 0.85, 0],
  revealPhase,
  isHovered,
  onHover,
  onClick,
  pulseTrigger,
}: PlcModuleProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [activeLedPattern, setActiveLedPattern] = useState<number[]>([1, 0, 1, 1, 0, 1, 0, 0])
  const [outputLedPattern, setOutputLedPattern] = useState<number[]>([0, 1, 1, 0, 1, 0, 1, 1])

  // Click / Pulse ripple intensity
  const pulseIntensity = useRef(0)

  // Simulation timer for IO LED scan cycle
  const timerRef = useRef(0)

  useFrame((state, delta) => {
    if (revealPhase < 1) return

    timerRef.current += delta

    // Periodically shift IO patterns to simulate active ladder scan cycles
    if (timerRef.current > 0.4) {
      timerRef.current = 0
      setActiveLedPattern((prev) => prev.map(() => (Math.random() > 0.45 ? 1 : 0)))
      setOutputLedPattern((prev) => prev.map(() => (Math.random() > 0.4 ? 1 : 0)))
    }

    // Pulse decay
    if (pulseIntensity.current > 0) {
      pulseIntensity.current = Math.max(0, pulseIntensity.current - delta * 2.5)
    }
  })

  // Trigger pulse effect on click or external trigger
  const handlePlcClick = (e: any) => {
    e.stopPropagation()
    pulseIntensity.current = 1.0
    onClick()
  }

  // Smooth appearance based on revealPhase
  const plcOpacity = revealPhase < 1 ? 0 : Math.min(1, (revealPhase - 0.9) * 2)
  const ledsActive = revealPhase >= 1.5

  // Memoized terminal screws coordinates
  const screwPositions = useMemo(() => {
    const screws: [number, number, number][] = []
    // Top terminal block screws (10 positions)
    for (let i = 0; i < 10; i++) {
      screws.push([-0.65 + i * 0.145, 0.52, 0.26])
    }
    // Bottom terminal block screws (10 positions)
    for (let i = 0; i < 10; i++) {
      screws.push([-0.65 + i * 0.145, -0.52, 0.26])
    }
    return screws
  }, [])

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(true)
      }}
      onPointerOut={() => onHover(false)}
      onClick={handlePlcClick}
      visible={revealPhase >= 0.8}
    >
      {/* 1. DIN Rail Mounting Plate (Back) */}
      <mesh position={[0, 0, -0.28]}>
        <boxGeometry args={[1.7, 1.25, 0.08]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.9}
          roughness={0.25}
          transparent
          opacity={plcOpacity}
        />
      </mesh>

      {/* 2. Main PLC Housing (Industrial Deep Navy Metallic Body) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.15, 0.5]} />
        <meshStandardMaterial
          color={isHovered ? '#0f2b57' : '#08172e'}
          metalness={0.75}
          roughness={0.3}
          emissive={isHovered ? '#0284c7' : '#00142f'}
          emissiveIntensity={isHovered ? 0.35 : 0.05}
          transparent
          opacity={plcOpacity}
        />
      </mesh>

      {/* 3. Top & Bottom Terminal Block Enclosures */}
      {/* Top Terminal Block */}
      <mesh position={[0, 0.5, 0.12]}>
        <boxGeometry args={[1.44, 0.15, 0.32]} />
        <meshStandardMaterial
          color="#0b1e38"
          metalness={0.6}
          roughness={0.4}
          transparent
          opacity={plcOpacity}
        />
      </mesh>
      {/* Bottom Terminal Block */}
      <mesh position={[0, -0.5, 0.12]}>
        <boxGeometry args={[1.44, 0.15, 0.32]} />
        <meshStandardMaterial
          color="#0b1e38"
          metalness={0.6}
          roughness={0.4}
          transparent
          opacity={plcOpacity}
        />
      </mesh>

      {/* 4. Terminal Screws (Gold/Chrome Contacts) */}
      {screwPositions.map((pos, idx) => (
        <mesh key={`screw-${idx}`} position={pos} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.02, 8]} />
          <meshStandardMaterial
            color={idx % 2 === 0 ? '#38bdf8' : '#cbd5e1'}
            metalness={0.95}
            roughness={0.15}
            transparent
            opacity={plcOpacity}
          />
        </mesh>
      ))}

      {/* 5. Center Beveled Display & Faceplate Accent */}
      <mesh position={[0, 0.02, 0.26]}>
        <boxGeometry args={[1.35, 0.72, 0.03]} />
        <meshStandardMaterial
          color="#040d1a"
          metalness={0.5}
          roughness={0.2}
          transparent
          opacity={plcOpacity}
        />
      </mesh>

      {/* 6. Laser-Etched Branding Badge */}
      <mesh position={[-0.32, 0.24, 0.28]}>
        <planeGeometry args={[0.6, 0.12]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={plcOpacity * 0.9} />
      </mesh>

      {/* 7. Status LED Indicators (PWR, RUN, ERR, COM) */}
      {/* PWR LED */}
      <group position={[0.2, 0.28, 0.28]}>
        <mesh>
          <circleGeometry args={[0.025, 16]} />
          <meshBasicMaterial
            color={ledsActive ? '#38bdf8' : '#0369a1'}
            transparent
            opacity={plcOpacity}
          />
        </mesh>
      </group>

      {/* RUN LED */}
      <group position={[0.32, 0.28, 0.28]}>
        <mesh>
          <circleGeometry args={[0.025, 16]} />
          <meshBasicMaterial
            color={ledsActive ? '#10b981' : '#065f46'}
            transparent
            opacity={plcOpacity}
          />
        </mesh>
      </group>

      {/* ERR LED */}
      <group position={[0.44, 0.28, 0.28]}>
        <mesh>
          <circleGeometry args={[0.025, 16]} />
          <meshBasicMaterial
            color={pulseIntensity.current > 0.5 ? '#f59e0b' : '#334155'}
            transparent
            opacity={plcOpacity}
          />
        </mesh>
      </group>

      {/* COM / NET LED */}
      <group position={[0.56, 0.28, 0.28]}>
        <mesh>
          <circleGeometry args={[0.025, 16]} />
          <meshBasicMaterial
            color={ledsActive ? '#a855f7' : '#4c1d95'}
            transparent
            opacity={plcOpacity}
          />
        </mesh>
      </group>

      {/* 8. Digital Input LEDs (Bank 0-7) */}
      <group position={[-0.45, 0.08, 0.28]}>
        {activeLedPattern.map((state, idx) => (
          <mesh key={`in-${idx}`} position={[idx * 0.125, 0, 0]}>
            <circleGeometry args={[0.02, 12]} />
            <meshBasicMaterial
              color={ledsActive && state ? '#38bdf8' : '#0f2b48'}
              transparent
              opacity={plcOpacity}
            />
          </mesh>
        ))}
      </group>

      {/* 9. Digital Output LEDs (Bank 0-7) */}
      <group position={[-0.45, -0.06, 0.28]}>
        {outputLedPattern.map((state, idx) => (
          <mesh key={`out-${idx}`} position={[idx * 0.125, 0, 0]}>
            <circleGeometry args={[0.02, 12]} />
            <meshBasicMaterial
              color={ledsActive && state ? '#0ea5e9' : '#0f2b48'}
              transparent
              opacity={plcOpacity}
            />
          </mesh>
        ))}
      </group>

      {/* 10. Communication Ports (Ethernet RJ45 & Micro-USB) */}
      {/* RJ45 Ethernet Port */}
      <mesh position={[-0.32, -0.22, 0.28]}>
        <boxGeometry args={[0.18, 0.15, 0.05]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[-0.32, -0.22, 0.31]}>
        <boxGeometry args={[0.12, 0.09, 0.02]} />
        <meshBasicMaterial color="#020617" />
      </mesh>

      {/* USB / Diagnostic Port */}
      <mesh position={[-0.05, -0.22, 0.28]}>
        <boxGeometry args={[0.12, 0.08, 0.04]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* RS-485 / Serial Port */}
      <mesh position={[0.3, -0.22, 0.28]}>
        <boxGeometry args={[0.26, 0.1, 0.04]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* 11. Soft Blue Rim Light & Diagnostic Pulse Glow */}
      <pointLight
        position={[0, 0, 0.4]}
        color="#38bdf8"
        intensity={ledsActive ? 1.2 + pulseIntensity.current * 3.5 : 0.1}
        distance={2.5}
      />

      {/* 12. Interactive Holographic Floating Label */}
      {isHovered && (
        <Html position={[0, 0.85, 0.2]} center distanceFactor={8} zIndexRange={[100, 0]}>
          <div className="pointer-events-none select-none px-3.5 py-2 rounded-xl text-left backdrop-blur-md border border-cyan-400/40 shadow-[0_0_25px_rgba(56,189,248,0.35)] bg-[#020b18]/90 text-white font-mono min-w-[200px] animate-fadeIn">
            <div className="flex items-center justify-between gap-2 border-b border-cyan-500/30 pb-1 mb-1.5">
              <span className="text-[11px] font-bold text-sky-400 tracking-wider">PLC CONTROLLER</span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ONLINE
              </span>
            </div>
            <div className="text-[10px] text-slate-300 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Model:</span>
                <span className="font-semibold text-cyan-200">ICAL-PLC 4.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scan Cycle:</span>
                <span className="font-semibold text-sky-300">1.2 ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bus:</span>
                <span className="font-semibold text-indigo-300">Modbus TCP/IP</span>
              </div>
              <div className="text-[9px] text-cyan-400/80 pt-1 text-center italic">
                (Click to pulse diagnostic bus)
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
