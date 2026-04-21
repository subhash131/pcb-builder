import { useEffect, useRef } from 'react'
import { Editor } from 'tldraw'
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

    const syncSymbols = () => {
      const symbols = editor.getCurrentPageShapes().filter(s => s.type === 'symbol')
      
      symbols.forEach((shape: any) => {
        if (registeredIds.current.has(shape.id)) return

        const { symbolId, designator, value } = shape.props
        const def = registry.get(symbolId)
        if (!def) return

        // 1. Register in Schematic Store (Netlist/ERC)
        addComponentSchematic(
          shape.id,
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
        def.pins.forEach(p => component.addPin({
          id: `pin-${p.number}`,
          name: p.name,
          number: p.number,
          type: p.type
        }))
        addComponentPCB(component)

        registeredIds.current.add(shape.id)
      })
    }

    // Initial sync
    syncSymbols()

    // Listen for future additions
    const cleanup = editor.store.listen(({ changes }) => {
      if (Object.keys(changes.added).some(id => id.startsWith('shape'))) {
        syncSymbols()
      }
    }, { source: 'user', scope: 'document' })

    const cleanupRemote = editor.store.listen(({ changes }) => {
       if (Object.keys(changes.added).some(id => id.startsWith('shape'))) {
        syncSymbols()
      }
    }, { source: 'remote', scope: 'document' })

    return () => {
      cleanup()
      cleanupRemote()
    }
  }, [editor, addComponentSchematic, addComponentPCB])
}
