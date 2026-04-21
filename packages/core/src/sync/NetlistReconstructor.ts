import { Netlist } from '../schematic/Netlist'
import { SymbolRegistry } from '../schematic/SymbolRegistry'

/**
 * NetlistReconstructor
 * 
 * Logic to rebuild a logical Netlist instance from raw database records (Convex shapes).
 * This allows the PCB editor (or other tools) to have a full netlist without
 * requiring the Schematic Editor to be mounted in the same session.
 * 
 * Crucially, this uses DESIGNATORS (e.g. "R1") as the primary keys for components,
 * rather than tldraw UUIDs, providing a "soft link" between schematic and PCB.
 */
export class NetlistReconstructor {
  static reconstruct(shapes: any[]): Netlist {
    const netlist = new Netlist()
    const registry = SymbolRegistry.getInstance()

    // 1. First Pass: Register all Components and their Pins
    shapes.forEach(s => {
      // s here is expected to be a Convex 'shapes' record
      if (s.type === 'symbol') {
        const { designator, symbolId } = s.props
        if (!designator) return

        const def = registry.get(symbolId)
        
        // Use designator as the component 'ref'
        netlist.addComponent(designator, symbolId, def.properties.footprint || '')
        
        // Register all pins for this component
        def.pins.forEach(p => {
          netlist.addPin(designator, p.number, p.name, p.type)
        })
      }
    })

    // 2. Second Pass: Establish Connectivity via Wires
    // We look for 'wire' shapes which currently carry their own binding info in 'props'
    shapes.forEach(s => {
      if (s.type === 'wire') {
        const { startBinding, endBinding } = s.props
        
        if (startBinding && endBinding) {
          // Find the connected symbols by their tldrawId (as stored in the wire's binding props)
          const shapeA = shapes.find(sh => (sh.tldrawId || sh.id) === startBinding.shapeId)
          const shapeB = shapes.find(sh => (sh.tldrawId || sh.id) === endBinding.shapeId)

          if (shapeA?.type === 'symbol' && shapeB?.type === 'symbol') {
            const refA = shapeA.props.designator
            const refB = shapeB.props.designator
            const pinA = startBinding.pinId
            const pinB = endBinding.pinId

            if (refA && refB && pinA && pinB) {
              // Assign both pins to the same net ID (represented by the wire's ID)
              const netId = `NET_${s.tldrawId || s.id}`
              netlist.assignNet(`${refA}.${pinA}`, netId)
              netlist.assignNet(`${refB}.${pinB}`, netId)
            }
          }
        }
      }
    })

    return netlist
  }
}
