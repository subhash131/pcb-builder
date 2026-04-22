import { useState, useRef, useEffect, useCallback } from 'react'
import { Editor, createShapeId, TLShapeId } from 'tldraw'
import { useMutation } from 'convex/react'
import { api } from '@workspace/backend/_generated/api'
import { Id } from '@workspace/backend/_generated/dataModel'
import { mmToPx, pxToMm, PCB_FOOTPRINT_SCALE, FOOTPRINT_DEFS } from '@workspace/core'
import { route45, Vec } from '../lib/route45'
import { CopperTraceShape } from '../components/editor/pcb/CopperTraceShapeUtil'
import { FootprintShape } from '../components/editor/pcb/FootprintShapeUtil'

export type ActiveLayer = 'F.Cu' | 'B.Cu'

/** Pixels within which the cursor snaps to a pad centre */
const PAD_SNAP_RADIUS = 22

interface SnapTarget {
  x: number
  y: number
  netId: string | null
}

/** Detects the nearest pad in world-pixel coords across all footprint shapes */
function findNearestPad(editor: Editor, cursorX: number, cursorY: number): SnapTarget | null {
  const shapes = editor.getCurrentPageShapes()
  let nearest: SnapTarget | null = null
  let minDist = PAD_SNAP_RADIUS

  for (const shape of shapes) {
    if (shape.type !== 'footprint') continue
    const fp = shape as FootprintShape
    const def = FOOTPRINT_DEFS[fp.props.footprintId]
    if (!def) continue

    const cx = (mmToPx(def.w) * PCB_FOOTPRINT_SCALE) / 2
    const cy = (mmToPx(def.h) * PCB_FOOTPRINT_SCALE) / 2

    for (const pad of def.pads) {
      const padWorldX = fp.x + cx + mmToPx(pad.x) * PCB_FOOTPRINT_SCALE
      const padWorldY = fp.y + cy + mmToPx(pad.y) * PCB_FOOTPRINT_SCALE
      const dist = Math.hypot(cursorX - padWorldX, cursorY - padWorldY)
      if (dist < minDist) {
        minDist = dist
        nearest = {
          x: padWorldX,
          y: padWorldY,
          netId: fp.props.netIds[pad.number] ?? null,
        }
      }
    }
  }
  return nearest
}

interface WiringState {
  previewShapeId: TLShapeId
  /** Committed waypoints (absolute page pixels) */
  committedPoints: Vec[]
  layer: ActiveLayer
  width: number
}

