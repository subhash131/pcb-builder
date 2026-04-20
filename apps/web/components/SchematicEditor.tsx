'use client'

import { Tldraw, useEditor, createShapeId, TLShape, useValue } from 'tldraw'
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
  const [wiringSession, setWiringSession] = useState<{ activeWireId: any, points: { x: number, y: number }[] } | null>(null)
  const [pendingStartPin, setPendingStartPin] = useState<{ x: number, y: number, pinId: string, startPoint: {x: number, y: number} } | null>(null)

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

  // Proximity & Wiring Interaction
  useEffect(() => {
    const handlePointerMove = () => {
      const { x, y } = editor.inputs.currentPagePoint
      
      // Update Proximity
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
      
      // Handle Drag Start for Wiring
      if (pendingStartPin && !wiringSession) {
        const dist = Math.sqrt((x - pendingStartPin.startPoint.x)**2 + (y - pendingStartPin.startPoint.y)**2)
        if (dist > 5) { // 5px threshold for drag
          handleStartWire(pendingStartPin)
          setPendingStartPin(null)
        }
      }

      // Update Active Wire
      if (wiringSession) {
        const lastFixed = wiringSession.points[wiringSession.points.length - 1]
        if(!lastFixed) return;
        let constrainedX = x
        let constrainedY = y

        const dx = Math.abs(x - lastFixed.x)
        const dy = Math.abs(y - lastFixed.y)

        if (wiringSession.points.length === 1) {
          if (dx > dy) constrainedY = lastFixed.y
          else constrainedX = lastFixed.x
        } else {
          const prevPoint = wiringSession.points[wiringSession.points.length - 2]
          const isPrevHorizontal = prevPoint && prevPoint.y === lastFixed.y
          if (isPrevHorizontal) constrainedX = lastFixed.x
          else constrainedY = lastFixed.y
        }

        const absolutePoints = [...wiringSession.points, { x: constrainedX, y: constrainedY }]
        
        // Normalize for tldraw: shape x,y should be top-left of points
        const minX = Math.min(...absolutePoints.map(p => p.x))
        const minY = Math.min(...absolutePoints.map(p => p.y))
        const relativePoints = absolutePoints.map(p => ({ x: p.x - minX, y: p.y - minY }))

        editor.updateShape({
          id: wiringSession.activeWireId,
          type: 'wire',
          x: minX,
          y: minY,
          props: { points: relativePoints }
        })
      }
    }

    const handlePointerDown = () => {
      if (wiringSession) {
        if (nearestPin) {
          // Finalize Wire
          const absolutePoints = [...wiringSession.points, { x: nearestPin.x, y: nearestPin.y }]
          const minX = Math.min(...absolutePoints.map(p => p.x))
          const minY = Math.min(...absolutePoints.map(p => p.y))
          const relativePoints = absolutePoints.map(p => ({ x: p.x - minX, y: p.y - minY }))

          editor.updateShape({
            id: wiringSession.activeWireId,
            type: 'wire',
            x: minX,
            y: minY,
            props: { points: relativePoints }
          })
          setWiringSession(null)
        } else {
          // Add Bend
          const { x, y } = editor.inputs.currentPagePoint
          const lastFixed = wiringSession.points[wiringSession.points.length - 1]
          if(!lastFixed) return;
          let constrainedX = x
          let constrainedY = y
          
          const dx = Math.abs(x - lastFixed.x)
          const dy = Math.abs(y - lastFixed.y)
          
          if (wiringSession.points.length === 1) {
            if (dx > dy) constrainedY = lastFixed.y
            else constrainedX = lastFixed.x
          } else {
            const prevPoint = wiringSession.points[wiringSession.points.length - 2]
            if (prevPoint && prevPoint.y === lastFixed.y) constrainedX = lastFixed.x
            else constrainedY = lastFixed.y
          }

          setWiringSession({
            ...wiringSession,
            points: [...wiringSession.points, { x: constrainedX, y: constrainedY }]
          })
        }
      } else if (nearestPin) {
        // Prepare for click-and-drag
        const { x, y } = editor.inputs.currentPagePoint
        setPendingStartPin({ ...nearestPin, startPoint: { x, y } })
      }
    }

    const handlePointerUp = () => {
      setPendingStartPin(null)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && wiringSession) {
        editor.deleteShape(wiringSession.activeWireId)
        setWiringSession(null)
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [editor, wiringSession, nearestPin, pendingStartPin])

  const handleStartWire = (pin: { x: number, y: number }) => {
    if (!pin) return
    
    const id = createShapeId()
    const startPoint = { x: pin.x, y: pin.y }
    
    editor.createShape({
      id,
      type: 'wire',
      x: startPoint.x,
      y: startPoint.y,
      props: {
        points: [{ x: 0, y: 0 }],
        color: '#22c55e',
      }
    })

    setWiringSession({
      activeWireId: id,
      points: [startPoint]
    })
    
    editor.select(id)
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
          onPointerDown={(e) => {
            e.stopPropagation()
            const { x, y } = editor.inputs.currentPagePoint
            setPendingStartPin({ ...nearestPin, startPoint: { x, y } })
          }}
          className="absolute z-2000 cursor-crosshair pointer-events-auto group"
          style={{ 
            left: editor.pageToScreen(nearestPin).x, 
            top: editor.pageToScreen(nearestPin).y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* We force a re-render tracking the camera */}
          <CameraTracker editor={editor} />
          <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-400/30 animate-pulse group-hover:scale-125 transition-transform" />
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
        <div className="h-px bg-slate-200 my-1" />
        <button 
          onClick={() => {
            // No alert needed, the UI should be self-explanatory
          }}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition text-left"
        >
          + Wire
        </button>
      </div>
    </>
  )
}

function CameraTracker({ editor }: { editor: any }) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useValue('camera', () => editor.camera, [editor])
  return null
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
