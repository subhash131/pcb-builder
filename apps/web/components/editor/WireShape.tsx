import { 
  ShapeUtil, 
  TLBaseShape, 
  HTMLContainer,
  Rectangle2d,
  Vec2d
} from 'tldraw'

export type WireShape = TLBaseShape<
  'wire',
  {
    start: { x: number, y: number }
    end: { x: number, y: number }
    color: string
    isOrthogonal: boolean
  }
>

export class WireShapeUtil extends ShapeUtil<WireShape> {
  static override type = 'wire' as const

  override getDefaultProps(): WireShape['props'] {
    return {
      start: { x: 0, y: 0 },
      end: { x: 100, y: 100 },
      color: 'black',
      isOrthogonal: true
    }
  }

  override getGeometry(shape: WireShape) {
    const { start, end } = shape.props
    return new Rectangle2d({
      width: Math.abs(end.x - start.x) || 1,
      height: Math.abs(end.y - start.y) || 1,
      isFilled: false,
    })
  }

  override component(shape: WireShape) {
    const { start, end, color, isOrthogonal } = shape.props
    
    // Simple orthogonal path calculation (L-bridge)
    const points = isOrthogonal 
      ? `0,0 ${end.x - start.x},0 ${end.x - start.x},${end.y - start.y}`
      : `0,0 ${end.x - start.x},${end.y - start.y}`

    return (
      <HTMLContainer className="pointer-events-none">
        <svg 
          style={{ 
            width: '100%', 
            height: '100%', 
            overflow: 'visible',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        >
          <polyline
            points={points}
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
    const { start, end, isOrthogonal } = shape.props
    const points = isOrthogonal 
      ? `0,0 ${end.x - start.x},0 ${end.x - start.x},${end.y - start.y}`
      : `0,0 ${end.x - start.x},${end.y - start.y}`
      
    return (
      <polyline points={points} fill="none" strokeWidth="2" />
    )
  }
}
