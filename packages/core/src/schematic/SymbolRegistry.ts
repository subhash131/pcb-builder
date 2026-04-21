import { SchematicSymbolDef } from './types'

export class SymbolRegistry {
  private static instance: SymbolRegistry
  private symbols = new Map<string, SchematicSymbolDef>()

  private constructor() {}

  static getInstance(): SymbolRegistry {
    if (!SymbolRegistry.instance) {
      SymbolRegistry.instance = new SymbolRegistry()
    }
    return SymbolRegistry.instance
  }

  register(def: SchematicSymbolDef): void {
    this.symbols.set(def.id, def)
  }

  get(id: string): SchematicSymbolDef {
    return this.symbols.get(id) ?? this.getFallback(id)
  }

  has(id: string): boolean {
    return this.symbols.has(id)
  }

  private getFallback(id: string): SchematicSymbolDef {
    // 40x40px box with no pins — renders something, never crashes
    return {
      id,
      pins: [],
      geometry: {
        rectangles: [{ start: { x: 0, y: 0 }, end: { x: 40, y: 40 } }],
        polylines: [],
        circles: [],
        arcs: [],
      },
      properties: {
        reference: '?',
        value: id,
        footprint: '',
        datasheet: '',
      },
      boundingBox: { x: 0, y: 0, width: 40, height: 40 },
    }
  }
}
