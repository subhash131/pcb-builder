import { Editor, createShapeId } from 'tldraw'
import { Component, SYMBOL_DEFS, SymbolType } from '@workspace/core'
import { useBoardStore } from '../store/useBoardStore'

export function useLibraryActions(editor: Editor) {
  const addComponent = useBoardStore((s) => s.addComponent)

  const handleAddComponent = (type: SymbolType) => {
    const def = SYMBOL_DEFS[type]
    const componentId = createShapeId()

    const component = new Component(
      componentId,
      `${def.defaultDesignatorPrefix}${Date.now() % 1000}`,
      def.defaultLabel,
      def.defaultFootprint
    )
    def.pins.forEach((p) =>
      component.addPin({ id: p.id, name: p.label, number: p.id, type: 'passive' })
    )
    addComponent(component)

    editor.createShape({
      id: componentId,
      type: 'symbol',
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
      props: {
        w: def.w,
        h: def.h,
        symbolType: type,
        designator: component.designator,
        label: component.value,
        pins: def.pins,
      },
    })
  }

  return {
    handleAddComponent,
  }
}
