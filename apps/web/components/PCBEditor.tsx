import { Tldraw, useEditor, track, Editor, TLShapePartial, TLRecord } from 'tldraw'
import 'tldraw/tldraw.css'
import { useQuery, useMutation } from "convex/react"
import { api } from "@workspace/backend/_generated/api"
import { Id } from "@workspace/backend/_generated/dataModel"
import { useEffect, useMemo, useRef, useCallback, createContext, useContext } from 'react'

import { FootprintShapeUtil } from './editor/pcb/FootprintShapeUtil'
import { RatsnestShapeUtil } from './editor/pcb/RatsnestShapeUtil'
import { computeRatsnest } from '../lib/pcb-logic'
import { useSchematicStore } from '../store/useSchematicStore'
import { mmToPx, pxToMm } from '@workspace/core'
import { PCBSheetSettings } from './editor/PCBSheetSettings'

function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let timeoutId: ReturnType<typeof setTimeout>
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), ms)
  }
  debounced.cancel = () => clearTimeout(timeoutId)
  return debounced
}

const shapeUtils = [FootprintShapeUtil, RatsnestShapeUtil]

const PCBContext = createContext<Id<"schematics"> | null>(null)

const KiCadPCBSheet = track(() => {
  const schematicId = useContext(PCBContext)
  const board = useQuery(api.pcb.getBoardBySchematicId, schematicId ? { schematicId } : "skip" as any)
  
  if (!board) return null

  const width = mmToPx(board.boardWidth)
  const height = mmToPx(board.boardHeight)
  
  const FRAME_COLOR = '#ae40a5'
  const MARGIN = mmToPx(10)
  const FRAME_W = mmToPx(4)
  
  const innerW = width - (MARGIN * 2)
  const innerH = height - (MARGIN * 2)
  const usableW = innerW - FRAME_W * 2
  const usableH = innerH - FRAME_W * 2
  
  const DIVISION_SIZE = mmToPx(50)
  const hParts = Math.round(usableW / DIVISION_SIZE)
  const vParts = Math.round(usableH / DIVISION_SIZE)

  return (
    <div
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        left: 0,
        top: 0,
        width,
        height,
        border: `1px dashed ${FRAME_COLOR}88`,
        boxSizing: 'border-box'
      }}
    >
      {/* Outer Frame */}
      <div style={{
        position: 'absolute',
        left: MARGIN,
        top: MARGIN,
        width: innerW,
        height: innerH,
        border: `2px solid ${FRAME_COLOR}`,
        boxSizing: 'border-box'
      }} />

      {/* Inner Frame */}
      <div style={{
        position: 'absolute',
        left: MARGIN + FRAME_W,
        top: MARGIN + FRAME_W,
        width: usableW,
        height: usableH,
        border: `1px solid ${FRAME_COLOR}`,
        boxSizing: 'border-box'
      }} />

      {/* Horizontal Labels */}
      {Array.from({ length: hParts }).map((_, i) => {
        const xPos = MARGIN + FRAME_W + (usableW / hParts) * (i + 0.5)
        const labelStyle: React.CSSProperties = {
          position: 'absolute',
          left: xPos,
          transform: 'translateX(-50%) translateY(-50%)',
          color: FRAME_COLOR,
          fontFamily: 'monospace',
          fontSize: 24,
          fontWeight: 'bold'
        }
        return (
          <div key={`h-${i}`}>
            <div style={{ ...labelStyle, top: MARGIN + (FRAME_W / 2) }}>{i + 1}</div>
            <div style={{ ...labelStyle, bottom: MARGIN + (FRAME_W / 2), transform: 'translateX(-50%) translateY(50%)' }}>{i + 1}</div>
          </div>
        )
      })}

      {/* Vertical Labels */}
      {Array.from({ length: vParts }).map((_, i) => {
        const yPos = MARGIN + FRAME_W + (usableH / vParts) * (i + 0.5)
        const labelStyle: React.CSSProperties = {
          position: 'absolute',
          top: yPos,
          transform: 'translateY(-50%) translateX(-50%)',
          color: FRAME_COLOR,
          fontFamily: 'monospace',
          fontSize: 24,
          fontWeight: 'bold'
        }
        return (
          <div key={`v-${i}`}>
            <div style={{ ...labelStyle, left: MARGIN + (FRAME_W / 2) }}>{String.fromCharCode(65 + i)}</div>
            <div style={{ ...labelStyle, right: MARGIN + (FRAME_W / 2), transform: 'translateY(-50%) translateX(50%)' }}>{String.fromCharCode(65 + i)}</div>
          </div>
        )
      })}

      {/* Title Block */}
      <div 
        style={{
          position: 'absolute',
          bottom: MARGIN + FRAME_W,
          right: MARGIN + FRAME_W,
          width: 450,
          height: 200,
          borderTop: `2px solid ${FRAME_COLOR}`,
          borderLeft: `2px solid ${FRAME_COLOR}`,
          padding: 16,
          color: FRAME_COLOR,
          fontFamily: 'monospace',
          fontSize: 16,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#00050b88',
          backdropFilter: 'blur(2px)'
        }}
      >
        <div style={{ borderBottom: `1px solid ${FRAME_COLOR}44`, paddingBottom: 8, marginBottom: 8, fontSize: 22, fontWeight: 'bold' }}>
          PCB LAYOUT ASSISTANT
        </div>
        <div>Sheet: 1/1</div>
        <div style={{ wordBreak: 'break-all' }}>Preset: {board.boardPreset || 'A4'}</div>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
          <span>Size: {Math.round(board.boardWidth)}x{Math.round(board.boardHeight)}mm</span>
          <span>Rev: v1.0</span>
        </div>
      </div>
    </div>
  )
})

