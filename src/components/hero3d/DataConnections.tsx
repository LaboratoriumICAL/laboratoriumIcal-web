'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface DataConnectionsProps {
  revealPhase: number // 0 to 5+
  pulseTrigger: number
  activeSensor: string | null
}

interface PulsePacket {
  progress: number
  speed: number
  curveIndex: number
  color: string
  size: number
}

export default function DataConnections({ revealPhase, pulseTrigger, activeSensor }: DataConnectionsProps) {
  // Define 3D Bezier curve conduits interconnecting the automation components
  // 0: Sensor 1 (Proximity) -> PLC
  // 1: Sensor 2 (Temperature) -> PLC
  // 2: Sensor 3 (Humidity/Process) -> PLC
  // 3: PLC -> Conveyor Motor
  // 4: PLC -> SCADA Monitor
  const curves = useMemo(() => {
    return [
      // Sensor 1 (Proximity at [1.4, 0.3, 0.9]) -> PLC at [0, 0.85, 0]
      new THREE.CubicBezierCurve3(
        new THREE.Vector3(1.35, 0.28, 0.85),
        new THREE.Vector3(1.0, 0.1, 0.5),
        new THREE.Vector3(0.5, 0.15, 0.2),
        new THREE.Vector3(0.2, 0.55, 0.15)
      ),
      // Sensor 2 (Temp at [2.0, 0.55, -0.3]) -> PLC at [0, 0.85, 0]
      new THREE.CubicBezierCurve3(
        new THREE.Vector3(1.9, 0.45, -0.28),
        new THREE.Vector3(1.4, 0.18, -0.25),
        new THREE.Vector3(0.75, 0.22, -0.08),
        new THREE.Vector3(0.22, 0.65, -0.05)
      ),
      // Sensor 3 (Humidity/Process at [1.6, 0.35, -1.0]) -> PLC
      new THREE.CubicBezierCurve3(
        new THREE.Vector3(1.5, 0.26, -0.9),
        new THREE.Vector3(1.1, 0.1, -0.65),
        new THREE.Vector3(0.55, 0.14, -0.35),
        new THREE.Vector3(0.12, 0.55, -0.15)
      ),
      // PLC -> Motor at [-1.7, 0.3, 0.9]
      new THREE.CubicBezierCurve3(
        new THREE.Vector3(-0.25, 0.55, 0.15),
        new THREE.Vector3(-0.65, 0.12, 0.3),
        new THREE.Vector3(-1.2, 0.12, 0.65),
        new THREE.Vector3(-1.5, 0.28, 0.85)
      ),
      // PLC -> SCADA at [-1.4, 1.3, -0.3]
      new THREE.CubicBezierCurve3(
        new THREE.Vector3(-0.1, 1.0, -0.08),
        new THREE.Vector3(-0.55, 1.35, -0.18),
        new THREE.Vector3(-1.0, 1.2, -0.26),
        new THREE.Vector3(-1.25, 1.15, -0.28)
      ),
    ]
  }, [])

  // Generate tube geometries for the static subtle cable conduits
  const tubeGeometries = useMemo(() => {
    return curves.map((c) => new THREE.TubeGeometry(c, 48, 0.016, 8, false))
  }, [curves])

  // Dynamic particle packet objects
  const packets = useRef<PulsePacket[]>([
    { progress: 0.1, speed: 0.55, curveIndex: 0, color: '#38BDF8', size: 0.045 },
    { progress: 0.6, speed: 0.55, curveIndex: 0, color: '#38BDF8', size: 0.038 },
    { progress: 0.3, speed: 0.48, curveIndex: 1, color: '#0EA5E9', size: 0.045 },
    { progress: 0.8, speed: 0.48, curveIndex: 1, color: '#0EA5E9', size: 0.038 },
    { progress: 0.2, speed: 0.52, curveIndex: 2, color: '#7DD3FC', size: 0.045 },
    { progress: 0.7, speed: 0.52, curveIndex: 2, color: '#7DD3FC', size: 0.038 },
    { progress: 0.4, speed: 0.6, curveIndex: 3, color: '#38BDF8', size: 0.045 },
    { progress: 0.9, speed: 0.6, curveIndex: 3, color: '#38BDF8', size: 0.038 },
    { progress: 0.15, speed: 0.65, curveIndex: 4, color: '#8B5CF6', size: 0.055 },
    { progress: 0.55, speed: 0.65, curveIndex: 4, color: '#38BDF8', size: 0.048 },
    { progress: 0.85, speed: 0.65, curveIndex: 4, color: '#7DD3FC', size: 0.042 },
  ])

  // References to pulse mesh instances
  const packetMeshRefs = useRef<(THREE.Mesh | null)[]>([])

  useFrame((_, delta) => {
    if (revealPhase < 2) return

    const clampedDelta = Math.min(delta, 0.1)

    packets.current.forEach((pkt, i) => {
      const speedMultiplier = pulseTrigger > 0 ? 2.0 : 1.0
      pkt.progress += clampedDelta * pkt.speed * speedMultiplier

      if (pkt.progress > 1.0) {
        pkt.progress = 0
      }

      const mesh = packetMeshRefs.current[i]
      if (mesh) {
        const curve = curves[pkt.curveIndex]
        const pos = curve.getPointAt(pkt.progress)
        mesh.position.copy(pos)

        // Fade in/out at endpoints
        const opacity = Math.sin(pkt.progress * Math.PI) * (revealPhase >= 4 ? 1 : (revealPhase - 2) * 0.5)
        if (mesh.material instanceof THREE.MeshBasicMaterial) {
          mesh.material.opacity = Math.max(0, Math.min(1, opacity))
        }
      }
    })
  })

  const cableOpacity = revealPhase < 1 ? 0 : Math.min(0.75, (revealPhase - 0.8) * 0.4)

  return (
    <group>
      {/* 3D Conduit Cables */}
      {tubeGeometries.map((geom, idx) => (
        <mesh key={`cable-${idx}`} geometry={geom}>
          <meshStandardMaterial
            color={idx === 4 ? '#3B82F6' : '#0F2744'}
            emissive={idx === 4 ? '#1D4ED8' : '#0369A1'}
            emissiveIntensity={revealPhase >= 2 ? 0.8 : 0.1}
            roughness={0.4}
            metalness={0.8}
            transparent
            opacity={cableOpacity}
          />
        </mesh>
      ))}

      {/* Glowing Dynamic Data Pulse Packets */}
      {packets.current.map((pkt, i) => (
        <mesh
          key={`pkt-${i}`}
          ref={(el) => {
            packetMeshRefs.current[i] = el
          }}
          visible={revealPhase >= 2}
        >
          <sphereGeometry args={[pkt.size, 10, 10]} />
          <meshBasicMaterial
            color={pkt.color}
            transparent
            opacity={0.95}
          />
        </mesh>
      ))}
    </group>
  )
}
