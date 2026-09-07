'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface ScadaMonitorProps {
  revealPhase: number
  isHovered: boolean
  onHover: (hovered: boolean) => void
  scadaMode: number
  onToggleMode: () => void
  pulseTrigger: number
}

const MODES = [
  { title: 'PID CLOSED-LOOP RESPONSE', label: 'PID CONTROLLER' },
  { title: 'THERMAL PROCESS TELEMETRY', label: 'THERMAL DYNAMICS' },
  { title: 'THROUGHPUT & I/O MONITOR', label: 'SYSTEM OVERVIEW' },
]

export default function ScadaMonitor({
  revealPhase,
  isHovered,
  onHover,
  scadaMode,
  onToggleMode,
  pulseTrigger,
}: ScadaMonitorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)
  const timeRef = useRef(0)

  // Initialize offscreen 2D Canvas for dynamic 60fps holographic SCADA HUD rendering
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 360
    canvasRef.current = canvas

    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    textureRef.current = texture

    return () => {
      texture.dispose()
    }
  }, [])

  // Draw HUD frames every tick
  useFrame((_, delta) => {
    if (revealPhase < 4 || !canvasRef.current || !textureRef.current) return

    timeRef.current += delta
    const t = timeRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear background (Dark holographic blue with subtle transparency)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(2, 14, 34, 0.88)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Outer cyber border
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 3
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12)

    // Corner brackets
    const bracketSize = 16
    ctx.strokeStyle = '#7dd3fc'
    ctx.lineWidth = 4
    // Top-Left
    ctx.beginPath()
    ctx.moveTo(12, 12 + bracketSize)
    ctx.lineTo(12, 12)
    ctx.lineTo(12 + bracketSize, 12)
    ctx.stroke()
    // Top-Right
    ctx.beginPath()
    ctx.moveTo(canvas.width - 12 - bracketSize, 12)
    ctx.lineTo(canvas.width - 12, 12)
    ctx.lineTo(canvas.width - 12, 12 + bracketSize)
    ctx.stroke()
    // Bottom-Left
    ctx.beginPath()
    ctx.moveTo(12, canvas.height - 12 - bracketSize)
    ctx.lineTo(12, canvas.height - 12)
    ctx.lineTo(12 + bracketSize, canvas.height - 12)
    ctx.stroke()
    // Bottom-Right
    ctx.beginPath()
    ctx.moveTo(canvas.width - 12 - bracketSize, canvas.height - 12)
    ctx.lineTo(canvas.width - 12, canvas.height - 12)
    ctx.lineTo(canvas.width - 12, canvas.height - 12 - bracketSize)
    ctx.stroke()

    // Header bar
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)'
    ctx.fillRect(16, 16, canvas.width - 32, 34)

    ctx.fillStyle = '#38bdf8'
    ctx.font = 'bold 13px Courier New, monospace'
    ctx.fillText('ICAL SCADA // LAB NODE #01', 26, 38)

    ctx.fillStyle = '#10b981'
    ctx.font = 'bold 11px Courier New, monospace'
    ctx.fillText('● SYSTEM ONLINE', canvas.width - 150, 38)

    // Subheader: Active Mode
    const currentMode = MODES[scadaMode % MODES.length]
    ctx.fillStyle = '#bae6fd'
    ctx.font = 'bold 11px Courier New, monospace'
    ctx.fillText(`VIEW: ${currentMode.title}`, 26, 68)

    // Grid Matrix Background for Oscilloscope
    const gridX = 26
    const gridY = 78
    const gridW = canvas.width - 52
    const gridH = 175

    ctx.fillStyle = 'rgba(4, 24, 54, 0.6)'
    ctx.fillRect(gridX, gridY, gridW, gridH)

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)'
    ctx.lineWidth = 1
    for (let x = gridX; x <= gridX + gridW; x += 30) {
      ctx.beginPath()
      ctx.moveTo(x, gridY)
      ctx.lineTo(x, gridY + gridH)
      ctx.stroke()
    }
    for (let y = gridY; y <= gridY + gridH; y += 25) {
      ctx.beginPath()
      ctx.moveTo(gridX, y)
      ctx.lineTo(gridX + gridW, y)
      ctx.stroke()
    }

    // Draw Graph Based on Selected Mode
    if (scadaMode % 3 === 0) {
      // 1. PID Step Response Waveform
      // Setpoint line (Target = 1.0)
      const setpointY = gridY + gridH * 0.35
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(gridX, setpointY)
      ctx.lineTo(gridX + gridW, setpointY)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#f59e0b'
      ctx.font = '9px Courier New, monospace'
      ctx.fillText('SETPOINT r(t)=1.0', gridX + 6, setpointY - 4)

      // Dynamic PID curve (Underdamped second-order step response with subtle live jitter)
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      for (let i = 0; i <= gridW; i += 3) {
        const timeNorm = (i / gridW) * 7 + (t * 0.8) % 7
        // Underdamped response equation: 1 - e^(-zeta*wn*t) * (cos(wd*t) + (zeta/sqrt(1-zeta^2))*sin(wd*t))
        const response =
          1 -
          Math.exp(-0.45 * timeNorm) *
            (Math.cos(2.2 * timeNorm) + 0.3 * Math.sin(2.2 * timeNorm))
        const py = gridY + gridH * 0.85 - response * (gridH * 0.5)
        if (i === 0) ctx.moveTo(gridX + i, py)
        else ctx.lineTo(gridX + i, py)
      }
      ctx.stroke()

      // Metrics in PID Mode
      ctx.fillStyle = '#7dd3fc'
      ctx.font = '10px Courier New, monospace'
      ctx.fillText('Kp: 3.42  Ki: 0.85  Kd: 0.12', gridX + 6, gridY + gridH - 10)
      ctx.fillText('Overshoot: 4.8%  Rise Time: 0.24s', gridX + 220, gridY + gridH - 10)
    } else if (scadaMode % 3 === 1) {
      // 2. Thermal Dynamics Temperature Waveform
      ctx.strokeStyle = '#0ea5e9'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      for (let i = 0; i <= gridW; i += 3) {
        const phase = i * 0.05 + t * 2.5
        const tempSim = 24.6 + Math.sin(phase) * 0.8 + Math.cos(phase * 2.1) * 0.3
        const py = gridY + gridH * 0.5 - (tempSim - 24.0) * 45
        if (i === 0) ctx.moveTo(gridX + i, py)
        else ctx.lineTo(gridX + i, py)
      }
      ctx.stroke()

      ctx.fillStyle = '#38bdf8'
      ctx.font = '10px Courier New, monospace'
      ctx.fillText('PROCESS TEMP: 24.6°C  [NOMINAL]', gridX + 6, gridY + gridH - 10)
      ctx.fillText('SENSOR: RTD PT100 (CH-A)', gridX + 240, gridY + gridH - 10)
    } else {
      // 3. Bar Charts & Throughput Analytics
      const barCount = 7
      const barWidth = 32
      const barSpacing = (gridW - barCount * barWidth) / (barCount + 1)

      for (let i = 0; i < barCount; i++) {
        const bx = gridX + barSpacing + i * (barWidth + barSpacing)
        const bh = 30 + Math.abs(Math.sin(t * 1.5 + i * 0.8)) * 85
        const by = gridY + gridH - 25 - bh

        ctx.fillStyle = i === 3 ? '#8b5cf6' : '#0284c7'
        ctx.fillRect(bx, by, barWidth, bh)

        ctx.strokeStyle = '#38bdf8'
        ctx.lineWidth = 1
        ctx.strokeRect(bx, by, barWidth, bh)

        ctx.fillStyle = '#94a3b8'
        ctx.font = '8px Courier New, monospace'
        ctx.fillText(`Q${i + 1}`, bx + 8, gridY + gridH - 10)
      }
    }

    // Telemetry Footer Strip
    const footerY = 270
    ctx.fillStyle = 'rgba(56, 189, 248, 0.1)'
    ctx.fillRect(26, footerY, canvas.width - 52, 60)

    ctx.strokeStyle = '#0284c7'
    ctx.lineWidth = 1
    ctx.strokeRect(26, footerY, canvas.width - 52, 60)

    ctx.fillStyle = '#e2e8f0'
    ctx.font = '10px Courier New, monospace'
    ctx.fillText('SCAN: 1.2ms', 38, footerY + 22)
    ctx.fillText('MOTOR: 1450 RPM', 140, footerY + 22)
    ctx.fillText('LINE SPEED: 100%', 270, footerY + 22)
    ctx.fillText('ERRORS: 0', 400, footerY + 22)

    ctx.fillStyle = '#38bdf8'
    ctx.fillText('[ CLICK TO TOGGLE TELEMETRY VIEW ]', 120, footerY + 46)

    textureRef.current.needsUpdate = true
  })

  const scadaOpacity = revealPhase < 4 ? 0 : Math.min(1, (revealPhase - 3.8) * 2)

  return (
    <group
      position={[-1.4, 1.25, -0.3]}
      rotation={[0, Math.PI / 8, 0]}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(true)
      }}
      onPointerOut={() => onHover(false)}
      onClick={(e) => {
        e.stopPropagation()
        onToggleMode()
      }}
      visible={revealPhase >= 3.5}
    >
      {/* 1. Carbon Articulated Mounting Arm */}
      <mesh position={[0.45, -0.4, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.025, 0.025, 0.65, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Articulation Joint Sphere */}
      <mesh position={[0.22, -0.16, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 2. Holographic Screen Bezel / Frame */}
      <mesh position={[0, 0, -0.015]}>
        <boxGeometry args={[1.52, 1.12, 0.04]} />
        <meshStandardMaterial
          color={isHovered ? '#0c284e' : '#05162d'}
          metalness={0.85}
          roughness={0.25}
          emissive={isHovered ? '#0284c7' : '#00142f'}
          emissiveIntensity={isHovered ? 0.4 : 0.05}
          transparent
          opacity={scadaOpacity}
        />
      </mesh>

      {/* 3. Transparent Holographic Glass Display Face with Dynamic Texture */}
      {textureRef.current && (
        <mesh position={[0, 0, 0.015]}>
          <planeGeometry args={[1.42, 1.02]} />
          <meshBasicMaterial
            map={textureRef.current}
            transparent
            opacity={scadaOpacity * 0.95}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 4. Glowing Edge Neon Trim Accent */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.48, 1.08, 0.02]} />
        <meshBasicMaterial
          color="#38bdf8"
          wireframe
          transparent
          opacity={scadaOpacity * (isHovered ? 0.8 : 0.35)}
        />
      </mesh>

      {/* 5. Holographic Status Tooltip */}
      {isHovered && (
        <Html position={[0, 0.75, 0.1]} center distanceFactor={8} zIndexRange={[100, 0]}>
          <div className="pointer-events-none select-none px-3.5 py-2 rounded-xl text-left backdrop-blur-md border border-cyan-400/40 shadow-[0_0_25px_rgba(56,189,248,0.4)] bg-[#020b18]/90 text-white font-mono min-w-[200px] animate-fadeIn">
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1 mb-1.5">
              <span className="text-[11px] font-bold text-sky-400">SCADA HMI MONITOR</span>
              <span className="text-[9px] font-bold text-cyan-300 bg-sky-950/70 border border-sky-500/40 px-1.5 py-0.5 rounded">
                LIVE
              </span>
            </div>
            <div className="text-[10px] text-slate-300 space-y-0.5">
              <div>Mode: {MODES[scadaMode % MODES.length].label}</div>
              <div>Process: PID Closed Loop</div>
              <div>Telemetry: Real-Time 60Hz</div>
              <div className="text-[9px] text-cyan-400 pt-1 text-center font-bold">
                (Click screen to switch view)
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
