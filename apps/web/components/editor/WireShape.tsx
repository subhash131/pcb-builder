import { 
  ShapeUtil, 
  TLBaseShape, 
  HTMLContainer,
  Rectangle2d,
} from 'tldraw'

export type WireShape = TLBaseShape<
  'wire',
  {
    points: { x: number, y: number }[]
    color: string
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
      color: 'black',
    }
  }

  override getGeometry(shape: WireShape) {
    const { points } = shape.props
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
    const { points, color } = shape.props
    
    const svgPoints = points
      .map(p => `${p.x},${p.y}`)
      .join(' ')

    const minX = Math.min(...points.map(p => p.x))
    const minY = Math.min(...points.map(p => p.y))
    const maxX = Math.max(...points.map(p => p.x))
    const maxY = Math.max(...points.map(p => p.y))

    return (
      <HTMLContainer className="pointer-events-none">
        <svg 
          style={{ 
            width: Math.max(maxX - minX, 1), 
            height: Math.max(maxY - minY, 1), 
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
        </svg>
      </HTMLContainer>
    )
  }

  override indicator(shape: WireShape) {
    const { points } = shape.props
    const svgPoints = points
      .map(p => `${p.x},${p.y}`)
      .join(' ')
      
    return (
      <polyline points={svgPoints} fill="none" strokeWidth="2" />
    )
  }
}
