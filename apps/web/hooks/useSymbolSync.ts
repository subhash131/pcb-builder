import { useEffect, useRef } from 'react'
import { Editor, TLShapeId, TLShape } from 'tldraw'
import { SymbolShape } from '../components/editor/SymbolShape'
import { SymbolRegistry } from '@workspace/core'
import { useSchematicStore } from '../store/useSchematicStore'
import { useBoardStore } from '../store/useBoardStore'
import { Component } from '@workspace/core'

/**
 * useSymbolSync
 * 
 * Automatically synchronizes symbols on the tldraw canvas with the
 * background search stores (SchematicStore for Netlist/ERC and BoardStore for PCB).
 * 
 * This makes the system "Self-Healing": items added by the AI, copy-pasted,
 * or loaded from the database are automatically registered.
 */
export function useSymbolSync(editor: Editor) {
  const addComponentSchematic = useSchematicStore((s) => s.addComponent)
  const addComponentPCB = useBoardStore((s) => s.addComponent)
  const registeredIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    const registry = SymbolRegistry.getInstance()
    // Map of shapeId -> last synced designator to detect changes
    const syncedState = new Map<string, { designator: string, symbolId: string }>()

    const syncSymbols = () => {
      const symbols = editor.getCurrentPageShapes().filter(s => s.type === 'symbol')
      
      symbols.forEach((shape: TLShape) => {
        const symbol = shape as SymbolShape
        const { symbolId, designator, value } = symbol.props
        
        const lastSynced = syncedState.get(shape.id)
        if (lastSynced && lastSynced.designator === designator && lastSynced.symbolId === symbolId) {
          return
        }

        const def = registry.get(symbolId)
        if (!def) return

        // 1. Register in Schematic Store (Netlist/ERC)
        addComponentSchematic(
          designator,
          symbolId,
          def.properties.footprint,
          def.pins.map(p => ({ number: p.number, name: p.name, type: p.type }))
        )

        // 2. Register in Board Store (PCB)
        const component = new Component(
          shape.id,
          designator,
          value,
          def.properties.footprint
        )
        def.pins.forEach((p) =>
          component.addPin({ 
            id: `pin-${p.number}`, 
            name: p.name, 
            number: p.number, 
            type: p.type
          })
        )
        addComponentPCB(component)

        syncedState.set(shape.id, { designator, symbolId })
      })
    }

    // Initial sync
    syncSymbols()

    // Listen for additions and updates (e.g. designator changes)
    const cleanup = editor.store.listen(({ changes }) => {
      const hasShapeChanges = 
        Object.keys(changes.added).some(id => id.startsWith('shape')) ||
        Object.values(changes.updated).some(([, next]) => next.typeName === 'shape' && (next as any).type === 'symbol')

      if (hasShapeChanges) {
        syncSymbols()
      }
    }, { scope: 'document' })

    return () => cleanup()
  }, [editor, addComponentSchematic, addComponentPCB])
}
