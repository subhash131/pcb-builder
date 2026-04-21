import {
  HTMLContainer,
  Rectangle2d,
  ShapeUtil,
  TLBaseShape,
  TLHandle,
} from 'tldraw'
import { SymbolRegistry, SchematicSymbolDef } from '@workspace/core'
import { GenericSymbolRenderer } from './GenericSymbolRenderer'

// ── Shape type ────────────────────────────────────────────────────────────────

export type SymbolShape = TLBaseShape<
  'symbol',
  {
    symbolId: string
    designator: string
    value: string
    w: number // Kept for tldraw internal geometry if needed, but we drive from def
    h: number
  }
>

// ── Shape utility ─────────────────────────────────────────────────────────────

export class SymbolShapeUtil extends ShapeUtil<SymbolShape> {
  static override type = 'symbol' as const

  override getDefaultProps(): SymbolShape['props'] {
    return {
      symbolId: 'resistor',
      designator: 'R1',
      value: '10k',
      w: 100,
      h: 50,
    }
  }

  private getSymbolDef(shape: SymbolShape): SchematicSymbolDef {
    return SymbolRegistry.getInstance().get(shape.props.symbolId)
  }

  override getGeometry(shape: SymbolShape) {
    const def = this.getSymbolDef(shape)
    return new Rectangle2d({
      width: def.boundingBox.width,
      height: def.boundingBox.height,
      isFilled: true,
    })
  }

  /** Expose each pin as a tldraw handle so wires can snap to them. */
  override getHandles(shape: SymbolShape): TLHandle[] {
    const def = this.getSymbolDef(shape)
    const { x: bx, y: by } = def.boundingBox

    return def.pins.map((pin, i) => ({
      id: `pin-${pin.number}`,
      type: 'vertex',
      canBind: true,
      index: `a${i}` as any,
      x: pin.connectionPoint.x - bx,
      y: pin.connectionPoint.y - by,
    }))
  }

  override canBind() {
    return true
  }

  // ── Renderer ───────────────────────────────────────────────────────────────

  override component(shape: SymbolShape) {
    const { symbolId, designator, value } = shape.props
    const def = this.getSymbolDef(shape)
    
    const { width: w, height: h } = def.boundingBox

    // Label positions driven from bounding box
    const labelY_above = -12
    const labelY_below = h + 16

    return (
      <HTMLContainer className="select-none">
        <div
          className="pointer-events-none"
          style={{ width: w, height: h, position: 'relative' }}
        >
          <svg
            viewBox={`0 0 ${w} ${h}`}
            width="100%"
            height="100%"
            style={{ position: 'absolute', overflow: 'visible' }}
          >
            <GenericSymbolRenderer def={def} />
          </svg>

          {/* Designator label — above the shape */}
          <div
            style={{
              position: 'absolute',
              top: `${labelY_above}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              fontWeight: 'bold',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              color: '#cc0000', // KiCad-ish red
            }}
          >
            {designator}
          </div>

          {/* Value label — below the shape */}
          <div
            style={{
              position: 'absolute',
              top: `${labelY_below}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '10px',
              color: '#666',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {value}
          </div>

          {/* Pin hit-targets — mapped to correct relative positions */}
          {def.pins.map((pin) => {
            const pos = {
              x: pin.connectionPoint.x - def.boundingBox.x,
              y: pin.connectionPoint.y - def.boundingBox.y,
            }
            return (
              <div
                key={pin.number}
                className="pointer-events-auto cursor-crosshair"
                style={{
                  position: 'absolute',
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
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
            )
          })}
        </div>
      </HTMLContainer>
    )
  }

  override indicator(shape: SymbolShape) {
    const def = this.getSymbolDef(shape)
    return <rect width={def.boundingBox.width} height={def.boundingBox.height} />
  }
}