const PCBEditorUI = track(({ schematicId }: { schematicId: Id<"schematics"> }) => {
  const editor = useEditor()
  const netlist = useSchematicStore(s => s.netlist)
  
  const board = useQuery(api.pcb.getBoardBySchematicId, { schematicId })
  const footprints = useQuery(api.pcb.getFootprints, board ? { boardId: board._id } : "skip" as any)
  const updateFootprints = useMutation(api.pcb.updateFootprints)

  // Track pending updates to avoid cursor fighting
  const pendingUpdates = useRef<Map<string, { x: number, y: number, rotation: number }>>(new Map())

  // 1. Sync Footprints from Convex to tldraw (Smart Sync)
  useEffect(() => {
    if (!footprints) return
    
    editor.run(() => {
      const shapesToCreate: any[] = []
      const shapesToUpdate: any[] = []
      
      footprints.forEach(f => {
        const id = `shape:footprint-${f._id}` as any
        
        // Skip if user is currently interacting with this shape or we have pending local changes
        if (pendingUpdates.current.has(id)) return
        if (editor.getSelectedShapeIds().includes(id)) return // Basic heuristic: don't overwrite selected shapes

        const shapeData = {
          id,
          type: 'footprint',
          x: mmToPx(f.x),
          y: mmToPx(f.y),
          rotation: (f.rotation * Math.PI) / 180,
          props: {
            componentRef: f.componentRef,
            footprintId: f.footprintId,
            layer: f.layer,
            w: 10,
            h: 10,
            pads: [],
          }
        }

        if (editor.store.has(id)) {
          // Only update if actually different from what we want
          const current = editor.getShape(id)
          if (current && (
            Math.abs(current.x - shapeData.x) > 0.01 || 
            Math.abs(current.y - shapeData.y) > 0.01 ||
            Math.abs(current.rotation - shapeData.rotation) > 0.01
          )) {
            shapesToUpdate.push(shapeData)
          }
        } else {
          shapesToCreate.push(shapeData)
        }
      })

      // Remove footprints that are no longer in DB
      const currentFpIds = new Set(footprints.map(f => `shape:footprint-${f._id}`))
      const toDelete = editor.getCurrentPageShapes()
        .filter(s => s.type === 'footprint' && !currentFpIds.has(s.id))
        .map(s => s.id)

      if (shapesToCreate.length) editor.createShapes(shapesToCreate)
      if (shapesToUpdate.length) editor.updateShapes(shapesToUpdate)
      if (toDelete.length) editor.deleteShapes(toDelete)
    })
  }, [editor, footprints])

  // 2. Real-time Ratsnest (Computed from store)
  useEffect(() => {
    const updateRatsnest = () => {
      const allShapes = editor.getCurrentPageShapes()
      const fpShapes = allShapes.filter(s => s.type === 'footprint')
      
      // Convert current store shapes back to the format computeRatsnest expects
      const currentFootprints = fpShapes.map(s => ({
        componentRef: (s.props as any).componentRef,
        x: pxToMm(s.x),
        y: pxToMm(s.y),
        rotation: (s.rotation * 180) / Math.PI
      }))

      const ratsnestLines = computeRatsnest(netlist, currentFootprints)
      
      const ratsnestId = 'shape:ratsnest' as any
      const data = {
        id: ratsnestId,
        type: 'ratsnest',
        x: 0,
        y: 0,
        props: { lines: ratsnestLines },
        isLocked: true,
      }

      if (editor.store.has(ratsnestId)) {
        editor.updateShape(data)
      } else {
        editor.createShape(data)
      }
    }

    // Update initially and listen for store changes
    updateRatsnest()
    const cleanup = editor.store.listen(({ changes }) => {
      // Only recompute if footprints moved or were added/removed
      const isFp = (s: TLRecord) => s.typeName === 'shape' && (s as any).type === 'footprint'
      
      const hasFpChanges = 
        Object.values(changes.added).some(isFp) ||
        Object.values(changes.updated).some(([, next]) => isFp(next)) ||
        Object.values(changes.removed).some(isFp)

      if (hasFpChanges) {
        updateRatsnest()
      }
    }, { source: 'user', scope: 'document' })

    return () => cleanup()
  }, [editor, netlist])

  // 3. Persistence: Debounced Batch Push
  const pushUpdates = useMemo(() => debounce(async (updates: any[]) => {
    if (updates.length === 0) return
    console.log(`[PCB] Pushing ${updates.length} footprint updates to DB`)
    try {
      await updateFootprints({ updates })
      // Clear pending updates for these IDs
      updates.forEach(u => pendingUpdates.current.delete(`shape:footprint-${u.id}`))
    } catch (err) {
      console.error("Failed to update footprints", err)
    }
  }, 500), [updateFootprints])

  useEffect(() => {
    const cleanup = editor.store.listen(({ changes }) => {
      const batch: any[] = []
      Object.keys(changes.updated).forEach((id) => {
        const next = editor.getShape(id as any)
        if (next?.type === 'footprint') {
          const dbId = next.id.replace('shape:footprint-', '')
          const update = {
            id: dbId as Id<"pcb_footprints">,
            x: pxToMm(next.x),
            y: pxToMm(next.y),
            rotation: (next.rotation * 180) / Math.PI
          }
          batch.push(update)
          pendingUpdates.current.set(id, { x: next.x, y: next.y, rotation: next.rotation })
        }
      })

      if (batch.length > 0) {
        pushUpdates(batch)
      }
    }, { source: 'user', scope: 'document' })

    return () => {
      cleanup()
      pushUpdates.cancel()
    }
  }, [editor, pushUpdates])

  // 4. CAMERA PERSISTENCE: Download
  const cameraRestored = useRef(false)
  useEffect(() => {
    if (!board || cameraRestored.current) return
    if (board.cameraX !== undefined && board.cameraY !== undefined && board.cameraZoom !== undefined) {
      editor.setCamera({ x: board.cameraX, y: board.cameraY, z: board.cameraZoom })
    }
    cameraRestored.current = true
  }, [editor, board])

  // 5. CAMERA PERSISTENCE: Upload (Debounced)
  const updateCamera = useMutation(api.pcb.updateCamera)
  const pushCamera = useMemo(() => debounce(async (cam: { x: number, y: number, z: number }) => {
    if (!board) return
    try {
      await updateCamera({ id: board._id, x: cam.x, y: cam.y, zoom: cam.z })
    } catch (err) {
      console.error("Failed to sync PCB camera", err)
    }
  }, 1000), [updateCamera, board?._id])

  useEffect(() => {
    const cleanup = editor.store.listen(({ changes }) => {
      const hasCameraChanges = Object.values(changes.updated).some(([, next]) => 
        next.typeName === 'camera' || next.typeName === 'instance'
      )
      
      if (hasCameraChanges) {
        const cam = editor.getCamera()
        pushCamera(cam)
      }
    })

    return () => {
      cleanup()
      pushCamera.cancel()
    }
  }, [editor, pushCamera])

  // 6. Enable Grid
  useEffect(() => {
    editor.updateInstanceState({ isGridMode: true })
  }, [editor])

  return (
    <>
      {board && (
        <PCBSheetSettings 
          boardId={board._id}
          currentPreset={board.boardPreset}
          currentWidth={board.boardWidth}
          currentHeight={board.boardHeight}
        />
      )}
    </>
  )
})

export default function PCBEditor({ schematicId }: { schematicId: Id<"schematics"> }) {
  return (
    <div className="fixed inset-0 bg-[#00050b]" style={{ '--color-grid': '#1a2230' } as any}>
      <PCBContext.Provider value={schematicId}>
        <Tldraw 
          shapeUtils={shapeUtils} 
          inferDarkMode={true}
          components={{
            OnTheCanvas: KiCadPCBSheet,
            Toolbar: null,
            StylePanel: null,
            PageMenu: null,
            MainMenu: null,
            ActionsMenu: null,
            HelpMenu: null,
          }}
        >
          <PCBEditorUI schematicId={schematicId} />
        </Tldraw>
      </PCBContext.Provider>
    </div>
  )
}
