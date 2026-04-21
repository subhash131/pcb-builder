import { 
  ShapeUtil, 
  TLBaseShape, 
  HTMLContainer,
  Rectangle2d,
} from 'tldraw'
import { useSchematicStore } from '../../store/useSchematicStore'

export type WireShape = TLBaseShape<
  'wire',
  {
    points: { x: number, y: number }[]
    color: string
    startBinding?: { shapeId: string, pinId: string } | null
    endBinding?: { shapeId: string, pinId: string } | null
  }
>

export class WireShapeUtil extends ShapeUtil<WireShape> {
  static override type = 'wire' as const

  override getDefaultProps(): WireShape['props'] {
    return {
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      color: '#00aa00',
      startBinding: null,
      endBinding: null,
    }
  }

  override getGeometry(shape: WireShape) {
    const points = shape.props?.points || [{ x: 0, y: 0 }, { x: 0, y: 0 }];
    if (points.length < 2) return new Rectangle2d({ width: 1, height: 1, isFilled: false })
    
    const maxX = Math.max(...points.map(p => p.x))
    const maxY = Math.max(...points.map(p => p.y))
    const minX = Math.min(...points.map(p => p.x))
    const minY = Math.min(...points.map(p => p.y))
    
    return new Rectangle2d({
      width: Math.max(maxX - minX, 1),
      height: Math.max(maxY - minY, 1),
      isFilled: false,
    })
  }

  override component(shape: WireShape) {
    const points = shape.props?.points || [{ x: 0, y: 0 }, { x: 0, y: 0 }];
    const baseColor = shape.props?.color || '#00aa00';
    
    // — ERC Logic —
    const netlist = useSchematicStore((s) => s.netlist)
    const ercReport = useSchematicStore((s) => s.ercReport)
    
    let isError = false
    const { startBinding, endBinding } = shape.props
    
    // Check if either end of the wire is connected to a net with violations
    const checkNet = (binding: WireShape['props']['startBinding']) => {
      if (!binding) return false
      const pinRef = `${binding.shapeId}.pin-${binding.pinId.replace('pin-', '')}`
      const netId = netlist.getPinNet(pinRef)
      if (!netId) return false
      
      return ercReport?.violations.some(v => v.netId === netId && v.severity === 'error')
    }
    
    if (checkNet(startBinding) || checkNet(endBinding)) {
      isError = true
    }

    const color = isError ? '#ef4444' : baseColor

    if (points.length < 1) return null;

    const svgPoints = points
      .map(p => `${p.x},${p.y}`)
      .join(' ')

    const minX = Math.min(...points.map(p => p.x))
    const minY = Math.min(...points.map(p => p.y))
    const maxX = Math.max(...points.map(p => p.x))
    const maxY = Math.max(...points.map(p => p.y))

    const width = Math.max(maxX - minX, 1)
    const height = Math.max(maxY - minY, 1)

    return (
      <HTMLContainer className="pointer-events-none">
        <svg 
          style={{ 
            width: width + 20, // Padding for nodes
            height: height + 20, 
            overflow: 'visible',
          }}
        >
          <polyline
            points={svgPoints}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Visual Junction Nodes (Circles at each vertex) */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="2.5"
              fill={color}
              stroke="white"
              strokeWidth="1"
            />
          ))}
        </svg>
      </HTMLContainer>
    )
  }

  override canResize() {
    return false
  }

  override indicator(shape: WireShape) {
    const points = shape.props?.points || [{ x: 0, y: 0 }, { x: 0, y: 0 }];
    const svgPoints = points
      .map(p => `${p.x},${p.y}`)
      .join(' ')
      
    return (
      <polyline points={svgPoints} fill="none" strokeWidth="2" />
    )
  }
}
