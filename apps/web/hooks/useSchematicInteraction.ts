import { useState, useRef, useEffect } from 'react'
import { Editor, createShapeId } from 'tldraw'

export function useSchematicInteraction(editor: Editor) {
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

  return {
    nearestPin,
    wiringSession,
    pendingStartPin,
    setPendingStartPin,
    nearestPinRef,
    pendingRef
  }
}