export function usePCBWiring(
  editor: Editor,
  boardId: Id<'pcb_boards'> | undefined
) {
  const [isRouting, setIsRouting] = useState(false)
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('F.Cu')
  const [traceWidth, setTraceWidth] = useState(0.25) // mm
  const [snapTarget, setSnapTarget] = useState<SnapTarget | null>(null)

  const wiringRef = useRef<WiringState | null>(null)
  const snapRef = useRef<SnapTarget | null>(null)
  const isRoutingRef = useRef(false)
  const activeLayerRef = useRef<ActiveLayer>('F.Cu')
  const traceWidthRef = useRef(0.25)

  // Keep refs in sync
  useEffect(() => { isRoutingRef.current = isRouting }, [isRouting])
  useEffect(() => { activeLayerRef.current = activeLayer }, [activeLayer])
  useEffect(() => { traceWidthRef.current = traceWidth }, [traceWidth])

  const addTrace = useMutation(api.pcb.addTrace)
  const deleteTrace = useMutation(api.pcb.deleteTrace)

  // ─── Live preview shape management ───────────────────────────────────────

  const getPreviewPoints = (
    committedPoints: Vec[],
    cursorX: number,
    cursorY: number
  ): Vec[] => {
    const last = committedPoints[committedPoints.length - 1]
    if (!last) return committedPoints
    const routed = route45(last, { x: cursorX, y: cursorY })
    // routed = [last, ...new points] — skip the first since it equals last
    return [...committedPoints, ...routed.slice(1)]
  }

  const updatePreviewShape = (
    state: WiringState,
    cursorX: number,
    cursorY: number,
    snap: SnapTarget | null
  ) => {
    const endX = snap?.x ?? cursorX
    const endY = snap?.y ?? cursorY
    const allPoints = getPreviewPoints(state.committedPoints, endX, endY)

    editor.updateShape<CopperTraceShape>({
      id: state.previewShapeId,
      type: 'copper_trace',
      x: 0,
      y: 0,
      props: {
        points: allPoints,
        layer: state.layer,
        width: state.width,
        isPreview: true,
        traceDbId: '',
      },
    })
  }

  // ─── Start routing ────────────────────────────────────────────────────────

  const startRouting = useCallback(() => {
    setIsRouting(true)
    editor.setCurrentTool('select')
    editor.selectNone()
  }, [editor])

  const stopRouting = useCallback(() => {
    // Clean up any in-progress preview
    if (wiringRef.current) {
      editor.deleteShape(wiringRef.current.previewShapeId)
      wiringRef.current = null
    }
    setIsRouting(false)
    setSnapTarget(null)
  }, [editor])

  // ─── Pointer handlers ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!isRouting) return

    const handlePointerMove = () => {
      if (!isRoutingRef.current) return
      const { x, y } = editor.inputs.currentPagePoint
      const snap = findNearestPad(editor, x, y)
      setSnapTarget(snap)
      snapRef.current = snap

      const state = wiringRef.current
      if (state) {
        updatePreviewShape(state, x, y, snap)
      }
    }

    const handlePointerDown = (e: PointerEvent) => {
      if (!isRoutingRef.current) return
      const state = wiringRef.current
      const { x, y } = editor.inputs.currentPagePoint
      const snap = snapRef.current

      const endX = snap?.x ?? x
      const endY = snap?.y ?? y

      if (!state) {
        // ── FIRST CLICK: anchor the start of the trace ──
        const id = createShapeId()
        const startPt: Vec = { x: endX, y: endY }
        editor.createShape<CopperTraceShape>({
          id,
          type: 'copper_trace',
          x: 0,
          y: 0,
          props: {
            points: [startPt, startPt], // start + cursor (will update)
            layer: activeLayerRef.current,
            width: traceWidthRef.current,
            isPreview: true,
            traceDbId: '',
          },
        })
        wiringRef.current = {
          previewShapeId: id,
          committedPoints: [startPt],
          layer: activeLayerRef.current,
          width: traceWidthRef.current,
        }
        e.stopPropagation()
        return
      }

      // ── SUBSEQUENT CLICKS ──
      e.stopPropagation()

      const routed = route45(
        state.committedPoints[state.committedPoints.length - 1]!,
        { x: endX, y: endY }
      )
      const newPoints = [...state.committedPoints, ...routed.slice(1)]

      if (snap) {
        // ── Final click on a pad: commit the trace ──
        editor.deleteShape(state.previewShapeId)
        wiringRef.current = null

        // Save finalized trace to tldraw canvas (permanent shape)
        const finalId = createShapeId()
        editor.createShape<CopperTraceShape>({
          id: finalId,
          type: 'copper_trace',
          x: 0,
          y: 0,
          props: {
            points: newPoints,
            layer: state.layer,
            width: state.width,
            isPreview: false,
            traceDbId: '', // will be updated after DB insert
          },
        })

        // Persist to Convex
        if (boardId) {
          const mmPoints = newPoints.map(p => ({
            x: pxToMm(p.x),
            y: pxToMm(p.y),
          }))
          addTrace({
            boardId,
            points: mmPoints,
            layer: state.layer,
            width: state.width,
            netId: snap.netId ?? undefined,
          }).then(newDbId => {
            // Tag the shape with the DB id for future deletion
            editor.updateShape<CopperTraceShape>({
              id: finalId,
              type: 'copper_trace',
              props: { traceDbId: newDbId as string },
            })
          }).catch(err => console.error('[PCB] Failed to save trace', err))
        }

        // Stay in routing mode — ready for next trace
      } else {
        // ── Intermediate click: add waypoint ──
        wiringRef.current = { ...state, committedPoints: newPoints }
        updatePreviewShape({ ...state, committedPoints: newPoints }, endX, endY, null)
      }
    }

    const handlePointerUp = () => {
      /* nothing — we use pointerdown for everything */
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopRouting()
      }
      if (e.key === 'Backspace' && wiringRef.current) {
        // Undo last waypoint
        const state = wiringRef.current
        if (state.committedPoints.length > 1) {
          const newCommitted = state.committedPoints.slice(0, -1)
          wiringRef.current = { ...state, committedPoints: newCommitted }
          const { x, y } = editor.inputs.currentPagePoint
          updatePreviewShape({ ...state, committedPoints: newCommitted }, x, y, snapRef.current)
        } else {
          stopRouting()
        }
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
  }, [isRouting, editor, boardId, addTrace, stopRouting])

  // ─── Delete trace by tldraw shape id ─────────────────────────────────────

  const deleteTraceShape = useCallback((shapeId: TLShapeId) => {
    const shape = editor.getShape(shapeId) as CopperTraceShape | undefined
    if (!shape || shape.type !== 'copper_trace') return
    const dbId = shape.props.traceDbId
    editor.deleteShape(shapeId)
    if (dbId && boardId) {
      deleteTrace({ id: dbId as Id<'pcb_traces'> }).catch(err =>
        console.error('[PCB] Failed to delete trace', err)
      )
    }
  }, [editor, boardId, deleteTrace])

  return {
    isRouting,
    activeLayer,
    setActiveLayer,
    traceWidth,
    setTraceWidth,
    snapTarget,
    startRouting,
    stopRouting,
    deleteTraceShape,
  }
}
