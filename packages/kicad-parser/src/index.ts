import { parseKicadSexpr } from 'kicadts'
import { SchematicSymbolDef, PinDefinition, SymbolGeometry, PinType } from '@workspace/core'

const MM_TO_PX = 10

const PIN_TYPE_MAP: Record<string, PinType> = {
  'input':          PinType.INPUT,
  'output':         PinType.OUTPUT,
  'passive':        PinType.PASSIVE,
  'power_in':       PinType.POWER_IN,
  'power_out':      PinType.POWER_OUT,
  'open_collector': PinType.OC,
  'no_connect':     PinType.NC,
  'bidirectional':  PinType.INPUT,
  'tri_state':      PinType.OUTPUT,
  'unspecified':    PinType.PASSIVE,
}

export class KiCadSymbolParser {
  /**
   * Parses a KiCad symbol library file content and returns an array of
   * domain-specific SchematicSymbolDef objects.
   */
  parse(fileContent: string): SchematicSymbolDef[] {
    const parsed = parseKicadSexpr(fileContent)
    const lib = parsed?.[0] as any
    if (!lib) return []
    return (lib._symbols ?? []).map((sym: any) => this.translateSymbol(sym))
  }

  private translateSymbol(sym: any): SchematicSymbolDef {
    const subUnits = sym.subSymbols ?? []
    const allUnits = [sym, ...subUnits]

    const pins: PinDefinition[] = []
    const geometry: SymbolGeometry = {
      rectangles: [],
      polylines: [],
      circles: [],
      arcs: [],
    }

    allUnits.forEach((unit: any) => {
      if (unit.pins) {
        pins.push(...this.translatePins(unit))
      }
      const g = this.translateGeometry(unit)
      geometry.rectangles.push(...g.rectangles)
      geometry.polylines.push(...g.polylines)
      geometry.circles.push(...g.circles)
      geometry.arcs.push(...g.arcs)
    })

    const bbox = this.calcBoundingBox(geometry, pins)

    return {
      id:         sym._inlineLibId,
      pins,
      geometry,
      properties: this.translateProperties(sym),
      boundingBox: bbox,
    }
  }

  private translatePins(unit: any): PinDefinition[] {
    return (unit?.pins ?? []).map((pin: any): PinDefinition => {
      const atX    = (pin._sxAt?.x ?? 0) * MM_TO_PX
      const atY    = (pin._sxAt?.y ?? 0) * MM_TO_PX
      const len    = (pin._sxLength?.value ?? 0) * MM_TO_PX
      const angle  = pin._sxAt?.angle ?? 0
      const rad    = (angle * Math.PI) / 180

      return {
        number:           pin._sxNumber?.value,
        name:             pin._sxName?.value,
        type:             PIN_TYPE_MAP[pin.pinElectricalType] ?? PinType.PASSIVE,
        connectionPoint:  { x: atX, y: atY },
        bodyEdge:         { 
          x: atX + Math.cos(rad) * len,
          y: atY + Math.sin(rad) * len 
        },
        angle,
      }
    })
  }

  private translateGeometry(unit: any): SymbolGeometry {
    return {
      rectangles: (unit?.rectangles ?? []).map((r: any) => ({
        start: { x: (r._sxStart?.x ?? 0) * MM_TO_PX, y: (r._sxStart?.y ?? 0) * MM_TO_PX },
        end:   { x: (r._sxEnd?.x   ?? 0) * MM_TO_PX, y: (r._sxEnd?.y   ?? 0) * MM_TO_PX },
      })),
      polylines: (unit?.polylines ?? []).map((p: any) => ({
        points: (p._sxPts?.points ?? []).map((pt: any) => ({
          x: pt.x * MM_TO_PX,
          y: pt.y * MM_TO_PX,
        })),
      })),
      circles: (unit?.circles ?? []).map((c: any) => ({
        center: { x: (c._sxCenter?.x ?? 0) * MM_TO_PX, y: (c._sxCenter?.y ?? 0) * MM_TO_PX },
        radius: (c._sxRadius?.value ?? 0) * MM_TO_PX,
      })),
      arcs: (unit?.arcs ?? []).map((a: any) => ({
        start: { x: (a._sxStart?.x ?? 0) * MM_TO_PX, y: (a._sxStart?.y ?? 0) * MM_TO_PX },
        mid:   { x: (a._sxMid?.x   ?? 0) * MM_TO_PX, y: (a._sxMid?.y   ?? 0) * MM_TO_PX },
        end:   { x: (a._sxEnd?.x   ?? 0) * MM_TO_PX, y: (a._sxEnd?.y   ?? 0) * MM_TO_PX },
      })),
    }
  }

  private translateProperties(sym: any): SchematicSymbolDef['properties'] {
    const raw: Record<string, string> = {}
    ;(sym.properties ?? []).forEach((p: any) => { 
      if (p.key && p.value) raw[p.key] = p.value 
    })
    return {
      reference: raw['Reference'] ?? '',
      value:     raw['Value']     ?? '',
      footprint: raw['Footprint'] ?? '',
      datasheet: raw['Datasheet'] ?? '',
      ...raw,
    }
  }

  private calcBoundingBox(geometry: SymbolGeometry, pins: PinDefinition[]) {
    const xs: number[] = []
    const ys: number[] = []

    geometry.rectangles.forEach(r => {
      xs.push(r.start.x, r.end.x)
      ys.push(r.start.y, r.end.y)
    })
    geometry.polylines.forEach(p => 
      p.points.forEach(pt => { xs.push(pt.x); ys.push(pt.y) })
    )
    geometry.circles.forEach(c => {
      xs.push(c.center.x - c.radius, c.center.x + c.radius)
      ys.push(c.center.y - c.radius, c.center.y + c.radius)
    })
    geometry.arcs.forEach(a => {
      xs.push(a.start.x, a.mid.x, a.end.x)
      ys.push(a.start.y, a.mid.y, a.end.y)
    })
    pins.forEach(p => {
      xs.push(p.connectionPoint.x)
      ys.push(p.connectionPoint.y)
      xs.push(p.bodyEdge.x)
      ys.push(p.bodyEdge.y)
    })

    if (xs.length === 0) return { x: 0, y: 0, width: 0, height: 0 }

    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }
}
