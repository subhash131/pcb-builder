import { 
  BaseBoxShapeUtil, 
  HTMLContainer, 
  TLBaseShape,
  Rectangle2d 
} from 'tldraw'
import { mmToPx } from '@workspace/core'

export type FootprintShape = TLBaseShape<
  'footprint',
  {
    componentRef: string
    footprintId: string
    layer: 'F.Cu' | 'B.Cu'
    w: number  // mm
    h: number // mm
    pads: Array<{
      number: string
      x: number    // mm relative to origin
      y: number
      shape: 'rect' | 'circle'
      width: number
      height: number
      netId: string | null
    }>
  }
>

export class FootprintShapeUtil extends BaseBoxShapeUtil<FootprintShape> {
  static override type = 'footprint' as const

  override getDefaultProps(): FootprintShape['props'] {
    return {
      componentRef: 'U1',
      footprintId: 'Generic',
      layer: 'F.Cu',
      w: 10,
      h: 10,
      pads: [],
    }
  }

  override getGeometry(shape: FootprintShape) {
    return new Rectangle2d({
      width: mmToPx(shape.props.w),
      height: mmToPx(shape.props.h),
      isFilled: true,
    })
  }

  override component(shape: FootprintShape) {
    const { componentRef, footprintId, layer, pads, w, h } = shape.props
    const isTop = layer === 'F.Cu'

    return (
      <HTMLContainer
        style={{
          width: mmToPx(w),
          height: mmToPx(h),
          backgroundColor: isTop ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 0, 255, 0.1)',
          border: `1px solid ${isTop ? '#cc0000' : '#0000cc'}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'all',
          position: 'relative',
        }}
      >
        {/* Pads */}
        {pads.map((pad, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: mmToPx(pad.x + w / 2) - mmToPx(pad.width / 2),
              top: mmToPx(pad.y + h / 2) - mmToPx(pad.height / 2),
              width: mmToPx(pad.width),
              height: mmToPx(pad.height),
              backgroundColor: '#cc9933', // Gold/Copper color
              borderRadius: pad.shape === 'circle' ? '50%' : '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              fontWeight: 'bold',
              color: 'white',
              border: '1px solid #996600',
            }}
          >
            {pad.number}
          </div>
        ))}

        {/* Ref Label */}
        <div style={{
          color: isTop ? '#cc0000' : '#0000cc',
          fontSize: '12px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          userSelect: 'none',
        }}>
          {componentRef}
        </div>
        <div style={{
          color: isTop ? '#cc0000' : '#0000cc',
          fontSize: '8px',
          fontFamily: 'monospace',
          opacity: 0.7,
          userSelect: 'none',
        }}>
          {footprintId.split(':')[1] || footprintId}
        </div>
      </HTMLContainer>
    )
  }

  override indicator(shape: FootprintShape) {
    return <rect width={mmToPx(shape.props.w)} height={mmToPx(shape.props.h)} />
  }
}
