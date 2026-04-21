import { Editor, createShapeId } from 'tldraw'
import { Component, SYMBOL_DEFS, SymbolType } from '@workspace/core'
import { useBoardStore } from '../store/useBoardStore'
import { useSchematicStore } from '../store/useSchematicStore'

export function useLibraryActions(editor: Editor) {
  const addComponentPCB = useBoardStore((s) => s.addComponent)
  const addComponentSchematic = useSchematicStore((s) => s.addComponent)

  const handleAddComponent = (type: SymbolType) => {
    const def = SYMBOL_DEFS[type]
    if (!def) return

    const componentId = createShapeId()

    const component = new Component(
      componentId,
      `${def.properties.reference}${Date.now() % 1000}`,
      def.properties.value,
      def.properties.footprint
    )

    def.pins.forEach((p) =>
      component.addPin({ 
        id: `pin-${p.number}`, 
        name: p.name, 
        number: p.number, 
        type: p.type as any // Simple mapping for now
      })
    )
    addComponentPCB(component)
    addComponentSchematic(
      component.id,
      type, // symbolId
      component.footprint,
      component.pins.map(p => ({ number: p.number, name: p.name, type: p.type }))
    )

    editor.createShape({
      id: componentId,
      type: 'symbol',
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
      props: {
        symbolId: type,
        designator: component.designator,
        value: component.value,
      },
    })
  }

  return {
    handleAddComponent,
  }
}
