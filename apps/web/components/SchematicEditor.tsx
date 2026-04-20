import { Tldraw, useEditor, createShapeId, TLShape, useValue } from 'tldraw'
import 'tldraw/tldraw.css'
import { SymbolShapeUtil } from './editor/SymbolShape'
import { WireShapeUtil } from './editor/WireShape'
import { useBoardStore } from '../store/useBoardStore'
import { Component } from '@workspace/core'
import { useEffect, useState, useRef } from 'react'

const shapeUtils = [SymbolShapeUtil, WireShapeUtil]

function EditorUI() {
  const editor = useEditor()
  const addComponent = useBoardStore((s) => s.addComponent)
  const connectPins = useBoardStore((s) => s.connectPins)
  const [nearestPin, setNearestPin] = useState<{ x: number, y: number, shapeId: string, pinId: string } | null>(null)
  const [wiringSession, setWiringSession] = useState<{ activeWireId: any, points: { x: number, y: number }[] } | null>(null)
  const [pendingStartPin, setPendingStartPin] = useState<{ x: number, y: number, pinId: string, startPoint: {x: number, y: number} } | null>(null)

  // Refs for synchronous access in pointer handlers
  const wiringRef = useRef(wiringSession)
  const nearestPinRef = useRef(nearestPin)
  const pendingRef = useRef(pendingStartPin)

  // Keep refs in sync with state
  useEffect(() => { wiringRef.current = wiringSession }, [wiringSession])
  useEffect(() => { nearestPinRef.current = nearestPin }, [nearestPin])
  useEffect(() => { pendingRef.current = pendingStartPin }, [pendingStartPin])

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
            const resolvePinId = (comp: any, b: any) => {
              const { x, y } = b.props.normalizedAnchor || { x: 0.5, y: 0.5 }
              let nearestId = comp.props.pins[0].id
              let minDist = Infinity
              comp.props.pins.forEach((p: any) => {
                const dist = Math.sqrt((x - p.x)**2 + (y - p.y)**2)
                if (dist < minDist) { minDist = dist; nearestId = p.id; }
              })
              return nearestId
            }
            const pinA = resolvePinId(compA, b1)
            const pinB = resolvePinId(compB, b2)
            connectPins(compA.id, pinA, compB.id, pinB, `NET_${Date.now()}`)
          }
        }
      }
    })
    return () => cleanup?.()
  }, [editor, connectPins])

  // Cancel wiring if user selects something else
  useEffect(() => {
    const cleanup = editor.sideEffects.registerAfterChangeHandler('instance_page_state', (prev, next) => {
      if (wiringRef.current && next.selectedShapeIds.length > 0) {
        if (!next.selectedShapeIds.includes(wiringRef.current.activeWireId)) {
          editor.deleteShape(wiringRef.current.activeWireId)
          setWiringSession(null)
          wiringRef.current = null
        }
      }
    })
    return () => cleanup()
  }, [editor])

  // Main Wiring & Proximity Interaction Effect
  useEffect(() => {
    const getConstrained = (x: number, y: number, points: { x: number, y: number }[]) => {
      const lastFixed = points[points.length - 1]
      if (!lastFixed) return { x, y }
      const dx = Math.abs(x - lastFixed.x)
      const dy = Math.abs(y - lastFixed.y)
      if (points.length === 1) return dx > dy ? { x, y: lastFixed.y } : { x: lastFixed.x, y }
      const prev = points[points.length - 2]
      const isPrevHorizontal = prev && prev.y === lastFixed.y
      return isPrevHorizontal ? { x: lastFixed.x, y } : { x, y: lastFixed.y }
    }

    const updateWireShape = (wireId: any, absolutePoints: { x: number, y: number }[]) => {
      const minX = Math.min(...absolutePoints.map(p => p.x))
      const minY = Math.min(...absolutePoints.map(p => p.y))
      const relativePoints = absolutePoints.map(p => ({ x: p.x - minX, y: p.y - minY }))
      editor.updateShape({
        id: wireId,
        type: 'wire',
        x: minX,
        y: minY,
        props: { points: relativePoints }
      })
    }

    const handlePointerMove = () => {
      const { x, y } = editor.inputs.currentPagePoint
      const session = wiringRef.current
      const pending = pendingRef.current

      // Update proximity hotspot
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
      nearestPinRef.current = nearest

      // Handle drag threshold to start wiring
      if (pending && !session) {
        const dist = Math.sqrt((x - pending.startPoint.x)**2 + (y - pending.startPoint.y)**2)
        if (dist > 5) {
          handleStartWire(pending)
          setPendingStartPin(null)
          pendingRef.current = null
        }
      }

      // Update live wire preview
      if (session) {
        const constrained = getConstrained(x, y, session.points)
        const absolutePoints = [...session.points, constrained]
        updateWireShape(session.activeWireId, absolutePoints)
      }
    }

    const handlePointerDown = (e: PointerEvent) => {
      const session = wiringRef.current
      const nearest = nearestPinRef.current
      if (session) {
        e.stopPropagation()
        const { x, y } = editor.inputs.currentPagePoint
        const constrained = getConstrained(x, y, session.points)
        if (nearest) {
          const absolutePoints = [...session.points, { x: nearest.x, y: nearest.y }]
          updateWireShape(session.activeWireId, absolutePoints)
          setWiringSession(null)
          wiringRef.current = null
        } else {
          const next = { ...session, points: [...session.points, constrained] }
          wiringRef.current = next
          setWiringSession(next)
        }
      } else if (nearest) {
        const { x, y } = editor.inputs.currentPagePoint
        const pending = { ...nearest, startPoint: { x, y } }
        pendingRef.current = pending
        setPendingStartPin(pending)
      }
    }

    const handlePointerUp = () => {
      setPendingStartPin(null)
      pendingRef.current = null
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const session = wiringRef.current
      if (e.key === 'Escape' && session) {
        editor.deleteShape(session.activeWireId)
        setWiringSession(null)
        wiringRef.current = null
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerdown', handlePointerDown, { capture: true })
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true })
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [editor])

  const handleStartWire = (pin: { x: number, y: number }) => {
    const id = createShapeId()
    const startPoint = { x: pin.x, y: pin.y }
    editor.createShape({
      id,
      type: 'wire',
      x: startPoint.x,
      y: startPoint.y,
      props: { points: [{ x: 0, y: 0 }], color: '#22c55e' }
    })
    const next = { activeWireId: id, points: [startPoint] }
    wiringRef.current = next
    setWiringSession(next)
    editor.selectNone()
  }

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

  return (
    <>
      {nearestPin && (
        <div 
          onPointerDown={(e) => {
            e.stopPropagation()
            const { x, y } = editor.inputs.currentPagePoint
            const currentNearest = nearestPinRef.current
            if (currentNearest) {
              const pending = { ...currentNearest, startPoint: { x, y } }
              setPendingStartPin(pending)
              pendingRef.current = pending
            }
          }}
          className="absolute z-2000 cursor-crosshair pointer-events-auto group"
          style={{ 
            left: editor.pageToScreen(nearestPin).x, 
            top: editor.pageToScreen(nearestPin).y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <CameraTracker editor={editor} />
          <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-400/30 animate-pulse group-hover:scale-125 transition-transform" />
        </div>
      )}

      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 p-2 bg-white/80 backdrop-blur rounded-lg shadow-lg border border-slate-200">
        <div className="text-xs font-bold text-slate-500 px-2 pb-1 uppercase tracking-wider">Library</div>
        <button onClick={() => handleAddComponent('resistor')} className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-black transition text-left">+ Resistor</button>
        <button onClick={() => handleAddComponent('capacitor')} className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-black transition text-left">+ Capacitor</button>
        <button onClick={() => handleAddComponent('led')} className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-black transition text-left">+ LED</button>
        <div className="h-px bg-slate-200 my-1" />
        <button className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition text-left">+ Wire</button>
      </div>
    </>
  )
}

function CameraTracker({ editor }: { editor: any }) {
  useValue('camera', () => editor.camera, [editor])
  return null
}

export default function SchematicEditor() {
  return (
    <div className="fixed inset-0">
      <Tldraw persistenceKey="pcb-builder-schematic" shapeUtils={shapeUtils} className="bg-white" inferDarkMode={false}>
        <EditorUI />
      </Tldraw>
    </div>
  )
}
