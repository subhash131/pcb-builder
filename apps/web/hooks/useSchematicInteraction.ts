import { useState, useRef, useEffect } from 'react'
import { Editor, createShapeId, TLShape, TLShapeId } from 'tldraw'
import { SymbolRegistry } from '@workspace/core'
import { WireShape } from '../components/editor/WireShape'
import { SymbolShape } from '../components/editor/SymbolShape'
import { routeWire } from '../lib/routeUtils'

type NearestPin = { x: number, y: number, shapeId: string, pinId: string } | null

// Configuration constants for interaction behavior
/** Distance in pixels at which a pin becomes "active" for proximity snapping */
const PROXIMITY_RADIUS = 15
/** Minimum pixels to drag before a wiring session is officially started (prevents accidental clicks) */
const WIRING_START_THRESHOLD = 5

export function useSchematicInteraction(editor: Editor) {
  const [nearestPin, setNearestPin] = useState<NearestPin>(null)
  const [wiringSession, setWiringSession] = useState<{ activeWireId: TLShapeId, points: { x: number, y: number }[] } | null>(null)
  const [pendingStartPin, setPendingStartPin] = useState<{ x: number, y: number, pinId: string, startPoint: {x: number, y: number}, shapeId: string } | null>(null)

  // Refs for synchronous access in pointer handlers
  const wiringRef = useRef(wiringSession)
  const nearestPinRef = useRef(nearestPin)
  const pendingRef = useRef(pendingStartPin)

  // Keep refs in sync with state
  useEffect(() => { wiringRef.current = wiringSession }, [wiringSession])
  useEffect(() => { nearestPinRef.current = nearestPin }, [nearestPin])
  useEffect(() => { pendingRef.current = pendingStartPin }, [pendingStartPin])
  
  const updateWireShape = (wireId: TLShapeId, absolutePoints: { x: number, y: number }[]) => {
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

  // Listen for symbol movements and update bound wires
  useEffect(() => {
    const registry = SymbolRegistry.getInstance()

    const cleanup = editor.sideEffects.registerAfterChangeHandler('shape', (prev: TLShape, next: TLShape) => {
      // 1. Handle Symbol Movement -> Update connected wires
      if (next.type === 'symbol') {
        const nextSymbol = next as SymbolShape
        const prevSymbol = prev as SymbolShape

        if (prevSymbol.x !== nextSymbol.x || prevSymbol.y !== nextSymbol.y) {
          const def = registry.get(nextSymbol.props.symbolId)
          if (!def) return

          const wires = editor.getCurrentPageShapes().filter((s): s is WireShape => s.type === 'wire')
          for (const wire of wires) {
            const { startBinding, endBinding } = wire.props
            if (startBinding?.shapeId === nextSymbol.id || endBinding?.shapeId === nextSymbol.id) {
              reRouteWire(wire)
            }
          }
        }
      }

      // 2. Handle New Wire / Binding Added -> Auto-route if needed
      if (next.type === 'wire') {
        const wire = next as WireShape
        const points = wire.props.points
        
        // If wire has both bindings but is just a single diagonal/naive segment, auto-route it!
        if (wire.props.startBinding && wire.props.endBinding && points.length <= 2) {
          const isDiagonal = points.length === 2 && points[0].x !== points[1].x && points[0].y !== points[1].y
          if (isDiagonal || points.length < 2) {
            reRouteWire(wire)
          }
        }
      }
    })

    function reRouteWire(wire: WireShape) {
      const { startBinding, endBinding } = wire.props
      if (!startBinding || !endBinding) return

      const startShape = editor.getShape(startBinding.shapeId as TLShapeId) as SymbolShape
      const endShape = editor.getShape(endBinding.shapeId as TLShapeId) as SymbolShape
      if (!startShape || !endShape) return

      const startDef = registry.get(startShape.props.symbolId)
      const endDef = registry.get(endShape.props.symbolId)
      if (!startDef || !endDef) return

      const startPin = startDef.pins.find(p => p.number === startBinding.pinId.replace('pin-', ''))
      const endPin = endDef.pins.find(p => p.number === endBinding.pinId.replace('pin-', ''))
      if (!startPin || !endPin) return

      const p1 = {
        x: startShape.x + (startPin.connectionPoint.x - startDef.boundingBox.x),
        y: startShape.y + (startPin.connectionPoint.y - startDef.boundingBox.y)
      }
      const p2 = {
        x: endShape.x + (endPin.connectionPoint.x - endDef.boundingBox.x),
        y: endShape.y + (endPin.connectionPoint.y - endDef.boundingBox.y)
      }

      const routedPoints = routeWire(p1, p2)
      updateWireShape(wire.id, routedPoints)
    }

    return () => cleanup()
  }, [editor])

  const handleStartWire = (pin: { x: number, y: number, shapeId?: string, pinId?: string }) => {
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
        startBinding: pin.shapeId ? { shapeId: pin.shapeId, pinId: pin.pinId } : null
      }
    })
    const next = { activeWireId: id, points: [startPoint] }
    wiringRef.current = next
    setWiringSession(next)
    editor.selectNone()
  }

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
    const getOrthogonalPoints = (x: number, y: number, points: { x: number, y: number }[]) => {
      const lastPoint = points[points.length - 1]
      if (!lastPoint) return [{ x, y }]
      const orthoPoints = routeWire(lastPoint, { x, y }).slice(1)
      return orthoPoints
    }


    const handlePointerMove = () => {
      const { x, y } = editor.inputs.currentPagePoint
      let session = wiringRef.current
      const pending = pendingRef.current

      // Update proximity hotspot
      const shapes = editor.getCurrentPageShapes()
      let nearest: NearestPin = null
      let minDistance = PROXIMITY_RADIUS

      const registry = SymbolRegistry.getInstance()

      for (const shape of shapes) {
        if (shape.type === 'symbol') {
          const symbol = shape as SymbolShape
          const def = registry.get(symbol.props.symbolId)
          if (!def) continue

          for (const pin of def.pins) {
            const pinX = shape.x + (pin.connectionPoint.x - def.boundingBox.x)
            const pinY = shape.y + (pin.connectionPoint.y - def.boundingBox.y)
            const dist = Math.sqrt((x - pinX)**2 + (y - pinY)**2)
            if (dist < minDistance) {
              minDistance = dist
              nearest = { x: pinX, y: pinY, shapeId: shape.id, pinId: `pin-${pin.number}` }
            }
          }
        }
      }
      setNearestPin(nearest)
      nearestPinRef.current = nearest

      // Handle drag threshold to start wiring
      if (pending && !session) {
        const dist = Math.sqrt((x - pending.startPoint.x)**2 + (y - pending.startPoint.y)**2)
        if (dist > WIRING_START_THRESHOLD) {
          handleStartWire(pending)
          setPendingStartPin(null)
          pendingRef.current = null
          session = wiringRef.current // Refresh local session to show preview immediately
        }
      }

      // Update live wire preview
      if (session) {
        const snapX = nearest?.x ?? x
        const snapY = nearest?.y ?? y
        const orthoPoints = getOrthogonalPoints(snapX, snapY, session.points)
        const absolutePoints = [...session.points, ...orthoPoints]
        updateWireShape(session.activeWireId, absolutePoints)
      }
    }

    const handlePointerDown = (e: PointerEvent) => {
      const session = wiringRef.current
      const nearest = nearestPinRef.current
      if (session) {
        e.stopPropagation()
        const { x: cursorX, y: cursorY } = editor.inputs.currentPagePoint
        const snapX = nearest?.x ?? cursorX
        const snapY = nearest?.y ?? cursorY
        
        const orthoPoints = getOrthogonalPoints(snapX, snapY, session.points)
        
        if (nearest) {
          const absolutePoints = [...session.points, ...orthoPoints]
          updateWireShape(session.activeWireId, absolutePoints)
          
          // Set end binding
          editor.updateShape({
            id: session.activeWireId,
            type: 'wire',
            props: {
              endBinding: { shapeId: nearest.shapeId, pinId: nearest.pinId }
            }
          })

          setWiringSession(null)
          wiringRef.current = null
        } else {
          const next = { ...session, points: [...session.points, ...orthoPoints] }
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

  return {
    nearestPin,
    wiringSession,
    pendingStartPin,
    setPendingStartPin,
    nearestPinRef,
    pendingRef
  }
}
