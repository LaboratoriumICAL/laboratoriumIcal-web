'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface SensorsClusterProps {
  revealPhase: number
  hoveredSensor: string | null
  onHoverSensor: (sensorName: string | null) => void
  onTriggerPulse: (sensorName: string) => void
  isWorkpieceNear: boolean
}

export default function SensorsCluster({
  revealPhase,
  hoveredSensor,
  onHoverSensor,
  onTriggerPulse,
  isWorkpieceNear,
}: SensorsClusterProps) {
  // Live dynamic telemetry values
  const [tempValue, setTempValue] = useState(24.6)
  const [humidityValue, setHumidityValue] = useState(62.4)
  const [pressureValue, setPressureValue] = useState(4.2)
  const [manualTriggerTimer, setManualTriggerTimer] = useState(0)

  const timeRef = useRef(0)

  useFrame((_, delta) => {
    if (revealPhase < 2) return

    timeRef.current += delta

    // Smooth subtle measurement drift for real-time authenticity
    if (timeRef.current > 0.6) {
      timeRef.current = 0
      setTempValue(+(24.4 + Math.sin(Date.now() * 0.001) * 0.4).toFixed(1))
      setHumidityValue(+(62.0 + Math.cos(Date.now() * 0.0015) * 0.6).toFixed(1))
      setPressureValue(+(4.2 + Math.sin(Date.now() * 0.002) * 0.1).toFixed(2))
    }

    if (manualTriggerTimer > 0) {
      setManualTriggerTimer((t) => Math.max(0, t - delta * 2))
    }
  })

  const isProximityActive = isWorkpieceNear || manualTriggerTimer > 0
  const sensorOpacity = revealPhase < 2 ? 0 : Math.min(1, (revealPhase - 1.8) * 2)

  // Handler when clicking any sensor
  const handleClick = (e: any, sensorName: string) => {
    e.stopPropagation()
    setManualTriggerTimer(1.0)
    onTriggerPulse(sensorName)
  }

  return (
    <group visible={revealPhase >= 1.5}>
      {/* ========================================================
          1. PROXIMITY SENSOR (M12 Inductive Barrel Sensor)
          Position: Near Conveyor inspection station [1.35, 0.38, 0.85]
         ======================================================== */}
      <group
        position={[1.35, 0.38, 0.85]}
        rotation={[0, 0, -Math.PI / 4]}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHoverSensor('prox')
        }}
        onPointerOut={() => onHoverSensor(null)}
        onClick={(e) => handleClick(e, 'prox')}
      >
        {/* Mounting Bracket */}
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.08, 0.35, 0.08]} />
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.8}
            roughness={0.3}
            transparent
            opacity={sensorOpacity}
          />
        </mesh>

        {/* Threaded Stainless Steel Barrel */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.32, 16]} />
          <meshStandardMaterial
            color={hoveredSensor === 'prox' ? '#7dd3fc' : '#cbd5e1'}
            metalness={0.95}
            roughness={0.15}
            emissive={hoveredSensor === 'prox' ? '#0284c7' : '#000000'}
            emissiveIntensity={hoveredSensor === 'prox' ? 0.6 : 0}
            transparent
            opacity={sensorOpacity}
          />
        </mesh>

        {/* Locknuts (Brass/Gold accent) */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.04, 6]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.04, 6]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Optical / Sensing Face Tip */}
        <mesh position={[0, 0.27, 0]}>
          <cylinderGeometry args={[0.042, 0.042, 0.03, 16]} />
          <meshBasicMaterial
            color={isProximityActive ? '#38bdf8' : '#0369a1'}
            transparent
            opacity={sensorOpacity}
          />
        </mesh>

        {/* Rear Status LED Ring */}
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.048, 0.048, 0.02, 16]} />
          <meshBasicMaterial
            color={isProximityActive ? '#10b981' : '#065f46'}
            transparent
            opacity={sensorOpacity}
          />
        </mesh>

        {/* Laser / Optical Detection Cone Beam (shines toward conveyor) */}
        {isProximityActive && (
          <mesh position={[0, 0.45, 0]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.005, 0.09, 0.35, 12]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} />
          </mesh>
        )}

        {/* Proximity Holographic Tooltip */}
        {hoveredSensor === 'prox' && (
          <Html position={[0, 0.4, 0]} center distanceFactor={8} zIndexRange={[100, 0]}>
            <div className="pointer-events-none select-none px-3 py-1.5 rounded-lg text-left backdrop-blur-md border border-cyan-400/40 shadow-[0_0_20px_rgba(56,189,248,0.4)] bg-[#020b18]/90 text-white font-mono min-w-[180px] animate-fadeIn">
              <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1 mb-1">
                <span className="text-[10px] font-bold text-sky-400">INDUCTIVE SENSOR</span>
                <span
                  className={`text-[8px] font-bold px-1 py-0.2 rounded ${
                    isProximityActive
                      ? 'text-emerald-400 bg-emerald-950/70 border border-emerald-500/40'
                      : 'text-slate-400 bg-slate-800'
                  }`}
                >
                  {isProximityActive ? 'DETECTED' : 'STANDBY'}
                </span>
              </div>
              <div className="text-[9px] text-slate-300">
                <div>Target: Precision Workpiece</div>
                <div>Dist: {isProximityActive ? '3.8 mm' : 'N/A'}</div>
                <div className="text-[8px] text-cyan-400 pt-0.5">(Click to send signal pulse)</div>
              </div>
            </div>
          </Html>
        )}
      </group>

      {/* ========================================================
          2. TEMPERATURE TRANSDUCER SENSOR (RTD PT100)
          Position: [1.9, 0.52, -0.28]
         ======================================================== */}
      <group
        position={[1.9, 0.52, -0.28]}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHoverSensor('temp')
        }}
        onPointerOut={() => onHoverSensor(null)}
        onClick={(e) => handleClick(e, 'temp')}
      >
        {/* Support Pillar */}
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.45, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Heat Sink Ribbed Head Enclosure */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.18, 16]} />
          <meshStandardMaterial
            color={hoveredSensor === 'temp' ? '#0284c7' : '#0f2744'}
            metalness={0.85}
            roughness={0.25}
            emissive={hoveredSensor === 'temp' ? '#0369a1' : '#00142f'}
            emissiveIntensity={hoveredSensor === 'temp' ? 0.5 : 0}
            transparent
            opacity={sensorOpacity}
          />
        </mesh>

        {/* Heatsink Fins */}
        {[-0.05, 0, 0.05].map((y, i) => (
          <mesh key={`fin-${i}`} position={[0, y, 0]}>
            <cylinderGeometry args={[0.088, 0.088, 0.015, 16]} />
            <meshStandardMaterial color="#1e3a5f" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}

        {/* Thermocouple Probe Stem */}
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.18, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </mesh>

        {/* Digital Indicator Beacon */}
        <mesh position={[0, -0.09, 0]}>
          <sphereGeometry args={[0.028, 12, 12]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={sensorOpacity} />
        </mesh>

        {/* Temperature Holographic Tooltip */}
        {hoveredSensor === 'temp' && (
          <Html position={[0, 0.35, 0]} center distanceFactor={8} zIndexRange={[100, 0]}>
            <div className="pointer-events-none select-none px-3 py-1.5 rounded-lg text-left backdrop-blur-md border border-cyan-400/40 shadow-[0_0_20px_rgba(56,189,248,0.4)] bg-[#020b18]/90 text-white font-mono min-w-[180px] animate-fadeIn">
              <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1 mb-1">
                <span className="text-[10px] font-bold text-sky-400">RTD PT100 SENSOR</span>
                <span className="text-[8px] font-bold text-sky-300 bg-sky-950/70 border border-sky-500/40 px-1 py-0.2 rounded">
                  CALIBRATED
                </span>
              </div>
              <div className="text-[9px] text-slate-300">
                <div className="flex justify-between">
                  <span>Temperature:</span>
                  <span className="font-bold text-cyan-200">{tempValue} °C</span>
                </div>
                <div className="flex justify-between">
                  <span>Stability:</span>
                  <span className="text-emerald-400">99.8%</span>
                </div>
                <div className="text-[8px] text-cyan-400 pt-0.5">(Click to send telemetry pulse)</div>
              </div>
            </div>
          </Html>
        )}
      </group>

      {/* ========================================================
          3. HUMIDITY & PROCESS SENSOR
          Position: [1.5, 0.32, -0.9]
         ======================================================== */}
      <group
        position={[1.5, 0.32, -0.9]}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHoverSensor('humidity')
        }}
        onPointerOut={() => onHoverSensor(null)}
        onClick={(e) => handleClick(e, 'humidity')}
      >
        {/* Support Base */}
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.25, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Industrial Transmitter Case */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.16, 0.16, 0.12]} />
          <meshStandardMaterial
            color={hoveredSensor === 'humidity' ? '#0284c7' : '#081c38'}
            metalness={0.8}
            roughness={0.3}
            transparent
            opacity={sensorOpacity}
          />
        </mesh>

        {/* Sensor Sintered Vent Cap */}
        <mesh position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.07, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.5} />
        </mesh>

        {/* Dual Status LEDs */}
        <mesh position={[-0.04, -0.02, 0.065]}>
          <circleGeometry args={[0.015, 10]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
        <mesh position={[0.04, -0.02, 0.065]}>
          <circleGeometry args={[0.015, 10]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>

        {/* Humidity Holographic Tooltip */}
        {hoveredSensor === 'humidity' && (
          <Html position={[0, 0.3, 0]} center distanceFactor={8} zIndexRange={[100, 0]}>
            <div className="pointer-events-none select-none px-3 py-1.5 rounded-lg text-left backdrop-blur-md border border-cyan-400/40 shadow-[0_0_20px_rgba(56,189,248,0.4)] bg-[#020b18]/90 text-white font-mono min-w-[180px] animate-fadeIn">
              <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1 mb-1">
                <span className="text-[10px] font-bold text-sky-400">PROCESS SENSOR</span>
                <span className="text-[8px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-1 py-0.2 rounded">
                  NORMAL
                </span>
              </div>
              <div className="text-[9px] text-slate-300">
                <div className="flex justify-between">
                  <span>Relative Humidity:</span>
                  <span className="font-bold text-cyan-200">{humidityValue} %</span>
                </div>
                <div className="flex justify-between">
                  <span>Process Pressure:</span>
                  <span className="font-bold text-sky-300">{pressureValue} Bar</span>
                </div>
                <div className="text-[8px] text-cyan-400 pt-0.5">(Click to send telemetry pulse)</div>
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}
