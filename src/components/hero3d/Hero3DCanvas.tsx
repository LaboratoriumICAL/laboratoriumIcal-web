'use client'

import { Suspense, useRef, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Float } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'

import PlcModule from './PlcModule'
import SensorsCluster from './SensorsCluster'
import ConveyorSystem from './ConveyorSystem'
import ScadaMonitor from './ScadaMonitor'
import DataConnections from './DataConnections'
import HeroEnvironment from './HeroEnvironment'

interface Hero3DCanvasProps {
  onTelemetryUpdate?: (data: any) => void
  manualTriggerCount?: number
  selectedScadaMode?: number
  onScadaModeChange?: (mode: number) => void
  motorSpeedMultiplier?: number
  onToggleMotorSpeed?: () => void
}

function SceneDirector({
  revealPhase,
  pulseTrigger,
  onPulseComplete,
  scadaMode,
  onToggleScadaMode,
  motorSpeedMultiplier,
  onToggleMotorSpeed,
}: {
  revealPhase: number
  pulseTrigger: number
  onPulseComplete: () => void
  scadaMode: number
  onToggleScadaMode: () => void
  motorSpeedMultiplier: number
  onToggleMotorSpeed: () => void
}) {
  const { camera, pointer, size } = useThree()

  // 3D Model Group & Rig
  const systemRigRef = useRef<THREE.Group>(null)

  // Interactive Hover States
  const [hoveredObject, setHoveredObject] = useState<string | null>(null)
  const [isWorkpieceNear, setIsWorkpieceNear] = useState(false)
  const [internalPulseTrigger, setInternalPulseTrigger] = useState(0)

  // Initial Camera Glide Transition
  useEffect(() => {
    const isMobile = size.width < 768
    const targetZ = isMobile ? 7.2 : 5.6
    const targetX = isMobile ? 0 : 0.4
    const targetY = isMobile ? 1.6 : 1.35

    gsap.to(camera.position, {
      x: targetX,
      y: targetY,
      z: targetZ,
      duration: 3.5,
      ease: 'power2.out',
    })
  }, [camera, size.width])

  // Mouse Parallax & Cinematic Breathing
  useFrame((state, delta) => {
    if (!systemRigRef.current) return

    const isMobile = size.width < 768
    const parallaxIntensity = isMobile ? 0.08 : 0.22

    // Parallax target angles
    const targetRotY = pointer.x * parallaxIntensity + Math.sin(state.clock.elapsedTime * 0.4) * 0.025
    const targetRotX = -pointer.y * (parallaxIntensity * 0.6) + Math.cos(state.clock.elapsedTime * 0.3) * 0.015

    // Smooth lerp damping
    systemRigRef.current.rotation.y = THREE.MathUtils.lerp(
      systemRigRef.current.rotation.y,
      targetRotY,
      0.05
    )
    systemRigRef.current.rotation.x = THREE.MathUtils.lerp(
      systemRigRef.current.rotation.x,
      targetRotX,
      0.05
    )
  })

  // Trigger pulse from sensor to PLC
  const handleSensorTrigger = useCallback((sensorName: string) => {
    setInternalPulseTrigger((prev) => prev + 1)
  }, [])

  // Trigger diagnostic pulse from PLC
  const handlePlcPulse = useCallback(() => {
    setInternalPulseTrigger((prev) => prev + 1)
  }, [])

  const totalPulses = pulseTrigger + internalPulseTrigger

  return (
    <>
      {/* Cinematic Lighting System */}
      <ambientLight intensity={revealPhase >= 1 ? 0.9 : 0.2} color="#0c2340" />
      <directionalLight
        position={[6, 8, 5]}
        intensity={revealPhase >= 1 ? 2.6 : 0.5}
        color="#ffffff"
      />
      {/* Cyan Rim Accent Light */}
      <pointLight
        position={[-5, 4, 3]}
        intensity={revealPhase >= 1 ? 2.8 : 0.4}
        color="#38bdf8"
        distance={15}
      />
      {/* Purple High-Tech Backlight */}
      <pointLight
        position={[3, -2, -4]}
        intensity={revealPhase >= 1 ? 1.8 : 0.2}
        color="#8b5cf6"
        distance={12}
      />
      {/* Warm Gold Spark Fill */}
      <pointLight
        position={[0, 3, 2]}
        intensity={revealPhase >= 2 ? 0.8 : 0.1}
        color="#7dd3fc"
        distance={8}
      />

      {/* Main Industrial Rig */}
      <group ref={systemRigRef} position={[0, 0, 0]}>
        {/* Environment Base Pedestal & Floor Grid */}
        <HeroEnvironment revealPhase={revealPhase} />

        {/* 1. PLC Controller Module */}
        <PlcModule
          position={[0, 0.82, 0]}
          revealPhase={revealPhase}
          isHovered={hoveredObject === 'plc'}
          onHover={(h) => setHoveredObject(h ? 'plc' : null)}
          onClick={handlePlcPulse}
          pulseTrigger={totalPulses}
        />

        {/* 2. Industrial Sensors Cluster (Proximity, RTD Temp, Humidity) */}
        <SensorsCluster
          revealPhase={revealPhase}
          hoveredSensor={hoveredObject?.startsWith('sensor-') ? hoveredObject.replace('sensor-', '') : null}
          onHoverSensor={(s) => setHoveredObject(s ? `sensor-${s}` : null)}
          onTriggerPulse={handleSensorTrigger}
          isWorkpieceNear={isWorkpieceNear}
        />

        {/* 3. Conveyor & Motor System */}
        <ConveyorSystem
          revealPhase={revealPhase}
          motorHovered={hoveredObject === 'motor'}
          onHoverMotor={(h) => setHoveredObject(h ? 'motor' : null)}
          onWorkpieceProximity={setIsWorkpieceNear}
          motorSpeedMultiplier={motorSpeedMultiplier}
          onToggleMotorSpeed={onToggleMotorSpeed}
        />

        {/* 4. SCADA Holographic Interface */}
        <ScadaMonitor
          revealPhase={revealPhase}
          isHovered={hoveredObject === 'scada'}
          onHover={(h) => setHoveredObject(h ? 'scada' : null)}
          scadaMode={scadaMode}
          onToggleMode={onToggleScadaMode}
          pulseTrigger={totalPulses}
        />

        {/* 5. Glowing Bezier Data Bus & Pulses */}
        <DataConnections
          revealPhase={revealPhase}
          pulseTrigger={totalPulses}
          activeSensor={hoveredObject}
        />
      </group>

      {/* Interactive Orbit Controls for Optional User Exploration */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 1.7}
        minPolarAngle={Math.PI / 3.2}
        maxAzimuthAngle={Math.PI / 3.5}
        minAzimuthAngle={-Math.PI / 3.5}
        rotateSpeed={0.5}
        dampingFactor={0.05}
      />
    </>
  )
}

