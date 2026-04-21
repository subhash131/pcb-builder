// Domain types — no KiCad knowledge here

export enum PinType {
  INPUT     = 'input',
  OUTPUT    = 'output',
  PASSIVE   = 'passive',
  POWER_IN  = 'power_in',
  POWER_OUT = 'power_out',
  OC        = 'open_collector',
  NC        = 'no_connect',
}

export interface Position {
  x: number   // always in px, never mm
  y: number
}

export interface PinDefinition {
  number: string
  name: string
  type: PinType
  connectionPoint: Position   // where wire snaps — outer tip, in px
  bodyEdge: Position          // inner end at symbol body, in px
  angle: number
}

export interface SymbolGeometry {
  rectangles: Array<{ start: Position; end: Position }>
  polylines:  Array<{ points: Position[] }>
  circles:    Array<{ center: Position; radius: number }>
  arcs:       Array<{ start: Position; mid: Position; end: Position }>
}

export interface SchematicSymbolDef {
  id: string                        // "R", "C", "LED", "ATmega328P"
  pins: PinDefinition[]
  geometry: SymbolGeometry
  properties: {
    reference: string               // "R", "U", "C"
    value: string
    footprint: string
    datasheet: string
    [key: string]: string
  }
  boundingBox: { 
    x: number; y: number
    width: number; height: number 
  }
}
