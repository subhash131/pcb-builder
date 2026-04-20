import { Editor, createShapeId } from 'tldraw'
import { Component } from '@workspace/core'
import { useBoardStore } from '../store/useBoardStore'

export function useLibraryActions(editor: Editor) {
  const addComponent = useBoardStore((s) => s.addComponent)

  const handleAddComponent = (type: 'resistor' | 'capacitor' | 'led') => {
    const componentId = createShapeId()
    const configs = {
      resistor: { d: 'R', v: '10k', f: 'R0603' },
      capacitor: { d: 'C', v: '100nF', f: 'C0603' },
      led: { d: 'D', v: 'RED', f: 'LED0603' },
    }
    const c = configs[type]
    const component = new Component(componentId, `${c.d}${Date.now() % 1000}`, c.v, c.f)
    component.addPin({ id: '1', name: '1', number: '1', type: 'passive' })
    component.addPin({ id: '2', name: '2', number: '2', type: 'passive' })
    addComponent(component)
    editor.createShape({
      id: componentId,
      type: 'symbol',
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
      props: {
        symbolType: type,
        designator: component.designator,
        label: component.value,
        pins: component.pins.map((p, i) => ({ id: p.id, x: i, y: 0.5, label: p.name }))
      },
    })
  }

  return {
    handleAddComponent
  }
}
