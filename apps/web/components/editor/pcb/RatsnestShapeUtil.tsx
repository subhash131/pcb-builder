import { 
  ShapeUtil, 
  TLBaseShape,
  Rectangle2d,
  SVGContainer
} from 'tldraw'
import { mmToPx } from '@workspace/core'

export type RatsnestShape = TLBaseShape<
  'ratsnest',
  {
    lines: Array<{
      x1: number
      y1: number
      x2: number
      y2: number
      netId: string
    }>
  }
>

export class RatsnestShapeUtil extends ShapeUtil<RatsnestShape> {
  static override type = 'ratsnest' as const

  override getDefaultProps(): RatsnestShape['props'] {
    return {
      lines: [],
    }
  }

  override getGeometry(shape: RatsnestShape) {
    // Ratsnest doesn't have a defined box, it spans the connections
    return new Rectangle2d({
      width: 1,
      height: 1,
      isFilled: false,
    })
  }

  override component(shape: RatsnestShape) {
    const { lines } = shape.props

    return (
      <SVGContainer>
        {lines.map((line, i) => (
          <line
            key={i}
            x1={mmToPx(line.x1)}
            y1={mmToPx(line.y1)}
            x2={mmToPx(line.x2)}
            y2={mmToPx(line.y2)}
            stroke="white"
            strokeWidth="2"
            strokeDasharray="6 3"
            opacity="0.7"
            pointerEvents="none"
          />
        ))}
      </SVGContainer>
    )
  }

  override canResize() {
    return false
  }

  override indicator(shape: RatsnestShape) {
    return null
  }
}
