'use client'

import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Grid, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

interface PCBSceneProps {
  boardWidthMm: number
  boardHeightMm: number
  cameraPreset: 'iso' | 'top' | 'bottom' | 'front' | 'side'
}

// Camera positions for presets
const PRESETS: Record<string, [number, number, number]> = {
  iso: [1.2, 0.9, 1.1],     // normalized, scaled by board diagonal
  top: [0, 1, 0.001],
  bottom: [0, -1, 0.001],
  front: [0, 0.2, 1],
  side: [1, 0.2, 0],
}

function CameraRig({ preset, boardWidthMm, boardHeightMm }: { preset: string, boardWidthMm: number, boardHeightMm: number }) {
  const { camera } = useThree()
  const targetRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const diagonal = Math.sqrt(boardWidthMm ** 2 + boardHeightMm ** 2)
  const dist = diagonal * 0.9

  useEffect(() => {
    const p = PRESETS[preset] ?? PRESETS.iso!
    const [nx, ny, nz] = p
    const newPos = new THREE.Vector3(nx * dist, ny * dist, nz * dist)
    camera.position.copy(newPos)
    camera.lookAt(0, 0.85, 0)  // look at board center (Y≈0.85 is mid-stackup)
  }, [preset, dist, camera])

  return null
}

export function PCBScene({ boardWidthMm, boardHeightMm, cameraPreset }: PCBSceneProps) {
  const diagonal = Math.sqrt(boardWidthMm ** 2 + boardHeightMm ** 2)

  return (
    <>
      {/* Camera rig — sets position on preset change */}
      <CameraRig preset={cameraPreset} boardWidthMm={boardWidthMm} boardHeightMm={boardHeightMm} />

      {/* Orbit controls */}
      <OrbitControls
        target={[0, 0.85, 0]}
        enableDamping
        dampingFactor={0.08}
        minDistance={diagonal * 0.1}
        maxDistance={diagonal * 3}
        makeDefault
      />

      {/* Uniform Lighting Setup */}
      <ambientLight intensity={1.5} />
      <hemisphereLight 
        intensity={0.8} 
        color="#ffffff" 
        groundColor="#202025" 
      />

      {/* Reference grid below the board */}
      <Grid
        position={[0, -0.2, 0]}
        args={[boardWidthMm * 2.5, boardHeightMm * 2.5]}
        cellSize={10}
        cellThickness={0.5}
        cellColor="#1a2a3a"
        sectionSize={50}
        sectionThickness={1}
        sectionColor="#2a4a6a"
        fadeDistance={diagonal * 2.5}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Soft contact shadows under the board */}
      <ContactShadows
        position={[0, -0.15, 0]}
        opacity={0.4}
        scale={diagonal * 1.5}
        blur={2}
        far={10}
        color="#000820"
      />
    </>
  )
}
