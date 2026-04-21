import { ShapeUtil, SVGContainer, TLBaseShape, Rectangle2d } from 'tldraw'
import { mmToPx, FOOTPRINT_DEFS } from '@workspace/core'

export type FootprintShape = TLBaseShape<
  'footprint',
  {
    componentRef: string
    footprintId: string
    layer: 'F.Cu' | 'B.Cu'
    netIds: Record<string, string | null> // padNumber -> netId/netName
  }
>

export class FootprintShapeUtil extends ShapeUtil<FootprintShape> {
  static override type = 'footprint' as const

  override getDefaultProps(): FootprintShape['props'] {
    return {
      componentRef: 'R1',
      footprintId: 'R0603',
      layer: 'F.Cu',
      netIds: { '1': null, '2': null },
    }
  }

  override getGeometry(shape: FootprintShape) {
    const def = FOOTPRINT_DEFS[shape.props.footprintId] || FOOTPRINT_DEFS['R0603']!
    return new Rectangle2d({
      width: mmToPx(def.w),
      height: mmToPx(def.h),
      isFilled: true,
    })
  }

  override component(shape: FootprintShape) {
    const { componentRef, footprintId, layer, netIds } = shape.props
    const def = FOOTPRINT_DEFS[footprintId] || FOOTPRINT_DEFS['R0603']!
    const isTop = layer === 'F.Cu'
    const W = mmToPx(def.w)
    const H = mmToPx(def.h)

    // Colors
    const padColor = '#c8a020'          // copper gold
    const padStroke = '#8a6a00'
    const silkColor = isTop ? '#ffffff' : '#ffff00'
    const courtyardColor = isTop ? '#ffaa00' : '#00aaff'
    const connectedColor = '#22cc44'    // green when net assigned

    // Center offset
    const cx = W / 2
    const cy = H / 2

    const toX = (mm: number) => cx + mmToPx(mm)
    const toY = (mm: number) => cy + mmToPx(mm)

    return (
      <SVGContainer>
        {/* Courtyard — dashed keepout boundary */}
        <rect
          x={toX(def.courtyard.x)}
          y={toY(def.courtyard.y)}
          width={mmToPx(def.courtyard.w)}
          height={mmToPx(def.courtyard.h)}
          fill="none"
          stroke={courtyardColor}
          strokeWidth={0.5}
          strokeDasharray="3 2"
          opacity={0.6}
        />

        {/* Silkscreen lines */}
        {def.silkscreen.map((line, i) => (
          <line
            key={i}
            x1={toX(line.x1)} y1={toY(line.y1)}
            x2={toX(line.x2)} y2={toY(line.y2)}
            stroke={silkColor}
            strokeWidth={1}
            opacity={0.8}
          />
        ))}

        {/* Pads */}
        {def.pads.map(pad => {
          const hasNet = !!netIds[pad.number]
          const pw = mmToPx(pad.width)
          const ph = mmToPx(pad.height)
          const px = toX(pad.x) - pw / 2
          const py = toY(pad.y) - ph / 2

          return (
            <g key={pad.number}>
              <rect
                x={px} y={py}
                width={pw} height={ph}
                rx={pad.shape === 'circle' ? pw / 2 : 1}
                fill={hasNet ? connectedColor : padColor}
                stroke={padStroke}
                strokeWidth={0.5}
              />
              {/* pad number */}
              <text
                x={toX(pad.x)}
                y={toY(pad.y)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={mmToPx(0.5)}
                fill="white"
                fontWeight="bold"
                fontFamily="monospace"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {pad.number}
              </text>
            </g>
          )
        })}

        {/* Ref designator — above courtyard */}
        <text
          x={cx}
          y={toY(def.courtyard.y) - 2}
          textAnchor="middle"
          dominantBaseline="auto"
          fontSize={mmToPx(0.8)}
          fill={silkColor}
          fontFamily="monospace"
          fontWeight="bold"
          opacity={0.9}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {componentRef}
        </text>
      </SVGContainer>
    )
  }

  override indicator(shape: FootprintShape) {
    const def = FOOTPRINT_DEFS[shape.props.footprintId] || FOOTPRINT_DEFS['R0603']!
    return <rect width={mmToPx(def.w)} height={mmToPx(def.h)} />
  }
}
