import { SchematicSymbolDef, Position, PinType } from '@workspace/core'

interface GenericSymbolRendererProps {
  def: SchematicSymbolDef
}

export function GenericSymbolRenderer({ def }: GenericSymbolRendererProps) {
  const { geometry, pins, boundingBox } = def

  // Transform a point from KiCad space to Local Shape space (origin-relative)
  const toLocal = (p: Position) => ({
    x: p.x - boundingBox.x,
    y: p.y - boundingBox.y,
  })

  return (
    <g stroke="black" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Rectangles */}
      {geometry.rectangles.map((rect, i) => {
        const start = toLocal(rect.start)
        const end = toLocal(rect.end)
        const x = Math.min(start.x, end.x)
        const y = Math.min(start.y, end.y)
        const width = Math.abs(end.x - start.x)
        const height = Math.abs(end.y - start.y)
        return <rect key={`rect-${i}`} x={x} y={y} width={width} height={height} fill="white" />
      })}

      {/* Polylines */}
      {geometry.polylines.map((line, i) => {
        const points = line.points.map(toLocal).map((p) => `${p.x},${p.y}`).join(' ')
        return <polyline key={`poly-${i}`} points={points} />
      })}

      {/* Circles */}
      {geometry.circles.map((circle, i) => {
        const center = toLocal(circle.center)
        return <circle key={`circle-${i}`} cx={center.x} cy={center.y} r={circle.radius} />
      })}

      {/* Arcs */}
      {geometry.arcs.map((arc, i) => {
        const start = toLocal(arc.start)
        const mid = toLocal(arc.mid)
        const end = toLocal(arc.end)
        
        // Simple SVG arc doesn't match KiCad's 3-point arcs perfectly without math,
        // so we'll use a path or a simplified polyline for now if needed.
        // For standard 3-point arcs, we can use the 'A' command.
        // To be truly robust we'd calculate radius/center, but let's start with a path.
        const d = `M ${start.x} ${start.y} Q ${mid.x} ${mid.y} ${end.x} ${end.y}`
        return <path key={`arc-${i}`} d={d} />
      })}

      {/* Pin Labels (Names) */}
      {pins.map((pin) => {
        if (pin.name === '~' || pin.name === '') return null
        
        const pos = toLocal(pin.bodyEdge)
        // Simple heuristic: push label slightly away from connection point
        const textAlign = pin.angle === 0 ? 'start' : pin.angle === 180 ? 'end' : 'middle'
        const dx = pin.angle === 0 ? 5 : pin.angle === 180 ? -5 : 0
        const dy = pin.angle === 90 ? 5 : pin.angle === 270 ? -5 : 4

        return (
          <text
            key={`pin-label-${pin.number}`}
            x={pos.x + dx}
            y={pos.y + dy}
            fontSize="8"
            fill="black"
            stroke="none"
            textAnchor={textAlign}
            style={{ userSelect: 'none' }}
          >
            {pin.name}
          </text>
        )
      })}
    </g>
  )
}
