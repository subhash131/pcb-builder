import { useMemo } from 'react'
import * as THREE from 'three'

interface BoardLayerProps {
  /** 2D board outline (XY plane) */
  shape: THREE.Shape
  /** Thickness / extrusion depth in Three.js units (mm scale) */
  depth: number
  /** Z offset to position the bottom of this layer */
  zOffset: number
  color: string
  opacity?: number
  transparent?: boolean
  metalness?: number
  roughness?: number
  renderOrder?: number
}

export function BoardLayer({
  shape,
  depth,
  zOffset,
  color,
  opacity = 1,
  transparent = false,
  metalness = 0,
  roughness = 0.8,
  renderOrder = 0,
}: BoardLayerProps) {
  const extrudeSettings = useMemo<THREE.ExtrudeGeometryOptions>(
    () => ({ depth, bevelEnabled: false }),
    [depth]
  )

  return (
    // Extrusion goes along +Z by default; we rotate so the board lies flat (XZ plane)
    // then shift up by zOffset so layers stack correctly
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, zOffset, 0]}
      renderOrder={renderOrder}
    >
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshBasicMaterial
        color={color}
        opacity={opacity}
        transparent={transparent}
        side={THREE.DoubleSide}
        depthWrite={!transparent}
      />
    </mesh>
  )
}
