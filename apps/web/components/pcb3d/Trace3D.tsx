import { useMemo } from 'react'
import * as THREE from 'three'
import { STACKUP_Z, STACKUP_T } from './BoardStackup'

interface TracePoint {
  x: number  // mm
  y: number  // mm
}

interface TraceData {
  _id: string
  points: TracePoint[]
  layer: 'F.Cu' | 'B.Cu'
  width: number  // mm
}

interface Trace3DProps {
  trace: TraceData
  boardHalfW: number
  boardHalfH: number
}

/** Build a flat extruded shape from a polyline with given half-width */
function buildTraceShape(
  points: TracePoint[],
  halfWidth: number,
  boardHalfW: number,
  boardHalfH: number
): THREE.BufferGeometry | null {
  if (points.length < 2) return null

  // Convert PCB coords → Three.js XZ coords (Y is up)
  const pts3: THREE.Vector2[] = points.map(p => new THREE.Vector2(
    p.x - boardHalfW,
    -(p.y - boardHalfH)
  ))

  try {
    // Create a shape that outlines the trace path with width
    // We'll use a CatmullRomCurve to smooth and then buffer it
    const curve = new THREE.CatmullRomCurve3(
      pts3.map(p => new THREE.Vector3(p.x, 0, p.y)),
      false,
      'catmullrom',
      0.1
    )

    // Sample enough points for smooth curves
    const divisions = Math.max(points.length * 4, 32)
    const curvePoints = curve.getPoints(divisions)

    // Build a TubeGeometry along the curve
    const path = new THREE.CatmullRomCurve3(curvePoints, false, 'catmullrom', 0)
    const geo = new THREE.TubeGeometry(path, divisions, halfWidth, 8, false)
    return geo
  } catch {
    return null
  }
}

export function Trace3D({ trace, boardHalfW, boardHalfH }: Trace3DProps) {
  const isTop = trace.layer === 'F.Cu'
  const halfWidth = (trace.width * 1.5) / 2

  // Y position on the copper layer surface
  const layerY = isTop
    ? STACKUP_Z.topCopper + STACKUP_T.copper / 2
    : STACKUP_Z.bottomCopper + STACKUP_T.copper / 2

  const color = isTop ? '#c8a020' : '#3060c8'
  const emissive = isTop ? '#806010' : '#103080'

  const geometry = useMemo(
    () => buildTraceShape(trace.points, halfWidth, boardHalfW, boardHalfH),
    [trace.points, halfWidth, boardHalfW, boardHalfH]
  )

  if (!geometry) return null

  return (
    <mesh geometry={geometry} position={[0, layerY, 0]}>
      <meshBasicMaterial
        color={color}
      />
    </mesh>
  )
}
