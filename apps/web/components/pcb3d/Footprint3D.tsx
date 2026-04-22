import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { FOOTPRINT_DEFS, FootprintDef } from '@workspace/core'
import { STACKUP_Z, STACKUP_T } from './BoardStackup'

interface FootprintData {
  _id: string
  componentRef: string
  footprintId: string
  x: number     // mm from board center
  y: number     // mm from board center
  rotation: number // degrees
  layer: 'F.Cu' | 'B.Cu'
}

interface Footprint3DProps {
  footprint: FootprintData
  showComponents: boolean
  boardHalfW: number
  boardHalfH: number
}

// Component body appearance by footprint type
function getBodyStyle(footprintId: string): {
  color: string
  height: number   // mm
  emissive?: string
  emissiveIntensity?: number
  metalness?: number
  roughness?: number
} {
  if (footprintId.startsWith('R')) return { color: '#2a2a2a', height: 0.5, roughness: 1, metalness: 0 }
  if (footprintId.startsWith('C')) return { color: '#8B7355', height: 0.8, roughness: 1, metalness: 0 }
  if (footprintId.includes('DIP')) return { color: '#1a1a1a', height: 3.8, roughness: 1, metalness: 0 }
  if (footprintId.startsWith('LED')) return { color: '#e8e8f0', height: 1.2, emissive: '#aaaaff', emissiveIntensity: 0.2, roughness: 1, metalness: 0 }
  if (footprintId.includes('SOT')) return { color: '#111111', height: 1.0, roughness: 1, metalness: 0 }
  if (footprintId.includes('SW_PUSH')) return { color: '#333333', height: 3.5, roughness: 1, metalness: 0 }
  if (footprintId.includes('BAT')) return { color: '#1a1a2e', height: 5.0, roughness: 1, metalness: 0 }
  return { color: '#222222', height: 1.0, roughness: 1, metalness: 0 }
}

// Pad color based on net assignment and layer
const PAD_COLOR_F = '#c8a020'
const PAD_COLOR_B = '#3060c8'
const PAD_COLOR_CONNECTED = '#22cc44'

export function Footprint3D({ footprint, showComponents, boardHalfW, boardHalfH }: Footprint3DProps) {
  const def: FootprintDef = FOOTPRINT_DEFS[footprint.footprintId] ?? FOOTPRINT_DEFS['R0603']!
  const isTop = footprint.layer === 'F.Cu'
  const style = getBodyStyle(footprint.footprintId)

  // Convert mm from DB (origin=top-left of board) to Three.js coords (origin=center)
  // DB stores x,y in mm from board origin (top-left in 2D editor)
  // Three.js scene: X = right, Y = up, Z = toward viewer. Board is flat on XZ.
  // We negate Z because PCB Y-down maps to Three.js -Z
  const posX = footprint.x - boardHalfW
  const posZ = -(footprint.y - boardHalfH)

  // Y position = top surface of the correct copper layer
  const copperTopY = isTop
    ? STACKUP_Z.topCopper + STACKUP_T.copper
    : STACKUP_Z.bottomCopper  // bottom faces downward

  const bodyY = isTop
    ? copperTopY + style.height / 2
    : copperTopY - style.height / 2

  const bodyW = def.w
  const bodyD = def.h  // footprint height in mm → Three.js Z depth
  const rotY = (footprint.rotation * Math.PI) / 180

  // Pad geometry memoized per footprint
  const pads = useMemo(() => {
    return def.pads.map(pad => {
      const padX = pad.x
      const padZ = -pad.y
      const padW = pad.width
      const padD = pad.height
      const padH = STACKUP_T.copper
      const padY = isTop
        ? STACKUP_Z.topCopper + padH / 2
        : STACKUP_Z.bottomCopper + padH / 2
      const roundness = pad.shape === 'circle' ? 1 : 0.15
      return { padX, padZ, padW, padD, padH, padY, roundness, number: pad.number }
    })
  }, [def, isTop])

  return (
    <group
      position={[posX, 0, posZ]}
      rotation={[0, rotY, 0]}
    >
      {/* Pads — thin copper rectangles on the copper layer surface */}
      {pads.map(pad => (
        <mesh key={pad.number} position={[pad.padX, pad.padY, pad.padZ]}>
          <boxGeometry args={[pad.padW, pad.padH, pad.padD]} />
          <meshBasicMaterial
            color={isTop ? PAD_COLOR_F : PAD_COLOR_B}
          />
        </mesh>
      ))}

      {/* Component body */}
      {showComponents && (
        <mesh position={[0, bodyY, 0]} castShadow>
          <boxGeometry args={[bodyW, style.height, bodyD]} />
          <meshBasicMaterial
            color={style.color}
          />
        </mesh>
      )}

      {/* LED dome glow effect */}
      {showComponents && footprint.footprintId.startsWith('LED') && (
        <mesh position={[0, bodyY + style.height / 2, 0]}>
          <sphereGeometry args={[1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial
            color="#c8c8ff"
            transparent
            opacity={0.6}
          />
        </mesh>
      )}

      {/* DIP IC body notch */}
      {showComponents && footprint.footprintId.includes('DIP') && (
        <mesh position={[0, bodyY + style.height / 2 + 0.1, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 0.3, 16]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
      )}

      {/* Tactile switch cap */}
      {showComponents && footprint.footprintId.includes('SW_PUSH') && (
        <mesh position={[0, bodyY + style.height / 2 + 0.5, 0]}>
          <cylinderGeometry args={[1.8, 1.8, 1.0, 24]} />
          <meshBasicMaterial color="#cccccc" />
        </mesh>
      )}

      {/* Ref designator text label (using a small marker ring) */}
      <mesh position={[0, isTop ? STACKUP_Z.topSilkscreen + 0.02 : STACKUP_Z.bottomSilkscreen - 0.02, 0]}>
        <ringGeometry args={[bodyW / 2 + 0.1, bodyW / 2 + 0.25, 32]} />
        <meshBasicMaterial
          color={isTop ? '#ffffff' : '#ffff44'}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
