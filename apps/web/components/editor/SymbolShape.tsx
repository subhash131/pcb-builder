import { 
  HTMLContainer, 
  Rectangle2d,
  ShapeUtil, 
  TLBaseShape,
  TLHandle,
} from 'tldraw'

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
    return {
      w: 100,
      h: 50,
      label: '10k',
      designator: 'R1',
      symbolType: 'resistor',
      pins: [
        { id: '1', x: 0, y: 0.5, label: '1' },
        { id: '2', x: 1, y: 0.5, label: '2' },
      ],
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

    const renderSymbol = () => {
      switch (symbolType) {
        case 'resistor':
          // IEC Resistor: Simple rectangle
          return <rect x="20%" y="30%" width="60%" height="40%" fill="none" stroke="black" strokeWidth="2" />
        case 'capacitor':
          // IEC Capacitor: Two parallel lines
          return (
            <g stroke="black" strokeWidth="2">
              <line x1="45%" y1="20%" x2="45%" y2="80%" />
              <line x1="55%" y1="20%" x2="55%" y2="80%" />
            </g>
          )
        case 'led':
          // IEC LED: Diode triangle + bar + arrows
          return (
            <g stroke="black" strokeWidth="2" fill="none">
              <path d="M 35 15 L 35 35 L 55 25 Z" />
              <line x1="55" y1="15" x2="55" y2="35" />
              <line x1="50" y1="10" x2="60" y2="0" markerEnd="url(#arrow)" />
              <line x1="40" y1="10" x2="50" y2="0" markerEnd="url(#arrow)" />
            </g>
          )
        default:
          return <rect x="10%" y="10%" width="80%" height="80%" fill="none" stroke="black" strokeWidth="2" />
      }
    }

    return (
      <HTMLContainer className="select-none">
        <div 
          className="pointer-events-none"
          style={{ 
            width: w, 
            height: h, 
            backgroundColor: 'transparent',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          {/* Main Symbol SVG */}
          <svg width="100%" height="100%" style={{ position: 'absolute' }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
              </marker>
            </defs>
            {renderSymbol()}
            
            {/* Connecting lines from pins to body */}
            <line x1="0" y1="50%" x2="20%" y2="50%" stroke="black" strokeWidth="2" />
            <line x1="100%" y1="50%" x2="80%" y2="50%" stroke="black" strokeWidth="2" />
          </svg>

          <div style={{ position: 'absolute', top: '-20px', fontWeight: 'bold', fontSize: '10px' }}>{designator}</div>
          <div style={{ position: 'absolute', bottom: '-15px', fontSize: '10px', color: '#666' }}>{label}</div>
          
          {/* Render Pins (Hit targets) */}
          {pins.map((pin) => (
            <div
              key={pin.id}
              className="pointer-events-auto cursor-crosshair"
              style={{
                position: 'absolute',
                left: `${pin.x * 100}%`,
                top: `${pin.y * 100}% `,
                width: '8px',
                height: '8px',
                backgroundColor: 'black',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                border: '2px solid white',
                boxShadow: '0 0 0 1px black'
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
