import { 
  HTMLContainer, 
  Rectangle2d,
  ShapeUtil, 
  TLBaseShape,
  TLHandle,
} from 'tldraw'
import { SYMBOL_DEFS } from '@workspace/core'

export type SymbolShape = TLBaseShape<
  'symbol',
  {
    w: number
    h: number
    label: string
    designator: string
    symbolType: 'resistor' | 'capacitor' | 'ic' | 'led'
    pins: Array<{ id: string; x: number; y: number; label: string }>
  }
>

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

  override getHandles(shape: SymbolShape): TLHandle[] {
    return shape.props.pins.map((pin, i) => ({
      id: pin.id,
      type: 'vertex',
      canBind: true,
      index: `a${i}` as any, // tldraw handles expect fractional indices (generic strings starting with 'a')
      x: pin.x * shape.props.w,
      y: pin.y * shape.props.h,
    }))
  }

  override canBind() {
    return true
  }


  override component(shape: SymbolShape) {
    const { w, h, symbolType, designator, label, pins } = shape.props
    // Unique marker ID per shape to avoid SVG namespace conflicts
    const markerId = `arrow-${shape.id}`

    const renderSymbol = () => {
      switch (symbolType) {
        case 'resistor':
          // IEC Resistor: Simple rectangle between the pin stubs
          return <rect x="20%" y="30%" width="60%" height="40%" fill="none" stroke="black" strokeWidth="2" />
        case 'capacitor':
          // IEC Capacitor: Two parallel vertical bars
          return (
            <g stroke="black" strokeWidth="2">
              <line x1="45%" y1="20%" x2="45%" y2="80%" />
              <line x1="55%" y1="20%" x2="55%" y2="80%" />
            </g>
          )
        case 'led': {
          // LED rendered in a normalised 100×100 viewBox so coords are always correct
          // Anode (left) pin stub  : 0,50 → 30,50
          // Diode triangle        : 30,20 → 30,80 → 65,50 (points right)
          // Cathode bar           : 65,20 → 65,80
          // Cathode (right) stub  : 65,50 → 100,50
          // Light arrows          : two diagonal lines above the body
          return (
            <svg
              viewBox="0 0 100 100"
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
              overflow="visible"
            >
              <defs>
                <marker
                  id={markerId}
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="4"
                  markerHeight="4"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
                </marker>
              </defs>
              <g stroke="black" strokeWidth="2.5" fill="none">
                {/* Anode (left) pin stub */}
                <line x1="0" y1="50" x2="30" y2="50" />
                {/* Diode triangle — points right (conventional current direction) */}
                <polygon points="30,20 30,80 65,50" fill="black" stroke="black" strokeWidth="1.5" />
                {/* Cathode bar */}
                <line x1="65" y1="20" x2="65" y2="80" />
                {/* Cathode (right) pin stub */}
                <line x1="65" y1="50" x2="100" y2="50" />
                {/* Light arrows (emission) — diagonal up-right from the body */}
                <line x1="52" y1="18" x2="62" y2="5" markerEnd={`url(#${markerId})`} />
                <line x1="40" y1="14" x2="52" y2="1" markerEnd={`url(#${markerId})`} />
              </g>
            </svg>
          )
        }
        default:
          return <rect x="10%" y="10%" width="80%" height="80%" fill="none" stroke="black" strokeWidth="2" />
      }
    }

    // For non-LED types, render shared pin stubs + defs once
    const renderPinStubs = () => {
      if (symbolType === 'led') return null // LED manages its own stubs inside its viewBox
      return (
        <>
          <defs>
            <marker
              id={markerId}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
            </marker>
          </defs>
          {/* Left pin stub */}
          <line x1="0" y1="50%" x2="20%" y2="50%" stroke="black" strokeWidth="2" />
          {/* Right pin stub */}
          <line x1="80%" y1="50%" x2="100%" y2="50%" stroke="black" strokeWidth="2" />
        </>
      )
    }

    return (
      <HTMLContainer className="select-none">
        <div
          className="pointer-events-none"
          style={{
            width: w,
            height: h,
            backgroundColor: 'transparent',
            position: 'relative',
          }}
        >
          {/* Main Symbol SVG */}
          <svg width="100%" height="100%" style={{ position: 'absolute', overflow: 'visible' }}>
            {renderPinStubs()}
            {renderSymbol()}
          </svg>

          <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontWeight: 'bold', fontSize: '10px', whiteSpace: 'nowrap' }}>{designator}</div>
          <div style={{ position: 'absolute', bottom: '-15px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: '#666', whiteSpace: 'nowrap' }}>{label}</div>

          {/* Render Pins (hit targets) */}
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
