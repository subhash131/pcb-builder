import {
  HTMLContainer,
  Rectangle2d,
  ShapeUtil,
  TLBaseShape,
  TLHandle,
} from 'tldraw'
import { SYMBOL_DEFS, SymbolType } from '@workspace/core'
import { SYMBOL_RENDERERS } from './symbolRenderers'

// ── Shape type ────────────────────────────────────────────────────────────────

export type SymbolShape = TLBaseShape<
  'symbol',
  {
    w: number
    h: number
    label: string
    designator: string
    /** Uses the shared SymbolType from @workspace/core — single source of truth. */
    symbolType: SymbolType
    pins: Array<{ id: string; x: number; y: number; label: string }>
  }
>

// ── Shape utility ─────────────────────────────────────────────────────────────

export class SymbolShapeUtil extends ShapeUtil<SymbolShape> {
  static override type = 'symbol' as const

  override getDefaultProps(): SymbolShape['props'] {
    const def = SYMBOL_DEFS.resistor
    return {
      w: def.w,
      h: def.h,
      label: def.defaultLabel,
      designator: 'R1',
      symbolType: 'resistor',
      pins: def.pins,
    }
  }

  override getGeometry(shape: SymbolShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  /** Expose each pin as a tldraw handle so wires can snap to them. */
  override getHandles(shape: SymbolShape): TLHandle[] {
    return shape.props.pins.map((pin, i) => ({
      id: pin.id,
      type: 'vertex',
      canBind: true,
      // tldraw handles require fractional indices (generic strings starting with 'a')
      index: `a${i}` as any,
      x: pin.x * shape.props.w,
      y: pin.y * shape.props.h,
    }))
  }

  override canBind() {
    return true
  }

  // ── Renderer ───────────────────────────────────────────────────────────────

  override component(shape: SymbolShape) {
    const { w, h, symbolType, designator, label, pins } = shape.props

    // Look up the renderer — falls back gracefully if the type isn't registered yet.
    const renderFn = SYMBOL_RENDERERS[symbolType]

    return (
      <HTMLContainer className="select-none">
        <div
          className="pointer-events-none"
          style={{ width: w, height: h, position: 'relative' }}
        >
          {/*
           * All symbol renderers share a normalised 100×100 viewBox.
           * overflow="visible" lets pin stubs extend beyond the bounding box.
           */}
          <svg
            viewBox="0 0 100 100"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            style={{ position: 'absolute', overflow: 'visible' }}
          >
            {renderFn ? (
              renderFn(shape.id)
            ) : (
              // Generic fallback for unregistered types
              <g stroke="black" strokeWidth="2" fill="none">
                <rect x="10" y="10" width="80" height="80" />
                <text x="50" y="54" fontSize="12" textAnchor="middle" stroke="none" fill="black">
                  {symbolType}
                </text>
              </g>
            )}
          </svg>

          {/* Designator label — above the shape */}
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontWeight: 'bold',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {designator}
          </div>

          {/* Value label — below the shape */}
          <div
            style={{
              position: 'absolute',
              bottom: '-15px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '10px',
              color: '#666',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {label}
          </div>

          {/* Pin hit-targets — pointer-events-auto so wiring can pick them up */}
          {pins.map((pin) => (
            <div
              key={pin.id}
              className="pointer-events-auto cursor-crosshair"
              style={{
                position: 'absolute',
                left: `${pin.x * 100}%`,
                top: `${pin.y * 100}%`,
                width: '8px',
                height: '8px',
                backgroundColor: 'black',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                border: '2px solid white',
                boxShadow: '0 0 0 1px black',
              }}
            />
          ))}
        </div>
      </HTMLContainer>
    )
  }

  override indicator(shape: SymbolShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}
