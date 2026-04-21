import { ShapeUtil, SVGContainer, TLBaseShape, Rectangle2d } from 'tldraw'
import { mmToPx, FOOTPRINT_DEFS, PCB_FOOTPRINT_SCALE } from '@workspace/core'

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
      width: mmToPx(def.w) * PCB_FOOTPRINT_SCALE,
      height: mmToPx(def.h) * PCB_FOOTPRINT_SCALE,
      isFilled: true,
    })
  }

  override component(shape: FootprintShape) {
    const { componentRef, footprintId, layer, netIds } = shape.props
    const def = FOOTPRINT_DEFS[footprintId] || FOOTPRINT_DEFS['R0603']!
    const isTop = layer === 'F.Cu'
    
    // Physical dimensions scaled for view
    const W = mmToPx(def.w) * PCB_FOOTPRINT_SCALE
    const H = mmToPx(def.h) * PCB_FOOTPRINT_SCALE

    // Colors
    const padColor = '#c8a020'          // copper gold
    const padStroke = '#8a6a00'
    const silkColor = isTop ? '#ffffff' : '#ffff00'
    const courtyardColor = isTop ? '#ffaa00' : '#00aaff'
    const connectedColor = '#22cc44'    // green when net assigned

    // Center offset (scaled)
    const cx = W / 2
    const cy = H / 2

    const toX = (mm: number) => cx + mmToPx(mm) * PCB_FOOTPRINT_SCALE
    const toY = (mm: number) => cy + mmToPx(mm) * PCB_FOOTPRINT_SCALE
    
    // Visual weight adjustments
    const strokeScale = Math.sqrt(PCB_FOOTPRINT_SCALE)

    return (
      <SVGContainer>
        {/* Courtyard — dashed keepout boundary */}
        <rect
          x={toX(def.courtyard.x)}
          y={toY(def.courtyard.y)}
          width={mmToPx(def.courtyard.w) * PCB_FOOTPRINT_SCALE}
          height={mmToPx(def.courtyard.h) * PCB_FOOTPRINT_SCALE}
          fill="none"
          stroke={courtyardColor}
          strokeWidth={1 * strokeScale}
          strokeDasharray={`${3 * strokeScale} ${2 * strokeScale}`}
          opacity={0.6}
        />

        {/* Silkscreen lines */}
        {def.silkscreen.map((line, i) => (
          <line
            key={i}
            x1={toX(line.x1)} y1={toY(line.y1)}
            x2={toX(line.x2)} y2={toY(line.y2)}
            stroke={silkColor}
            strokeWidth={1.5 * strokeScale}
            opacity={0.8}
          />

        {/* Pads */}
        {def.pads.map(pad => {
          const hasNet = !!netIds[pad.number]
          const pw = mmToPx(pad.width) * PCB_FOOTPRINT_SCALE
          const ph = mmToPx(pad.height) * PCB_FOOTPRINT_SCALE
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
                strokeWidth={1.5 * strokeScale}
              />
              {/* pad number */}
              <text
                x={toX(pad.x)}
                y={toY(pad.y)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={mmToPx(0.5) * PCB_FOOTPRINT_SCALE}
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
          y={toY(def.courtyard.y) - 2 * PCB_FOOTPRINT_SCALE}
          textAnchor="middle"
          dominantBaseline="auto"
          fontSize={mmToPx(0.8) * PCB_FOOTPRINT_SCALE}
          fill={silkColor}
          fontFamily="monospace"
          fontWeight="bold"
          opacity={0.9}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {footprintId}
        </text>
      </SVGContainer>
    )
  }

  override indicator(shape: FootprintShape) {
    const def = FOOTPRINT_DEFS[shape.props.footprintId] || FOOTPRINT_DEFS['R0603']!
    return <rect width={mmToPx(def.w) * PCB_FOOTPRINT_SCALE} height={mmToPx(def.h) * PCB_FOOTPRINT_SCALE} />
  }
}
