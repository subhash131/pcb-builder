import { useState, useRef, useEffect } from 'react'
import { Editor, createShapeId } from 'tldraw'

type NearestPin = { x: number, y: number, shapeId: string, pinId: string } | null

// Configuration constants for interaction behavior
/** Distance in pixels at which a pin becomes "active" for proximity snapping */
const PROXIMITY_RADIUS = 10
/** Minimum pixels to drag before a wiring session is officially started (prevents accidental clicks) */
const WIRING_START_THRESHOLD = 5

export function useSchematicInteraction(editor: Editor) {
  const [nearestPin, setNearestPin] = useState<NearestPin>(null)
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

  // Listen for symbol movements and update bound wires
  useEffect(() => {
    const cleanup = editor.sideEffects.registerAfterChangeHandler('shape', (prev, next) => {
      if (next.type !== 'symbol') return
      
      // If position or size changed, update connected wires
      if (prev.x !== next.x || prev.y !== next.y || (prev.props as any).w !== (next.props as any).w || (prev.props as any).h !== (next.props as any).h) {
        const wires = editor.getCurrentPageShapes().filter(s => s.type === 'wire')
        for (const wire of wires) {
          const props = wire.props as any
          let needsUpdate = false
          const absolutePoints = props.points.map((p: any) => ({ 
            x: p.x + wire.x, 
            y: p.y + wire.y 
          }))

          const stretch = (points: {x: number, y: number}[], targetIndex: number, newPoint: {x: number, y: number}) => {
            const result = [...points]
            const oldPoint = result[targetIndex]
            if (!oldPoint) return result
            
            result[targetIndex] = newPoint

            const neighborIndex = targetIndex === 0 ? 1 : points.length - 2
            if (neighborIndex < 0 || neighborIndex >= points.length) return result

            const neighbor = result[neighborIndex]
            if (!neighbor) return result
            
            const dx = Math.abs(oldPoint.x - neighbor.x)
            const dy = Math.abs(oldPoint.y - neighbor.y)

            // If 2 points and moving diagonal: Add elbow
            if (points.length === 2 && newPoint.x !== neighbor.x && newPoint.y !== neighbor.y) {
              const elbow = { x: newPoint.x, y: neighbor.y }
              if (targetIndex === 0) result.splice(1, 0, elbow)
              else result.splice(points.length - 1, 0, elbow)
              return result
            }

            // If 3+ points, maintain orthogonality
            if (dx < 0.1) { // Was Vertical
              result[neighborIndex] = { x: newPoint.x, y: neighbor.y }
            } else if (dy < 0.1) { // Was Horizontal
              result[neighborIndex] = { x: neighbor.x, y: newPoint.y }
            }
            return result
          }

          if (props.startBinding?.shapeId === next.id) {
            const pin = (next.props as any).pins.find((p: any) => p.id === props.startBinding.pinId)
            if (pin) {
              const newPoint = {
                x: next.x + (pin.x * (next.props as any).w),
                y: next.y + (pin.y * (next.props as any).h)
              }
              const stretchedPoints = stretch(absolutePoints, 0, newPoint)
              updateWireShape(wire.id, stretchedPoints)
            }
          } else if (props.endBinding?.shapeId === next.id) {
            const pin = (next.props as any).pins.find((p: any) => p.id === props.endBinding.pinId)
            if (pin) {
              const newPoint = {
                x: next.x + (pin.x * (next.props as any).w),
                y: next.y + (pin.y * (next.props as any).h)
              }
              const stretchedPoints = stretch(absolutePoints, absolutePoints.length - 1, newPoint)
              updateWireShape(wire.id, stretchedPoints)
            }
          }
        }
      }
    })
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
      
      const dx = Math.abs(x - lastPoint.x)
      const dy = Math.abs(y - lastPoint.y)
      
      // If we are already aligned, just return the point
      if (dx < 1 || dy < 1) return [{ x, y }]

      // Calculate elbow: prefer horizontal then vertical if dx > dy, or based on previous segment
      // For simplicity, we use the larger delta to decide the first segment direction
      const elbow = dx > dy ? { x, y: lastPoint.y } : { x: lastPoint.x, y }
      
      return [elbow, { x, y }]
    }


    const handlePointerMove = () => {
      const { x, y } = editor.inputs.currentPagePoint
      let session = wiringRef.current
      const pending = pendingRef.current

      // Update proximity hotspot
      const shapes = editor.getCurrentPageShapes()
      let nearest: NearestPin = null
      let minDistance = PROXIMITY_RADIUS

      for (const shape of shapes) {
        if (shape.type === 'symbol') {
          const props = shape.props as any
          for (const pin of props.pins) {
            const pinX = shape.x + (pin.x * props.w)
            const pinY = shape.y + (pin.y * props.h)
            const dist = Math.sqrt((x - pinX)**2 + (y - pinY)**2)
            if (dist < minDistance) {
              minDistance = dist
              nearest = { x: pinX, y: pinY, shapeId: shape.id, pinId: pin.id }
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