export default function Hero3DCanvas({
  onTelemetryUpdate,
  manualTriggerCount = 0,
  selectedScadaMode = 0,
  onScadaModeChange,
  motorSpeedMultiplier = 1.0,
  onToggleMotorSpeed,
}: Hero3DCanvasProps) {
  // Staged cinematic sequence phase (0.0 to 5.0+)
  const [revealPhase, setRevealPhase] = useState(0)
  const [scadaMode, setScadaMode] = useState(selectedScadaMode)

  // Sync external mode if provided
  useEffect(() => {
    setScadaMode(selectedScadaMode)
  }, [selectedScadaMode])

  // Cinematic 0s–5s timeline timer
  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsedSec = (Date.now() - startTime) / 1000
      setRevealPhase(elapsedSec)
      if (elapsedSec >= 5.5) {
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [])

  const handleToggleScadaMode = useCallback(() => {
    setScadaMode((prev) => {
      const next = (prev + 1) % 3
      if (onScadaModeChange) onScadaModeChange(next)
      return next
    })
  }, [onScadaModeChange])

  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        camera={{ position: [0, 2.8, 8.5], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <SceneDirector
            revealPhase={revealPhase}
            pulseTrigger={manualTriggerCount}
            onPulseComplete={() => {}}
            scadaMode={scadaMode}
            onToggleScadaMode={handleToggleScadaMode}
            motorSpeedMultiplier={motorSpeedMultiplier}
            onToggleMotorSpeed={onToggleMotorSpeed || (() => {})}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
