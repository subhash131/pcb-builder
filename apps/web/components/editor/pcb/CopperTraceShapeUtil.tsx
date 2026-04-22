import { ShapeUtil, SVGContainer, TLBaseShape, Rectangle2d } from 'tldraw'
import { mmToPx } from '@workspace/core'
import { pointsToSVGPath, Vec } from '../../../lib/route45'

export type CopperTraceShape = TLBaseShape<
  'copper_trace',
  {
    /** Absolute page-pixel coordinates of the trace waypoints */
    points: Vec[]
    /** Copper layer */
    layer: 'F.Cu' | 'B.Cu'
    /** Trace width in mm */
    width: number
    /** True while being drawn — shows animated dashed preview */
    isPreview: boolean
    /** DB id to correlate with Convex — empty string while unsaved */
    traceDbId: string
  }
>

/** Corner bezier radius in pixels for the curved-corner rendering */
const CORNER_RADIUS_PX = 8

/** Glow filter IDs — one per layer so they can coexist */
const FILTER_F_CU = 'copper-trace-glow-fcu'
const FILTER_B_CU = 'copper-trace-glow-bcu'
const FILTER_PREVIEW = 'copper-trace-preview-glow'

function layerColor(layer: 'F.Cu' | 'B.Cu') {
  return layer === 'F.Cu' ? '#c8a020' : '#2060c8'
}

function layerGlowColor(layer: 'F.Cu' | 'B.Cu') {
  return layer === 'F.Cu' ? '#f0c040' : '#4090e8'
}

function filterId(layer: 'F.Cu' | 'B.Cu', isPreview: boolean) {
  if (isPreview) return FILTER_PREVIEW
  return layer === 'F.Cu' ? FILTER_F_CU : FILTER_B_CU
}

export class CopperTraceShapeUtil extends ShapeUtil<CopperTraceShape> {
  static override type = 'copper_trace' as const

  override getDefaultProps(): CopperTraceShape['props'] {
    return {
      points: [],
      layer: 'F.Cu',
      width: 0.25,
      isPreview: false,
      traceDbId: '',
    }
  }

  override getGeometry(shape: CopperTraceShape) {
    const { points } = shape.props
    if (points.length < 2) {
      return new Rectangle2d({ width: 1, height: 1, isFilled: false })
    }
    const xs = points.map(p => p.x)
    const ys = points.map(p => p.y)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)

    const pad = mmToPx(shape.props.width) * 2
    return new Rectangle2d({
      x: minX - shape.x - pad,
      y: minY - shape.y - pad,
      width: Math.max(1, maxX - minX) + pad * 2,
      height: Math.max(1, maxY - minY) + pad * 2,
      isFilled: false,
    })
  }

  override component(shape: CopperTraceShape) {
    const { points, layer, width, isPreview } = shape.props
    if (points.length < 2) return null

    const strokeWidth = Math.max(2, mmToPx(width) * 1.5)
    const color = layerColor(layer)
    const glowColor = layerGlowColor(layer)
    const fid = filterId(layer, isPreview)

    // Translate absolute points to shape-local coords
    const localPts: Vec[] = points.map(p => ({
      x: p.x - shape.x,
      y: p.y - shape.y,
    }))

    const pathD = pointsToSVGPath(localPts, CORNER_RADIUS_PX)

    const glowFilter = (
      <defs>
        <filter id={fid} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur
            stdDeviation={isPreview ? '4' : '2.5'}
            result="blur"
          />
          <feFlood floodColor={glowColor} floodOpacity={isPreview ? '0.8' : '0.6'} result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    )

    if (isPreview) {
      return (
        <SVGContainer>
          {glowFilter}
          {/* Shadow / base layer */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth * 1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.15}
          />
          {/* Animated dashed preview */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${strokeWidth * 3} ${strokeWidth * 2}`}
            filter={`url(#${fid})`}
            opacity={0.9}
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to={`${-(strokeWidth * 5)}`}
              dur="0.6s"
              repeatCount="indefinite"
            />
          </path>
          {/* Start cap dot */}
          <circle
            cx={localPts[0].x}
            cy={localPts[0].y}
            r={strokeWidth * 0.8}
            fill={color}
            opacity={0.9}
          />
        </SVGContainer>
      )
    }

    return (
      <SVGContainer>
        {glowFilter}
        {/* Outer glow halo */}
        <path
          d={pathD}
          fill="none"
          stroke={glowColor}
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.12}
        />
        {/* Main copper trace */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${fid})`}
        />
        {/* Metallic shine highlight */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={strokeWidth * 0.35}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Pad endpoint caps */}
        {[localPts[0], localPts[localPts.length - 1]].map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={strokeWidth * 0.9}
            fill={color}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1}
          />
        ))}
      </SVGContainer>
    )
  }

  override canResize() { return false }
  override canEdit() { return false }
  override canBind() { return false }
  override hideSelectionBoundsFg() { return true }

  override indicator(shape: CopperTraceShape) {
    if (shape.props.points.length < 2) return null
    const { points, width } = shape.props
    const xs = points.map(p => p.x - shape.x)
    const ys = points.map(p => p.y - shape.y)
    const pad = mmToPx(width)
    return (
      <rect
        x={Math.min(...xs) - pad}
        y={Math.min(...ys) - pad}
        width={Math.max(1, Math.max(...xs) - Math.min(...xs)) + pad * 2}
        height={Math.max(1, Math.max(...ys) - Math.min(...ys)) + pad * 2}
      />
    )
  }
}
