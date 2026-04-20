'use client'

import { Tldraw, useEditor, createShapeId, TLShape } from 'tldraw'
import 'tldraw/tldraw.css'
import { SymbolShapeUtil } from './editor/SymbolShape'
import { WireShapeUtil } from './editor/WireShape'
import { useBoardStore } from '../store/useBoardStore'
import { Component } from '@workspace/core'
import { useEffect, useState } from 'react'

const shapeUtils = [SymbolShapeUtil, WireShapeUtil]

function EditorUI() {
  const editor = useEditor()
  const addComponent = useBoardStore((s) => s.addComponent)
  const connectPins = useBoardStore((s) => s.connectPins)
  const [nearestPin, setNearestPin] = useState<{ x: number, y: number, shapeId: string, pinId: string } | null>(null)

  // Sync tldraw bindings with core Netlist
  useEffect(() => {
    // @ts-ignore
    const cleanup = editor.sideEffects?.registerAfterChangeHandler?.('binding', (prev: any, next: any, source: any) => {
      if (source !== 'user' || !next) return
      const binding = next
      const wire = editor.getShape(binding.fromId)
      const component = editor.getShape(binding.toId)
      
      if ((wire?.type === 'arrow' || wire?.type === 'wire') && component?.type === 'symbol') {
        const allBindings = editor.getBindingsFromShape(wire, 'arrow')
        if (allBindings.length === 2) {
          const [b1, b2] = allBindings
          if (!b1 || !b2) return

          const compA = editor.getShape(b1.toId) as TLShape & { props: any }
          const compB = editor.getShape(b2.toId) as TLShape & { props: any }
          
          if (compA && compB) {
            // Helper to find which pin ID is closest to the binding anchor
            const resolvePinId = (comp: any, binding: any) => {
              const { x, y } = binding.props.normalizedAnchor || { x: 0.5, y: 0.5 }
              let nearestPinId = comp.props.pins[0].id
              let minDist = Infinity
              
              comp.props.pins.forEach((pin: any) => {
                const dist = Math.sqrt((x - pin.x)**2 + (y - pin.y)**2)
                if (dist < minDist) {
                  minDist = dist
                  nearestPinId = pin.id
                }
              })
              return nearestPinId
            }

            const pinA = resolvePinId(compA, b1)
            const pinB = resolvePinId(compB, b2)

            console.log(`🔌 Net Created: ${compA.props.designator}:${pinA} <-> ${compB.props.designator}:${pinB}`)
            connectPins(compA.id, pinA, compB.id, pinB, `NET_${Date.now()}`)
          }
        }
      }
    })
    return () => cleanup?.()
  }, [editor, connectPins])

  // Proximity Detection for Auto-Wiring
  useEffect(() => {
    const cleanup = editor.sideEffects.registerBeforeChangeHandler('pointer', (next) => {
      const { x, y } = editor.inputs.currentPagePoint
      const shapes = editor.getCurrentPageShapes()
      let nearest: typeof nearestPin = null
      let minDistance = 25
      shapes.forEach(shape => {
        if (shape.type === 'symbol') {
          const props = shape.props as any
          props.pins.forEach((pin: any) => {
            const pinX = shape.x + (pin.x * props.w)
            const pinY = shape.y + (pin.y * props.h)
            const dist = Math.sqrt((x - pinX)**2 + (y - pinY)**2)
            if (dist < minDistance) {
              minDistance = dist
              nearest = { x: pinX, y: pinY, shapeId: shape.id, pinId: pin.id }
            }
          })
        }
      })
      setNearestPin(nearest)
      return next
    })
    return () => cleanup()
  }, [editor])

  const handleStartWire = () => {
    if (!nearestPin) return
    
    const id = createShapeId()
    editor.createShape({
      id,
      type: 'wire',
      x: nearestPin.x,
      y: nearestPin.y,
      props: {
        start: { x: 0, y: 0 },
        end: { x: 50, y: 50 }, // Initial direction
        color: '#22c55e', // Green for schematic wires
        isOrthogonal: true
      }
    })

    editor.select(id)
    // For now we use the arrow tool's dragging behavior if possible, 
    // or we just let use select and move the end point.
    // Since wire is custom, we'll need to handle dragging later.
    // editor.setCurrentTool('wire') // If we have a wire tool
  }

  const handleAddComponent = (type: 'resistor' | 'capacitor' | 'led') => {
    const componentId = createShapeId()
    const typeConfigs = {
      resistor: { designator: 'R', value: '10k', footprint: 'R0603' },
      capacitor: { designator: 'C', value: '100nF', footprint: 'C0603' },
      led: { designator: 'D', value: 'RED', footprint: 'LED0603' },
    }
    const config = typeConfigs[type]

    const component = new Component(componentId, `${config.designator}${Date.now() % 1000}`, config.value, config.footprint)
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

  return (
    <>
      {/* KiCad-style Proximity Indicator */}
      {nearestPin && (
        <div 
          onDoubleClick={handleStartWire}
          className="absolute z-[2000] cursor-crosshair pointer-events-auto group"
          style={{ 
            left: editor.pageToScreen(nearestPin).x, 
            top: editor.pageToScreen(nearestPin).y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-400/30 animate-pulse" />
        </div>
      )}

      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 p-2 bg-white/80 backdrop-blur rounded-lg shadow-lg border border-slate-200">
        <div className="text-xs font-bold text-slate-500 px-2 pb-1 uppercase tracking-wider">Library</div>
        <button 
          onClick={() => handleAddComponent('resistor')}
          className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-black transition text-left"
        >
          + Resistor
        </button>
        <button 
          onClick={() => handleAddComponent('capacitor')}
          className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-black transition text-left"
        >
          + Capacitor
        </button>
        <button 
          onClick={() => handleAddComponent('led')}
          className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-black transition text-left"
        >
          + LED
        </button>
      </div>
    </>
  )
}

export default function SchematicEditor() {
  return (
    <div className="fixed inset-0">
      <Tldraw 
        persistenceKey="pcb-builder-schematic"
        shapeUtils={shapeUtils}
        className="bg-white"
        inferDarkMode={false}
      >
        <EditorUI />
      </Tldraw>
    </div>
  )
}
