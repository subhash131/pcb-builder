import { useMemo } from 'react'
import * as THREE from 'three'
import { BoardLayer } from './BoardLayer'

// PCB physical stackup thicknesses (mm)
const T = {
  silkscreen: 0.01,
  soldermask: 0.025,
  copper: 0.035,
  substrate: 1.6,
}

// Cumulative Z heights from board bottom (0)
const Z = {
  bottomSilkscreen: -(T.silkscreen + T.soldermask),
  bottomSoldermask: -T.soldermask,
  bottomCopper: 0,
  substrate: T.copper,
  topCopper: T.copper + T.substrate,
  topSoldermask: T.copper + T.substrate + T.copper,
  topSilkscreen: T.copper + T.substrate + T.copper + T.soldermask,
}

interface BoardStackupProps {
  /** Board width in mm */
  widthMm: number
  /** Board height in mm */
  heightMm: number
  /** Which layers are visible */
  visible: {
    substrate: boolean
    topCopper: boolean
    bottomCopper: boolean
    soldermask: boolean
    silkscreen: boolean
  }
}

export function BoardStackup({ widthMm, heightMm, visible }: BoardStackupProps) {
  // Build the rectangular board outline shape
  const boardShape = useMemo(() => {
    const s = new THREE.Shape()
    const hw = widthMm / 2
    const hh = heightMm / 2
    s.moveTo(-hw, -hh)
    s.lineTo(hw, -hh)
    s.lineTo(hw, hh)
    s.lineTo(-hw, hh)
    s.closePath()
    return s
  }, [widthMm, heightMm])

  const totalH = T.copper + T.substrate + T.copper + T.soldermask + T.silkscreen

  return (
    <group>
      {/* Bottom silkscreen — yellow (Disabled full-board flood) */}
      {/* {visible.silkscreen && (
        <BoardLayer
          shape={boardShape}
          depth={T.silkscreen}
          zOffset={Z.bottomSilkscreen}
          color="#d4c44a"
          opacity={0.85}
          transparent
          roughness={0.95}
          renderOrder={1}
        />
      )} */}

      {/* Bottom solder mask — translucent deep dark green */}
      {visible.soldermask && (
        <BoardLayer
          shape={boardShape}
          depth={T.soldermask}
          zOffset={Z.bottomSoldermask}
          color="#063e1a"
          opacity={0.8}
          transparent
          roughness={1}
          metalness={0}
          renderOrder={2}
        />
      )}

      {/* Bottom copper — B.Cu blue */}
      {visible.bottomCopper && (
        <BoardLayer
          shape={boardShape}
          depth={T.copper}
          zOffset={Z.bottomCopper}
          color="#3060c8"
          metalness={0}
          roughness={1}
          renderOrder={3}
        />
      )}

      {/* FR4 Substrate — main board body (Deep Forest Green) */}
      {visible.substrate && (
        <BoardLayer
          shape={boardShape}
          depth={T.substrate}
          zOffset={Z.substrate}
          color="#042a0f"
          metalness={0}
          roughness={1}
          renderOrder={4}
        />
      )}

      {/* Top copper — F.Cu gold */}
      {visible.topCopper && (
        <BoardLayer
          shape={boardShape}
          depth={T.copper}
          zOffset={Z.topCopper}
          color="#c8a020"
          metalness={0}
          roughness={1}
          renderOrder={5}
        />
      )}

      {/* Top solder mask — translucent deep dark green */}
      {visible.soldermask && (
        <BoardLayer
          shape={boardShape}
          depth={T.soldermask}
          zOffset={Z.topSoldermask}
          color="#063e1a"
          opacity={0.82}
          transparent
          roughness={1}
          metalness={0}
          renderOrder={6}
        />
      )}

      {/* Top silkscreen — white (Disabled full-board flood) */}
      {/* {visible.silkscreen && (
        <BoardLayer
          shape={boardShape}
          depth={T.silkscreen}
          zOffset={Z.topSilkscreen}
          color="#f0f0f0"
          opacity={0.9}
          transparent
          roughness={0.95}
          renderOrder={7}
        />
      )} */}

      {/* Board edge highlight — thin gold ring around perimeter */}
      <mesh position={[0, Z.substrate + T.substrate / 2, 0]}>
        <boxGeometry args={[widthMm + 0.1, T.substrate + T.copper * 2, 0.1]} />
        <meshStandardMaterial color="#c8a020" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  )
}

export { Z as STACKUP_Z, T as STACKUP_T }
